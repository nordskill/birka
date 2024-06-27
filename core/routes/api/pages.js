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
    const type = updates.type; // Assuming 'type' is used for model discrimination

    // Initialize update operations
    const updateOperation = { $set: {}, $unset: {} };

    try {
        // Validate ID
        if (!mongoose.isValidObjectId(id)) {
            throw new OperationalError("Invalid ID format", 400);
        }

        // Handle unsetting fields
        if (unset) {
            unset.forEach(field => {
                updateOperation.$unset[field] = "";
            });
        }

        // Handle setting new values
        for (const [key, value] of Object.entries(updates)) {
            if (key !== 'type') { // Exclude 'type' from being directly set in the update operation
                updateOperation.$set[key] = value;
            }
        }

        // Find the correct model based on discriminator 'type'
        const PageModel = type ? Page.discriminators[type] : Page;
        if (!PageModel) {
            throw new OperationalError(`Invalid page type: ${type}`, 400);
        }

        // Check if updateOperation requests is_home to be true and update accordingly
        if (updateOperation.$set.is_home === true) {
            await Page.updateMany({ _id: { $ne: id }, is_home: true }, { $set: { is_home: false } });
        }

        // Execute the update with options for returning the new document and running validators
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

router.put('/:id/draft', async (req, res, next) => {
    const { id } = req.params;
    const draftData = req.body;

    if (!mongoose.isValidObjectId(id)) {
        return next(new OperationalError(`No page found with the id ${id}`, 404));
    }

    try {
        const updatedPage = await Page.findByIdAndUpdate(id,
            { $set: { draft: draftData } },
            { new: true, runValidators: true }
        );

        if (!updatedPage) {
            throw new OperationalError(`No page found with the id ${id}`, 404);
        }

        res.json({ message: 'Draft updated successfully', updatedPage });
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            return next(new OperationalError('Validation error while updating draft', 400));
        }
        next(err);
    }
});

router.patch('/:id/tags', addTags(Page));
router.delete('/:id/tags', removeTags(Page));

module.exports = router;