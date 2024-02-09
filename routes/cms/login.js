const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {

    // if user is already logged in, redirect to dashboard
    if (req.user) return res.redirect('/cms');

    let logoPath;
    if (SS?.logo) {
        const { hash, file_name, optimized_format, sizes } = SS.logo;
        const folder = hash.slice(0, 2);
        const size = findClosestNumber(150, sizes);
        logoPath = `/files/${folder}/${size}/${file_name}.${optimized_format}`;
    } else {
        logoPath = '/img/birka-logo_v1.webp';
    }

    res.render('cms/login', {
        title: 'CMS Login',
        template_name: 'cms_login',
        logo_path: logoPath
    });
});

module.exports = router;

function findClosestNumber(target, numbers) {
    return numbers.reduce((closest, num) => Math.abs(num - target) < Math.abs(closest - target) ? num : closest);
}