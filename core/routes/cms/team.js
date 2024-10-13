import express from 'express';

import Member from '../../models/member.js';
import PERMISSIONS from '../../../config/permissions.js';

const router = express.Router();
const SLUG = 'team-member';
const TITLE = 'Team Member';


router.get('/', async (req, res, next) => {
    let teamMembers = [];
    try {
        teamMembers = await Member.find()
            .select(' -__v')
            .lean();

    } catch (err) {
        next(err);
    }
    res.render(`cms/${SLUG}s`, {
        title: `${TITLE}s`,
        template_name: `cms_${SLUG}s`,
        active: `${SLUG}s`,
        team_members: teamMembers,
        breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            },
            {
                name: `${TITLE}s`,
                href: `/cms/team`
            }
        ]
    });
});

router.get('/new', async (req, res, next) => {
    res.render(`cms/team-new`, {
        title: `New Team Member`,
        template_name: `cms_new_member`,
        active: null,
        PERMISSIONS,
        breadcrumbs: [{
                name: 'CMS',
                href: '/cms'
            },
            {
                name: `${TITLE}s`,
                href: `/cms/team`
            },
            {
                name: `New Team Member`,
                href: `/cms/team/new`
            }
        ]
    });
});

router.get(`/:id`, async (req, res, next) => {
    const id = req.params.id;

    try {
        const teamMember = await Member.findById(id)
            .select('-__v')
            .lean();
        if (!teamMember) {
            throw new OperationalError("User not found", 404);
        }
        const userName = teamMember.username;
        res.render(`cms/${SLUG}`, {
            title: userName,
            template_name: `cms_member`,
            active: SLUG,
            team_member: teamMember,
            PERMISSIONS,
            breadcrumbs: [{
                    name: 'CMS',
                    href: '/cms'
                },
                {
                    name: `${TITLE}s`,
                    href: `/cms/team`
                },
                {
                    name: userName,
                    href: `/cms/team/${SLUG}`
                },
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