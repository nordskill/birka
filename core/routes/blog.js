const express = require('express');
const path = require('path');
const ejs = require('ejs');
const router = express.Router();
const BlogPost = require('../models/blog-post');
const OperationalError = require('../functions/operational-error');
const { blogSchema, blogPostSchema } = require('../../config/jsonld-blog');


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
            json_ld: data.jsonLD,
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

        const host = `${req.protocol}://${req.get('host')}`;
        const breadcrumbs = [
            {
                name: 'Home',
                url: host
            },
            {
                name: SS.blog_title,
                url: `${host}/${SS.blog_slug}`
            }
        ];
        const jsonLDdata = {
            blogPosts,
            breadcrumbs,
            host,
            blog_title: SS.blog_title,
            blog_description: SS.blog_description || '',
            blog_slug: SS.blog_slug,
            website_name: SS.name
        };

        const jsonLD = blogSchema(jsonLDdata);
        const templateFile = path.join(res.app.get('views')[0], 'blog.ejs');

        await renderTemplate(res, {
            slug: SS.blog_slug,
            title: SS.blog_title,
            blogPosts,
            jsonLD
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

        const host = `${req.protocol}://${req.get('host')}`;
        const breadcrumbs = [
            {
                name: 'Home',
                url: host
            },
            {
                name: SS.blog_title,
                url: `${host}/${SS.blog_slug}`
            },
            {
                name: blogPost.title,
                url: `${host}/${SS.blog_slug}/${blogPost.slug}`
            }
        ];
        const jsonLDdata = {
            breadcrumbs,
            host,
            post: blogPost,
            blog_slug: SS.blog_slug,
            website_name: SS.name
        };

        const jsonLD = blogPostSchema(jsonLDdata);
        const templateFile = path.join(res.app.get('views')[0], 'blog-post.ejs');

        await renderTemplate(res, {
            slug: SS.blog_slug,
            title: blogPost.title,
            blogPost,
            jsonLD
        }, templateFile, next);

    } catch (error) {
        next(error);
    }
});

module.exports = router;