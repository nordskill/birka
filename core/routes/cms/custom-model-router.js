const express = require('express');
const path = require('path');
const router = express.Router();
const OperationalError = require('../../functions/operational-error');
const { getCustomModel, getModelNameBySlug, getCustomModelMeta } = require('../../functions/model-loader');
const FieldGenerator = require('../../utils/field-generator');


router.get('/:slug', async (req, res, next) => {

    const { slug } = req.params;
    const modelName = getModelNameBySlug(slug);
    const model = getCustomModel(modelName);
    const model_meta = getCustomModelMeta(modelName);

    if (!model) {
        return next(
            new OperationalError(`Model "${modelName}" not found`, 404)
        );
    }

    try {

        const templateFile = path.join(__dirname, '../../views/cms/custom-models');
        const items = await model.find().lean();

        res.render(templateFile, {
            title: `${model_meta.title}s`,
            template_name: 'cms_custom_model_items',
            active: slug,
            model,
            model_meta,
            items,
            breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            }, {
                name: model_meta.title,
                href: `/cms/custom/${slug}s`
            }]
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:slug/:id', async (req, res, next) => {
    const { slug, id } = req.params;
    const modelName = getModelNameBySlug(slug);
    const model = getCustomModel(modelName);
    const model_meta = getCustomModelMeta(modelName);

    if (!model) {
        return next(
            new OperationalError(`Model "${modelName}" not found`, 404)
        );
    }

    try {

        const templateFile = path.join(__dirname, '../../views/cms/custom-model');
        const item = await model.findById(id).lean();

        if (!item) {
            throw new OperationalError(`Model "${modelName}" not found: id: ${id}`, 404);
        }

        const generator = new FieldGenerator(model.schema.paths, item);
        const fieldsHTML = generator.generate();

        res.render(templateFile, {
            title: item.title,
            template_name: 'cms_custom_model_item',
            active: slug,
            model,
            model_meta,
            item,
            fields_html: fieldsHTML,
            breadcrumbs: [
                {
                    name: 'CMS',
                    href: '/cms'
                },
                {
                    name: model_meta.title,
                    href: `/cms/custom/${slug}`
                },
                {
                    name: item.title,
                    href: `/cms/custom/${slug}/${id}`
                }]
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
