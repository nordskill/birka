const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const BlogPost = require('../../models/blog-post');
const OperationalError = require('../../functions/operational-error');
const { addTags, removeTags } = require('../../controllers/tag-controller');
const OBJtoHTML = require('../../functions/obj-to-html');

router.get('/search', async (req, res, next) => {
    try {
        const options = {
            title: { $regex: req.query.title, $options: 'i' }
        };
        const posts = await BlogPost.find(options)
            .limit(5)
            .lean();

        res.json(posts);
    } catch (err) {
        next(err);
    }
});

router.post('/', async (req, res, next) => {

    const { type, ...postData } = req.body;

    postData.author = req.user._id;

    try {
        const PostModel = type ? BlogPost.discriminators[type] : BlogPost;

        if (!PostModel) {
            return next(new OperationalError(`Invalid post type: ${type}`, 400));
        }

        const post = new PostModel(postData);
        await post.save();

        res.status(201).json({
            success: true,
            message: 'Blog post created successfully',
            data: post
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

        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            throw new OperationalError("Blog post not found", 404);
        }

        res.json(post);
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const updatedPost = await updateBlogPost(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Blog post updated successfully',
            data: updatedPost
        });
    } catch (error) {
        next(error);
    }
});

router.put('/:id/draft', async (req, res, next) => {
    const { id } = req.params;
    const draftData = req.body;

    if (!mongoose.isValidObjectId(id)) {
        return next(new OperationalError(`No blog post found with the id ${id}`, 404));
    }

    try {
        const updatedPost = await BlogPost.findByIdAndUpdate(id,
            { $set: { draft: draftData } },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            throw new OperationalError(`No blog post found with the id ${id}`, 404);
        }

        res.json({
            success: true,
            message: 'Draft updated successfully',
            data: updatedPost
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
        let post = await BlogPost.findById(id);

        if (!post) {
            throw new OperationalError(`No blog post found with the id ${id}`, 404);
        }

        if (post.draft?.length && (JSON.stringify(post.draft) !== JSON.stringify(post.body))) {
            
            const updates = {
                body: post.draft,
                body_rendered: await OBJtoHTML(post.draft),
                $unset: { draft: "", draft_rendered: "" }
            };

            // Check if date_published is not set or doesn't have a value
            if (!post.date_published) {
                updates.date_published = new Date();
            }

            Object.assign(body, updates);

            post = await updateBlogPost(id, body);

            res.json({
                success: true,
                message: 'Blog post updated from draft successfully',
                data: post
            });

        } else {

            post = await updateBlogPost(id, body);

            res.json({
                success: false,
                message: 'No changes detected in draft',
                data: post
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

        const deletedPost = await BlogPost.findByIdAndDelete(req.params.id);
        if (!deletedPost) {
            throw new OperationalError("Blog post not found", 404);
        }

        res.status(200).json({
            success: true,
            message: 'Blog post deleted successfully',
            data: deletedPost
        });

    } catch (error) {
        next(error);
    }
});

router.patch('/:id/tags', addTags(BlogPost));
router.delete('/:id/tags', removeTags(BlogPost));

async function updateBlogPost(id, updates, options = {}) {
    if (!mongoose.isValidObjectId(id)) {
        throw new OperationalError("Invalid ID format", 400);
    }

    const { $unset, ...updateData } = updates;
    const type = updateData.type;

    const updateOperation = { $set: {} };

    // Handle $set operations, supporting dot notation
    for (const [key, value] of Object.entries(updateData)) {
        if (key !== 'type') {
            updateOperation.$set[key] = value;
        }
    }

    // Handle $unset operations
    if ($unset) {
        updateOperation.$unset = {};
        for (const [key, value] of Object.entries($unset)) {
            updateOperation.$unset[key] = '';
        }
    }

    const PostModel = type ? BlogPost.discriminators[type] : BlogPost;
    if (!PostModel) {
        throw new OperationalError(`Invalid post type: ${type}`, 400);
    }

    const defaultOptions = { new: true, runValidators: true };
    const mergedOptions = { ...defaultOptions, ...options };

    const updatedPost = await PostModel.findByIdAndUpdate(id, updateOperation, mergedOptions);

    if (!updatedPost) {
        throw new OperationalError("Blog post not found", 404);
    }

    return updatedPost;
}

module.exports = router;