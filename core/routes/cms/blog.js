const express = require('express');
const router = express.Router();
const BlogPost = require('../../models/blog-post');
const OBJtoHTML = require('../../functions/obj-to-html');
const mongoose = require('mongoose');
const OperationalError = require('../../functions/operational-error');


const SLUG = 'blog';
const TITLE = 'Blog';


router.get('/', async (req, res, next) => {

    let blogs = [];
    try {
        blogs = await BlogPost.find()
            .sort({
                createdAt: 'desc'
            })
            .select('-__v -body')
            .populate('author tags')
            .lean();

        if (!blogs) {
            throw new OperationalError("Blogs not found", 404);
        }

        res.render(`cms/${SLUG}`, {
            title: TITLE,
            template_name: `cms_${SLUG}`,
            active: SLUG,
            blogs,
            breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            },
            {
                name: TITLE,
                href: `/cms/${SLUG}`
            }
            ],
            scripts: [
                'validation-form.js'
            ]
        });
    } catch (err) {
        next(err);

    }



});

router.get('/:id', async (req, res, next) => {
    const id = req.params.id;

    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new OperationalError("Blog Post not found", 404));
    }

    try {
        const blogPost = await BlogPost.findById(id)
            .select('-__v')
            .populate('tags', 'slug name -_id')
            .populate('author img_preview')
            .lean();

        if (!blogPost) {
            throw new OperationalError("Blog Post not found", 404);
        }

        const folder_path = '/files/images/blog/';

        let bodyContent = blogPost.body;

        if (blogPost.draft?.length > 0) {
            const firstBlock = blogPost.draft[0];
            if (Object.keys(firstBlock).length > 0) {
                bodyContent = blogPost.draft;
            }
        }

        const unsaved_changes = blogPost.draft ? '(unsaved changes)' : '';

        res.render(`cms/${SLUG}post`, {
            title: 'Blog Post ' + unsaved_changes,
            template_name: 'cms_blogpost',
            active: SLUG,
            blog_post: blogPost,
            img_preview: `${folder_path}${blogPost.img_preview?.file_name}.${blogPost.img_preview?.extension}`,
            rendered_body: await OBJtoHTML(bodyContent, { imgIDs: true }),
            breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            },
            {
                name: TITLE,
                href: `/cms/${SLUG}`
            },
            {
                name: 'Post',
                href: `/cms/${SLUG}/post`
            }
            ],
            scripts: [
                'validation-form.js'
            ]
        });
    } catch (err) {
        next(err);

    }

});

module.exports = router;