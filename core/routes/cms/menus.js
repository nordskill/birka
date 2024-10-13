import express from 'express';
import mongoose from 'mongoose';

import Menu from '../../models/menu.js';
import OperationalError from '../../functions/operational-error.js';

const router = express.Router();
const SLUG = 'menu';
const TITLE = 'Menu';

// CMS Pages
router.get('/', async (req, res, next) => {

    try {
        const menus = await Menu.find()
            .lean();

        res.render(`cms/${SLUG}s`, {
            title: `${TITLE}s`,
            template_name: `cms_${SLUG}s`,
            active: `${SLUG}s`,
            menus,
            breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            },
            {
                name: `${TITLE}s`,
                href: `/cms/${SLUG}s`
            }
            ],
            scripts: [
                'validation-form.js'
            ]
        });
    } catch (error) {
        next(error);
    }
});

router.get(`/:id`, async (req, res, next) => {

    if (!isValidObjectId(req.params.id)) {
        return next(
            new OperationalError("Invalid ID format", 400) // Using 400 for Bad Request
        );
    }

    const id = req.params.id;
    const menu = await Menu.findById(id)
        .lean();

    if (!menu) {
        return next(
            new OperationalError(`Menu not found, ID: ${id} `, 404)
        );
    }

    res.render(`cms/${SLUG}`, {
        title: menu.name,
        template_name: `cms_${SLUG}`,
        active: `${SLUG}s`,
        menu,
        breadcrumbs: [{
            name: 'CMS',
            href: '/cms'
        },
        {
            name: `${TITLE}s`,
            href: `/cms/${SLUG}s`
        },
        {
            name: menu.name,
            href: `/cms/${SLUG}s/${menu._id}`
        }
        ],
        scripts: [
            'validation-form.js'
        ]
    });
});

export default router;

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
}