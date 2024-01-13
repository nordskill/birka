const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {

    req.logout(function (err) {
        
        if (err) return next(err);
        res.redirect('/cms/login');
        
    });

});

module.exports = router;
