const express = require('express');
const router = express.Router();
const Blog = require('../../models/blog-post');
const Tag = require('../../models/tag');
const User = require('../../models/user');
const formatBody = require('../../functions/format-body');


const SLUG = 'blog';
const TITLE = 'Blog';


router.get('/', async (req, res, next) => {

    let blogs = [];
    try {
        blogs = await Blog.find()
            .sort({
                slug: 'asc'
            })
            .select(' -__v -body')
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
    try {
        const blogPost = await Blog.findById(id)
            .select('-__v')
            .populate('tags', 'slug name -_id')
            .populate('author img_preview')
            .lean();

        if (!blogPost) {
            throw new OperationalError("Blog Post not found", 404);
        }

        const folder_path = '/files/images/blog/';

        res.render(`cms/${SLUG}-post`, {
            title: 'Blog Post',
            template_name: 'cms_blog-post',
            active: SLUG,
            blog_post: blogPost,
            img_preview: `${folder_path}${blogPost.img_preview?.file_name}.${blogPost.img_preview?.extension}`,
            body: formatBody(blogPost.body),
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