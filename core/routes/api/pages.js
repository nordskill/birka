const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Page = require('../../models/page');
const OperationalError = require('../../functions/operational-error');
const { addTags, removeTags } = require('../../controllers/tag-controller');

router.get('/search', async (req, res, next) => {
    try {
        const options = {
            name: { $regex: req.query.name, $options: 'i' }
        };
        const pages = await Page.find(options)
            .limit(5)
            .lean();

        res.json(pages);
    } catch (err) {
        next(err);
    }
});

router.post('/', async (req, res, next) => {
    const { type, ...pageData } = req.body;

    pageData.author = req.user._id;

    try {

        const PageModel = type ? Page.discriminators[type] : Page;

        if (!PageModel) {
            return next(new OperationalError(`Invalid page type: ${type}`, 400));
        }

        const page = new PageModel(pageData);
        await page.save();

        res.status(201).json({
            success: true,
            message: 'Page created successfully',
            page
        });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', async (req, res, next) => {

    const id = req.params.id;
    const { unset, ...updates } = req.body;
    const updateOperation = { ...updates };
    const type = updateOperation.type;

    try {

        if (!mongoose.isValidObjectId(id)) {
            throw new OperationalError("Invalid ID format", 400);
        }

        if (unset) {
            updateOperation.$unset = {};
            unset.forEach(field => {
                updateOperation.$unset[field] = "";
            })
        }

        // Find model based on discriminator 'type'
        const PageModel = type ? Page.discriminators[type] : Page;
        if (!PageModel) {
            throw new OperationalError(`Invalid page type: ${type}`, 400);
        }

        // Check if updateOperation requests is_home to be true
        if (updateOperation.is_home === true) {
            // Set is_home to false for all other pages
            await Page.updateMany({ _id: { $ne: id }, is_home: true }, { $set: { is_home: false } });
        }

        const options = { new: true, runValidators: true };
        const updatedPage = await PageModel.findByIdAndUpdate(id, updateOperation, options);

        if (!updatedPage) {
            throw new OperationalError("Page not found", 404);
        }

        res.json({
            success: true,
            message: 'Page updated successfully',
            page: updatedPage
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            throw new OperationalError("Invalid ID format", 400);
        }

        const deletedPage = await Page.findByIdAndDelete(req.params.id);
        if (!deletedPage) {
            throw new OperationalError("Page not found", 404);
        }

        res.status(200).json({
            success: true,
            message: 'Page deleted successfully',
            page: deletedPage
        });

    } catch (error) {
        next(error);
    }
});

router.patch('/:id/tags', addTags(Page));
router.delete('/:id/tags', removeTags(Page));

module.exports = router;