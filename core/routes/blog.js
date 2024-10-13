import express from 'express';
import path from 'path';
import ejs from 'ejs';

import BlogPost from '../models/blog-post.js';
import OperationalError from '../functions/operational-error.js';
import { blogSchema, blogPostSchema } from '../../config/jsonld-blog.js';

const router = express.Router();

async function renderTemplate(req, res, data, template, next) {

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
            baseUrl: `${req.protocol}://${req.get('host')}`,
            GlobalSettings: req.app.locals.GlobalSettings,
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

    const { GlobalSettings } = req.app.locals;

    try {

        const blogPosts = await BlogPost.find({ published: true })
            .limit(GlobalSettings.blog_posts_per_page)
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
                name: GlobalSettings.blog_title,
                url: `${host}/${GlobalSettings.blog_slug}`
            }
        ];
        const jsonLDdata = {
            blogPosts,
            breadcrumbs,
            host,
            blog_title: GlobalSettings.blog_title,
            blog_description: GlobalSettings.blog_description || '',
            blog_slug: GlobalSettings.blog_slug,
            website_name: GlobalSettings.name
        };

        const jsonLD = blogSchema(jsonLDdata);
        const templateFile = path.join(res.app.get('views')[0], 'blog.ejs');

        await renderTemplate(req, res, {
            slug: GlobalSettings.blog_slug,
            title: GlobalSettings.blog_title,
            blogPosts,
            jsonLD,
        }, templateFile, next);

    } catch (error) {
        next(error);
    }
});

router.get('/:slug', async (req, res, next) => {

    const { GlobalSettings } = req.app.locals;

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
                name: GlobalSettings.blog_title,
                url: `${host}/${GlobalSettings.blog_slug}`
            },
            {
                name: blogPost.title,
                url: `${host}/${GlobalSettings.blog_slug}/${blogPost.slug}`
            }
        ];
        const jsonLDdata = {
            breadcrumbs,
            host,
            post: blogPost,
            blog_slug: GlobalSettings.blog_slug,
            website_name: GlobalSettings.name
        };

        const jsonLD = blogPostSchema(jsonLDdata);
        const templateFile = path.join(res.app.get('views')[0], 'blog-post.ejs');

        await renderTemplate(req, res, {
            slug: GlobalSettings.blog_slug,
            title: blogPost.title,
            blogPost,
            jsonLD
        }, templateFile, next);

    } catch (error) {
        next(error);
    }
});

export default router;