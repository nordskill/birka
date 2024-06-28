const express = require('express');
const path = require('path');
const ejs = require('ejs');
const router = express.Router();
const BlogPost = require('../models/blog-post');
const OperationalError = require('../functions/operational-error');

// Utility function to render EJS templates (reused from your original code)
async function renderTemplate(res, data, template, next) {
    try {

        const html = await ejs.renderFile(template, {
            env: res.locals.env,
            menus: res.locals.menus,
            cookies_consent: res.locals.cookies_consent,
            csrf_token: res.locals.csrf_token,
            getData: res.locals.getData,
            getField: res.locals.getField,
            getImgTag: res.locals.getImgTag,
            title: data.title,
            template_name: data.template_name,
            data
        }, {
            async: true,
            rmWhitespace: true
        });

        res.send(html);

    } catch (error) {
        next(error);
    }
}

router.get('/', async (req, res, next) => {
    try {

        const blogPosts = await BlogPost.find({ published: true })
            .limit(SS.blog_posts_per_page)
            .select('title slug excerpt img_preview date_published author tags custom -_id')
            .populate('author', 'username -_id')
            .populate('img_preview', '-_id -__v -createdAt -updatedAt -tags -used -__t')
            .populate('tags', 'name slug -_id')
            .sort({ date_published: -1 })
            .lean();

        const templateFile = path.join(res.app.get('views')[0], 'blog.ejs');

        await renderTemplate(res, {
            slug: SS.blog_slug,
            title: SS.blog_title,
            template: 'blog',
            blogPosts,
            ...res.locals
        }, templateFile, next);

    } catch (error) {
        next(error);
    }
});

router.get('/:slug', async (req, res, next) => {
    try {

        const slug = req.params.slug;
        const blogPost = await BlogPost.findOne({ slug: slug, published: true })
            .select('title slug excerpt img_preview date_published author tags custom body_rendered -_id')
            .populate('author', 'username -_id')
            .populate('img_preview', '-_id -__v -createdAt -updatedAt -tags -used -__t')
            .populate('tags', 'name slug -_id')
            .lean();

        if (!blogPost) throw new OperationalError('Blog post not found', 404);

        const templateFile = path.join(res.app.get('views')[0], 'blog-post.ejs');

        await renderTemplate(res, {
            slug: SS.blog_slug,
            title: blogPost.title,
            template: 'blog_post',
            blogPost,
            ...res.locals
        }, templateFile, next);

    } catch (error) {
        next(error);
    }
});

module.exports = router;