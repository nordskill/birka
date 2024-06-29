const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Page = require('../../models/page');
const OperationalError = require('../../functions/operational-error');
const { addTags, removeTags } = require('../../controllers/tag-controller');
const OBJtoHTML = require('../../functions/obj-to-html');

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
            data: page
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            throw new OperationalError("Invalid ID format", 400);
        }

        const page = await Page.findById(req.params.id);
        if (!page) {
            throw new OperationalError("Page not found", 404);
        }

        res.json(page);
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const updatedPage = await update_page(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Page updated successfully',
            data: updatedPage
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

        res.json({
            success: true,
            message: 'Draft updated successfully',
            data: updatedPage
        });
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            return next(new OperationalError('Validation error while updating draft', 400));
        }
        next(err);
    }
});

router.patch('/:id/update', async (req, res, next) => {
    const id = req.params.id;
    const body = req.body;

    try {
        let page = await Page.findById(id);

        if (!page) {
            throw new OperationalError(`No page found with the id ${id}`, 404);
        }

        if (page.draft?.length && (JSON.stringify(page.draft) !== JSON.stringify(page.content))) {
            const updates = {
                content: page.draft,
                content_rendered: await OBJtoHTML(page.draft),
                $unset: { draft: "", draft_rendered: "" }
            };

            Object.assign(body, updates);

            page = await update_page(id, body);

            res.json({
                success: true,
                message: 'Page updated from draft successfully',
                data: page
            });
        } else {
            page = await update_page(id, body);

            res.json({
                success: false,
                message: 'No changes detected in draft',
                data: page
            });
        }
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
            data: deletedPage
        });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id/tags', addTags(Page));
router.delete('/:id/tags', removeTags(Page));

async function update_page(id, updates, options = {}) {
    if (!mongoose.isValidObjectId(id)) {
        throw new OperationalError("Invalid ID format", 400);
    }

    const { $unset, ...updateData } = updates;
    const type = updateData.type;

    const updateOperation = { $set: {} };

    for (const [key, value] of Object.entries(updateData)) {
        if (key !== 'type') {
            updateOperation.$set[key] = value;
        }
    }

    if ($unset) {
        updateOperation.$unset = {};
        for (const [key, value] of Object.entries($unset)) {
            updateOperation.$unset[key] = '';
        }
    }

    const PageModel = type ? Page.discriminators[type] : Page;
    if (!PageModel) {
        throw new OperationalError(`Invalid page type: ${type}`, 400);
    }

    const defaultOptions = { new: true, runValidators: true };
    const mergedOptions = { ...defaultOptions, ...options };

    if (updateOperation.$set.is_home === true) {
        await Page.updateMany({ _id: { $ne: id }, is_home: true }, { $set: { is_home: false } });
    }

    const updatedPage = await PageModel.findByIdAndUpdate(id, updateOperation, mergedOptions);

    if (!updatedPage) {
        throw new OperationalError("Page not found", 404);
    }

    return updatedPage;
}

module.exports = router;