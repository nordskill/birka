const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const BlogPost = require('../../models/blog-post');
const OperationalError = require('../../functions/operational-error');

// update posts draft
router.put('/:postId/draft', async (req, res, next) => {
    const { postId } = req.params;
    const draftData = req.body;

    // Check if postId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
        return next(new OperationalError(`No blog post found with the id ${postId}`, 404));
    }

    try {
        const updatedBlogPost = await BlogPost.findByIdAndUpdate(postId,
            { $set: { draft: draftData } },
            { new: true, runValidators: true }
        );

        if (!updatedBlogPost) {
            throw new OperationalError(`No blog post found with the id ${postId}`, 404);
        }

        res.json({ message: 'Draft updated successfully', updatedBlogPost });
    } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
            return next(new OperationalError('Validation error while updating draft', 400));
        }
        next(err);
    }
});

router.patch('/:id', async (req, res, next) => {
    const { id } = req.params;
    const { unset, ...updates } = req.body;
    const updateOperation = { ...updates };

    try {

        if (unset) {
            updateOperation.$unset = {};
            unset.forEach(field => {
                updateOperation.$unset[field] = "";
            })
        }

        const options = { new: true, runValidators: true };

        const updatedBlogPost = await BlogPost.findByIdAndUpdate(id,
            updateOperation,
            options
        );

        if (!updatedBlogPost) {
            throw new OperationalError(`No blog posts found with the id ${id}`, 404);
        }

        res.json({
            success: true,  
            message: 'Blog post updated successfully',
            updatedBlogPost
        })

    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            return next(new OperationalError('Validation error while updating blog post', 400));
        }
        next(error);
    }
})

module.exports = router;
