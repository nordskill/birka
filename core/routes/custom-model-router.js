const express = require('express');
const path = require('path');
const router = express.Router();
const { getCustomModel, getModelNameBySlug } = require('../functions/model-loader');

router.get('/:slug', async (req, res, next) => {
    const { slug } = req.params;
    const modelName = getModelNameBySlug(slug);
    const model = getCustomModel(modelName);

    if (!model) {
        return next(new Error('Model not found'));
    }

    try {
        

        const templateFile = path.join(res.app.get('views')[0], 'cms', slug);
        console.log(templateFile);
        

        const items = await model.find().lean();
        res.render(templateFile, {
            title: `${modelName}s`,
            template_name: `cms_${slug}s`,
            active: `${slug}s`,
            items,
            breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            }, {
                name: `${modelName}s`,
                href: `/cms/${slug}s`
            }],
            scripts: ['validation-form.js']
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:slug/:id', async (req, res, next) => {
    const { slug, id } = req.params;
    const modelName = getModelNameBySlug(slug);
    const model = getCustomModel(modelName);

    if (!model) {
        return next(new Error('Model not found'));
    }

    try {

        const templateFile = path.join(res.app.get('views')[0], 'cms', slug);
        const item = await model.findById(id).lean();
        if (!item) {
            return next(new Error(`${modelName} not found`));
        }

        res.render(templateFile, {
            title: item.name,
            template_name: `cms_${slug}`,
            active: `${slug}s`,
            item,
            breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            }, {
                name: `${modelName}s`,
                href: `/cms/${slug}s`
            }, {
                name: item.name,
                href: `/cms/${slug}s/${id}`
            }]
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
