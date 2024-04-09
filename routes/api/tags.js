const express = require('express');
const router = express.Router();
const Tag = require('../../models/tag');
const slugify = require('../../functions/slugify');
const OperationalError = require('../../functions/operational-error');

router.get('/', async (req, res, next) => {
    try {
        const tags = await Tag.find()
            .sort({ name: 'asc' })
            .select('-_id -__v')
            .lean();

        res.json(tags);
    } catch (err) {
        next(err);
    }
});

router.get('/:slug', async (req, res, next) => {
    try {
        const filter = { 'slug': req.params.slug }
        const tag = await Tag.findOne(filter)
            .select('-_id -__v')
            .lean();

        if (!tag) {
            throw new OperationalError("Tag not found", 404);
        }

        res.json(tag);
    } catch (err) {
        next(err);
    }
});

router.post('/', async (req, res, next) => {

    const { tags: tagNames } = req.body;

    if (!Array.isArray(tagNames)) {
        return next(new OperationalError('Tags must be an array.', 400));
    }

    try {
        const tags = tagNames.map(name => new Tag({
            name: name.trim(),
            slug: slugify(name)
        }));
        await Tag.insertMany(tags);
        res.json({ success: true });

    } catch (err) {
        if (err.code === 11000) { // Duplicate key error
            return next(new OperationalError('Duplicate tag slug found.', 400));
        }
        next(err);
    }

});

router.post('/one', async (req, res, next) => {

    const data = req.body;
    const { name: tagName } = data;

    if (!tagName) {
        return next(new OperationalError('Tag name is required.', 400));
    }

    try {

        const slug = slugify(tagName);
        const tag = await Tag.findOne({ slug });

        if (tag) {
            throw new OperationalError(`Tag "${slug}" already exists.`, 400);
        }

        const newTag = new Tag({
            name: tagName.trim(),
            slug
        });

        await newTag.save();
        res.json(newTag);

    } catch (err) {
        next(err);
    }

});

router.put('/:slug', async (req, res, next) => {

    const slug = req.params.slug;
    const { name: tagName } = req.body;

    if (!tagName) {
        return next(new OperationalError('Tag name is required.', 400));
    }

    try {

        const filter = { slug };
        const update = {
            name: tagName.trim(),
            slug: slugify(tagName)
        }

        const updatedTag = await Tag.findOneAndUpdate(filter, update);

        if (!updatedTag) {
            throw new OperationalError(`There is no "${slug}" tag.`, 404);
        }

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

router.put('/one/:slug', async (req, res, next) => {

    const currentSlug = req.params.slug;
    const data = req.body;
    const { name: tagName, slug: slugName } = data;

    try {

        // here the slug can be changed independently of the name
        const filter = { slug: currentSlug };
        const update = {
            name: tagName.trim(),
            slug: slugify(slugName)
        }
        const options = { new: true, useFindAndModify: false };
        const updatedTag = await Tag.findOneAndUpdate(filter, update, options);

        if (!updatedTag) {
            throw new OperationalError(`There is no "${currentSLug}" tag.`, 404);
        }

        res.json(updatedTag);

    } catch (err) {
        next(err);
    }

});

router.delete('/:slug', async (req, res, next) => {

    const slug = req.params.slug;

    try {
        const filter = { slug };
        const deletedTag = await Tag.findOneAndDelete(filter);

        if (!deletedTag) {
            throw new OperationalError(`Tag "${slug}" does not exist.`, 404);
        }

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

router.delete('/one/:slug', async (req, res, next) => {

    const slug = req.params.slug;

    try {
        const filter = { slug };
        const deletedTag = await Tag.findOneAndDelete(filter);

        if (!deletedTag) {
            throw new OperationalError(`Tag "${slug}" does not exist.`, 404);
        }

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});


module.exports = router;
