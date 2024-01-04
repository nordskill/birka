const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { File } = require('../../models/file');
const { generateImageMarkup, generateSVGMarkup, generateVideoMarkup} = require('../../public/js/cms/generateFileMarkup');

const AMOUNT_OF_FILES_PER_PAGE = 10;

// CMS Files
router.get('/', async (req, res, next) => {
    let filesData = [];
    let files = [];
    let imagesAmount = videosAmount = 0;

    try {
        filesData = await File.find()
            .sort({
                date_created: 'desc'
            })
            .select('-__v -__t')
            .populate('tags')
            .lean();

        for(const file of filesData){
            if(files.length <= AMOUNT_OF_FILES_PER_PAGE){
                const folderName = file.hash.slice(0, 2);
                const pathToFile = path.join('/files', folderName, `${file.file_name}.${file.extension}`);

                if(file.mime_type == 'image/svg+xml'){
                    files.push(await generateSVGMarkup(file, pathToFile));

                } else if (file.mime_type.startsWith('video/')) {
                    files.push(generateVideoMarkup(file));

                } else {
                    files.push(generateImageMarkup(file, pathToFile));
                }
            }

            if(file.mime_type.startsWith('image/')){
                imagesAmount++;
            } else if (file.mime_type.startsWith('video/')) {
                videosAmount++;
            }
        };

        res.render('cms/files', {
            title: 'Files',
            template_name: 'files',
            active: 'files',
            files,
            pageAmount: Math.ceil((imagesAmount + videosAmount)/AMOUNT_OF_FILES_PER_PAGE),
            imagesAmount,
            videosAmount,
            breadcrumbs: [
                { name: 'CMS', href: '/cms' },
                { name: 'Files', href: '/cms/files' }
            ],
            scripts: [
                'files.js'
            ]
        });

    } catch (err) {
        return next(err);
    }

});



module.exports = router;