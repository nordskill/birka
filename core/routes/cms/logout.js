import express from 'express';

const router = express.Router();

router.get('/', async (req, res, next) => {

    req.logout(function (err) {
        
        if (err) return next(err);
        res.redirect('/cms/login');
        
    });

});

export default router;
