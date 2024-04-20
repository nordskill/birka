const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const crypto = require('crypto');

const { File, Image, Video } = require('../../models/file');
const { addTags, removeTags } = require('../../controllers/tag-controller');

const OperationalError = require('../../functions/operational-error');
const generateHash = require('../../functions/generate-hash');
const slugify = require('../../functions/slugify');
const resizeImage = require('../../functions/image-resizer');

const tempFilesDirectory = path.join('public', 'files', '_temp');

const storage = multer.diskStorage(
    {
        destination: async function (req, file, cb) {
            try {
                await fs.access(tempFilesDirectory);
            } catch (error) {
                await fs.mkdir(tempFilesDirectory, { recursive: true });
            }
            cb(null, tempFilesDirectory);
        },
        filename: function (req, file, cb) {
            const filename = Buffer.from(file.originalname, 'binary').toString('utf-8');
            cb(null, filename);
        }
    }
);

const upload = multer({ storage: storage });

router.get('/', async (req, res, next) => {
    const countsByType = await File.aggregate([
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        }
    ]).exec();

    const AMOUNT_OF_FILES_PER_PAGE = 30;

    let limit = 0;
    let skip = 0;

    if (req.query.page) {
        const page = parseInt(req.query.page);
        skip = (page - 1) * AMOUNT_OF_FILES_PER_PAGE;
        limit = AMOUNT_OF_FILES_PER_PAGE;
    }

    const fileType = req.query.type;

    try {
        let condition = {};
        if (fileType) condition.type = fileType;

        const files = await File.find(condition)
            .sort({ createdAt: 'desc' })
            .limit(limit)
            .skip(skip)
            .select('-__v')
            .populate('tags', '-_id -__v')
            .lean();

        let totalCount;
        
        totalCount = countsByType.reduce((sum, fileType) => sum + fileType.count, 0);

        // sort countsByType by _id
        countsByType.sort((a, b) => {
            if (a._id < b._id) return -1;
            if (a._id > b._id) return 1;
            return 0;
        });

        res.json({files, countsByType, totalCount});
    } catch (err) {
        next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {

        const file = await File.findById(req.params.id)
            .select('-__v')
            .populate('tags', '-__v')
            .lean();

        if (!file) {
            throw new OperationalError('File not found', 404);
        }

        res.json(file);
    } catch (err) {
        next(err);
    }
});

router.post('/', upload.single('file'), async (req, res, next) => {

    if (!req.file) {
        return next(
            new OperationalError('No file uploaded', 400)
        );
    }

    const file = req.file;
    const fileAdditionalData = JSON.parse(req.body.fileData);
    const fileType = file.mimetype.split('/')[0];

    if (!['video', 'image'].includes(fileType)) {
        return next(
            new OperationalError(`File must be type of image or video, not ${fileType}`, 400)
        );
    }

    const hash = await generateHash(file.path);
    const foundFile = await File.findOne({ hash }).lean();

    if (foundFile) {
        deleteFilesFromTemp();
        return next(
            new OperationalError('File is already in the database.', 400)
        );
    }

    try {
        const fileName = await moveFile(file, hash);
        let fileData = await saveFile(file, fileType, fileAdditionalData, hash, fileName);

        if (fileData.type === 'image') {
            fileData.status = 'processing';
            await fileData.save();
            optimizeImage(fileData);
        }

        res.json({ success: true, file: fileData });
    } catch (err) {
        next(err);
    }
});

router.put('/:id', async (req, res, next) => {
    const id = req.params.id;
    const contentToUpdate = req.body;

    if (JSON.stringify(contentToUpdate) === '{}') {
        return next(
            new OperationalError('Provide data to update the file with.', 400)
        );
    }

    try {

        let updatedFile;

        if ('alt' in contentToUpdate) {
            updatedFile = await Image.findByIdAndUpdate(
                id,
                contentToUpdate
            );
        } else {
            updatedFile = await File.findByIdAndUpdate(
                id,
                contentToUpdate
            );
        }

        if (!updatedFile) {
            throw new OperationalError('File not found.', 404);
        }

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', async (req, res, next) => {
    const id = req.params.id;

    const file = await File.findById(id);

    let undeletedFiles = [];
    let error;

    if (!file) {
        return next(
            new OperationalError('File does not exist.', 404)
        );
    }

    try {
        const subfolder = file.hash.substring(0, 2);
        const fileName = file.file_name + '.' + file.extension;
        const filePath = path.join('public', 'files', subfolder, fileName);

        if (file.sizes.length) {
            undeletedFiles = await deleteResizedImages(subfolder, file);
            if (undeletedFiles.length) throw new OperationalError('Some of the optimized files were not deleted.', 500);
        }

        await deleteFile(filePath);
        await File.findByIdAndDelete(id);

    } catch (err) {
        error = err.message;
    }

    if (error) {
        if (undeletedFiles.length > 0) {
            return res.status(207).json({ success: false, undeletedFiles, error })
        } else {
            next(error);
        }
    } else {
        return res.json({ success: true });
    }
});

router.delete('/', async (req, res, next) => {
    const IDs = req.body;

    if (!Array.isArray(IDs) || IDs.length === 0) {
        return next(new OperationalError('You need to provide an array of IDs.', 400));
    }

    let deletedFiles = [];
    let undeletedFiles = [];
    let errors = [];

    for (const id of IDs) {
        try {
            const file = await File.findById(id);
            if (!file) {
                throw new OperationalError('File does not exist.', 404);
            }

            const subfolder = file.hash.substring(0, 2);
            const fileName = file.file_name + '.' + file.extension;
            const filePath = path.join('public', 'files', subfolder, fileName);

            if (file.sizes?.length) {
                undeletedFiles = await deleteResizedImages(subfolder, file);
                if (undeletedFiles.length) {
                    errors.push({
                        id,
                        message: "Some of the optimized files were not deleted.",
                        undeleted_files: undeletedFiles
                    });
                    continue;
                }
            }

            await deleteFile(filePath);
            await File.findByIdAndDelete(id);

            deletedFiles.push(id);
        } catch (err) {
            errors.push({ id, error: err.message });
        }
    }

    if (errors.length > 0) {
        console.log(errors)
        if (deletedFiles.length === 0) { // All IDs resulted in errors, none were deleted
            return res.status(500).json({ success: false, message: "None of the files were deleted", errors });
        } else { // Some IDs were deleted, but there were also some errors
            return res.status(207).json({ success: true, deletedFiles, errors });
        }
    } else { // All files were successfully deleted
        res.json({ success: true, deletedFiles });
    }

});

router.patch('/:id/tags', addTags(File));
router.delete('/:id/tags', removeTags(File));

module.exports = router;

async function deleteFile(filePath) {
    try {
        await fs.unlink(filePath);
    } catch (err) {
        console.log('dupa')
        throw new Error('Error deleting file: ' + err.message);
    }
}

async function deleteFilesFromTemp() {
    const files = await fs.readdir(tempFilesDirectory);
    for (const file of files) {
        const filePath = path.join(tempFilesDirectory, file);
        await deleteFile(filePath);
    }
}

async function deleteResizedImages(subfolder, file) {
    const { id, file_name, sizes, optimized_format } = file;

    let basePath = path.join('public', 'files', subfolder);

    let filesNotFound = [];
    let sizesNotFound = [];

    for await (const size of sizes) {
        const directoryPath = path.join(basePath, size.toString());
        const filePath = path.join(directoryPath, file_name + '.' + optimized_format);

        try {
            await deleteFile(filePath);

            const files = await fs.readdir(directoryPath);

            if (files.length === 0) {
                await fs.rmdir(directoryPath);
            }
        } catch {
            filesNotFound.push(filePath);
            sizesNotFound.push(size);
        }
    }

    if (filesNotFound.length) {
        await Image.findByIdAndUpdate(id, { sizes: sizesNotFound });
    }

    return filesNotFound;

}

async function saveFile(file, fileType, fileAdditionalData, hash, fileName) {

    const { mimetype, size } = file;
    const { ext: fileExtension, name: basename } = path.parse(fileName);
    const fileProps = {
        type: fileType,
        description: '',
        size,
        file_name: basename,
        mime_type: mimetype,
        extension: fileExtension.slice(1),
        hash,
        tags: [],
    };

    let savedFile;

    switch (fileType) {
        case 'image':
            if (mimetype === 'image/svg+xml') {
                savedFile = await new SVG({
                    ...fileProps,
                    title: ''
                }).save();
            } else {
                savedFile = await new Image({
                    ...fileProps,
                    alt: '',
                    height: fileAdditionalData.height,
                    width: fileAdditionalData.width,
                }).save();
            }
            break;
        case 'video':
            savedFile = await new Video({
                ...fileProps,
                height: fileAdditionalData.height,
                width: fileAdditionalData.width,
                duration: fileAdditionalData.duration,
                title: '',
            }).save();
            break;
    }

    return savedFile;

}

async function moveFile(file, hash) {
    try {
        const newFolderPath = path.join(__dirname, '..', '..', 'public', 'files', hash.substring(0, 2));
        await ensureDirectoryExists(newFolderPath);

        let fileName = file.filename;
        let newFilePath = path.join(newFolderPath, fileName);

        if (await fileExists(newFilePath)) {
            // Add a unique suffix to the file name
            fileName = addUniqueSuffix(file.filename);
            newFilePath = path.join(newFolderPath, fileName);
        }

        await fs.rename(file.path, newFilePath);
        return fileName; // Return the final name of the file

    } catch (error) {
        console.error('Error in moveFile:', error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

async function ensureDirectoryExists(directoryPath) {
    try {
        await fs.access(directoryPath);
    } catch (error) {
        await fs.mkdir(directoryPath, { recursive: true });
    }
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        return false;
    }
}

function generateUniqueSuffix() {
    const epochTime = Date.now().toString(36); // Using base 36 for a more compact representation
    const randomHex = crypto.randomBytes(2).toString('hex');
    return epochTime + randomHex;
}

function addUniqueSuffix(filename) {
    const uniqueSuffix = generateUniqueSuffix();
    const parsedName = path.parse(filename).name;
    const extension = path.extname(filename);
    return `${parsedName}-${uniqueSuffix}${extension}`;
}

async function optimizeImage(file) {

    const IMAGE_SIZES = [150, 300, 600, 1024, 1500, 2048, 2560];
    const folder = path.join('public', 'files', file.hash.substring(0, 2));

    const optimization = await resizeImage(`${folder}/${file.file_name}.${file.extension}`, IMAGE_SIZES, folder);
    console.log(file.file_name, ':', Math.round(optimization.time), 'ms');
    file.status = 'optimized';
    file.sizes = optimization.sizes;
    file.optimized_format = optimization.format;
    await file.save();

}