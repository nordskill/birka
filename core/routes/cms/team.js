const express = require('express');
const router = express.Router();
const Member = require('../../models/member');

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
            template_name: `cms_${SLUG}`,
            active: SLUG,
            team_member: teamMember,
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
        // console.log(teamMember.shipping[0]._id);
    } catch (err) {

        next(err);

    }

});

module.exports = router;