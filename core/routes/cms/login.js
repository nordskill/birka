const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {

    // if user is already logged in, redirect to dashboard
    if (req.user) return res.redirect('/cms');

    let logoPath;
    if (GlobalSettings?.logo) {
        const { hash, file_name, optimized_format, sizes } = GlobalSettings.logo;
        const folder = hash.slice(0, 2);
        const size = findClosestNumber(150, sizes);
        logoPath = `/files/${folder}/${size}/${file_name}.${optimized_format}`;
    } else {
        logoPath = '/img/birka-logo_v2.webp';
    }

    res.render('cms/login', {
        title: 'CMS Login',
        template_name: 'cms_login',
        logo_path: logoPath
    });
});

module.exports = router;


/**
 * Find the number (1st param) in an array (2nd param) that is closest to a given number.
 * @example
 * findClosestNumber(5, [1, 3, 6, 8]); // 6
 */
function findClosestNumber(target, numbers) {
    return numbers.reduce((closest, num) => Math.abs(num - target) < Math.abs(closest - target) ? num : closest);
}