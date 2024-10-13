import express from 'express';

import Tag from '../../models/tag.js';

const router = express.Router();
const SLUG = 'tag';
const TITLE = 'Tag';

// CMS Tags
router.get('/', async (req, res, next) => {
    let tags = [];
    try {
        tags = await Tag.find()
            .sort({
                slug: 'asc'
            })
            .select('-_id -__v')
            .lean();

    } catch (err) {
        next(err);
    }
    res.render(`cms/${SLUG}s`, {
        title: `${TITLE}s`,
        template_name: `cms_${SLUG}s`,
        active: `${SLUG}s`,
        tags,
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
});

export default router;