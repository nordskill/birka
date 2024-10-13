import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import OperationalError from '../../functions/operational-error.js';
import { getCustomModel, getModelNameBySlug, getCustomModelMeta } from '../../functions/model-loader.js';
import FieldGenerator from '../../utils/field-generator.js';


const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
});

export default router;