import express from 'express';

import OperationalError from '../../functions/operational-error.js';
import User from '../../models/user.js';

const router = express.Router();
const SLUG = 'customer';
const TITLE = 'Customer';


router.get('/', async (req, res, next) => {
    let users = [];
    try {
        users = await User.find()
            .sort({
                slug: 'asc'
            })
            .select(' -__v')
            .lean();

    } catch (err) {
        next(err);
    }
    res.render(`cms/${SLUG}s`, {
        title: `${TITLE}s`,
        template_name: `cms_${SLUG}s`,
        active: `${SLUG}s`,
        users,
        breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            },
            {
                name: `${TITLE}s`,
                href: `/cms/${SLUG}s`
            }
        ]
    });
});

router.get(`/:id`, async (req, res, next) => {
    const id = req.params.id;

    try {
        const userPage = await User.findById(id)
            .select('-__v')
            .lean();
        if (!userPage) {
            throw new OperationalError("User not found", 404);
        }
        const nameUser = userPage.account_details.username;
        res.render(`cms/${SLUG}`, {
            title: nameUser,
            template_name: `cms_${SLUG}`,
            active: SLUG,
            user_page: userPage,
            breadcrumbs: [{
                    name: 'CMS',
                    href: '/cms'
                },
                {
                    name: `${TITLE}s`,
                    href: `/cms/${SLUG}s`
                },
                {
                    name: nameUser,
                    href: `/cms/${SLUG}s/${SLUG}`
                },
            ],
            scripts: [
                'validation-form.js',
                'show-billing-details.js'
            ]
        });
        // console.log(userPage.shipping[0]._id);
    } catch (err) {
        next(err);

    }

});

// Shipping Details
router.get(`/:id/:index`, async (req, res, next) => {
    const id = req.params.id;
    const index = req.params.index; // 0 or etc number 
    // console.log(typeof index);
    try {
        const userPage = await User.findById(id)
            .select('-__v')
            .lean();
        if (!userPage) {
            throw new OperationalError("User not found", 404);
        }
        const nameUser = userPage.account_details.username;
        res.render(`cms/customer-shipping`, {
            title: userPage.shipping[index].name || ' Name: (Shipping Details) is not in BD ',
            template_name: `cms_${SLUG}-shipping`,
            active: SLUG,
            shipping_details: userPage.shipping[index],
            breadcrumbs: [{
                    name: 'CMS',
                    href: '/cms'
                },
                {
                    name: `${TITLE}s`,
                    href: `/cms/${SLUG}s`
                },
                {
                    name: nameUser,
                    href: `/cms/${SLUG}s/${userPage._id}`
                },
                {
                    name: 'My Home',
                    href: `/cms/${SLUG}s/${SLUG}/shipping-details`
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

export default router;