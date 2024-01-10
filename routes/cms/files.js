const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { File } = require('../../models/file');
const { generateImageMarkup, generateSVGMarkup, generateVideoMarkup } = require('../../public/js/cms/generateFileMarkup');

const AMOUNT_OF_FILES_PER_PAGE = 10;

// GET /cms/files?page=1&type=video
router.get('/', async (req, res) => {

    // Get counts of each file type
    const countsByType = await File.aggregate([
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        }
    ]).exec();

    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const skip = (page - 1) * AMOUNT_OF_FILES_PER_PAGE;
    const fileType = req.query.type;

    try {

        let condition = {};
        if (fileType) condition.type = fileType;

        const files = await File.find(condition)
            .skip(skip)
            .limit(AMOUNT_OF_FILES_PER_PAGE)
            .sort({ createdAt: -1 })
            .exec();

        // Get total number of files to calculate total pages
        let totalCount;
        if (fileType) {
            const fileTypeCount = countsByType.find(count => count._id === fileType);
            totalCount = fileTypeCount ? fileTypeCount.count : 0;
        } else {
            totalCount = countsByType.reduce((sum, fileType) => sum + fileType.count, 0);
        }

        const totalPages = Math.ceil(totalCount / AMOUNT_OF_FILES_PER_PAGE);

        // sort countsByType by _id
        countsByType.sort((a, b) => {
            if (a._id < b._id) return -1;
            if (a._id > b._id) return 1;
            return 0;
        });

        res.render('cms/files', {
            title: 'Files',
            template_name: 'files',
            active: 'files',
            files,
            totalPages,
            total_count: totalCount,
            type_counts: countsByType,
            currentPage: page,
            type: fileType,
            breadcrumbs: [
                { name: 'CMS', href: '/cms' },
                { name: 'Files', href: '/cms/files' }
            ],
            scripts: [
                'files.js'
            ]
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});


module.exports = router;