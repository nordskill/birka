const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', async (req, res, next) => {
    res.render('index', {
        title: 'Express',
        template_name: 'index'
    });
});

module.exports = router;
