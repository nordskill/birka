const express = require('express');
const router = express.Router();
const Status = require('../../models/status');

const SLUG = 'status';
const TITLE = 'Status';

// CMS Tags
router.get('/', async (req, res, next) => {
    let statuses = [];
    try {
        statuses = await Status.find()
            .sort({
                sorting_order: 1
            })
            .select(' -__v')
            .lean();

    } catch (err) {
        next(err);
    }
    res.render(`cms/${SLUG}es`, {
        title: `${TITLE}es`,
        template_name: `cms_${SLUG}es`,
        active: `${SLUG}es`,
        statuses,
        breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            },
            {
                name: `${TITLE}es`,
                href: `/cms/${SLUG}es`
            }
        ]
    });
});

router.get(`/:id`, async (req, res, next) => {
    const id = req.params.id;

    try {
        const statusPage = await Status.findById(id)
            .select('-__v')
            .lean();
        if (!statusPage) {
            throw new OperationalError("Status not found", 404);
        }
        res.render(`cms/${SLUG}`, {
            title: statusPage.name,
            template_name: `cms_${SLUG}`,
            active: `${SLUG}es`,
            status_page: statusPage,
            breadcrumbs: [{
                    name: 'CMS',
                    href: '/cms'
                },
                {
                    name: `${TITLE}es`,
                    href: `/cms/${SLUG}es`
                },
                {
                    name: statusPage.name,
                    href: `/cms/${SLUG}es/${SLUG}`
                }
            ],
            scripts: [
                'validation-form.js'
            ]
        });
        // console.log(userPage.shipping[0]._id);
    } catch (err) {
        next(err);

    }


});

module.exports = router;