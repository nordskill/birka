const express = require('express');
const router = express.Router();

// CMS Home Page
router.get('/', async (req, res, next) => {
    res.render('cms/index', {
        title: 'Demo Dashboard',
        template_name: 'cms_dashboard',
        active: 'dashboard',
        breadcrumbs: [
            { name: 'Dashboard', href: '/cms' }
        ],
        scripts: [
            'chart.js',
            'dashboard.js'
        ]
    });
});

module.exports = router;
