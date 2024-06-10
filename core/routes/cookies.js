const express = require('express');
const router = express.Router();
const OperationalError = require('../functions/operational-error');


router.post('/consent', (req, res) => {

    const consentGiven = req.body.consent; // 'consent' is expected to be a boolean true or false

    if (typeof consentGiven !== 'boolean') {
        return next(new OperationalError('Invalid consent value. Please provide true or false.', 400));
    }

    req.session.cookies_consent = consentGiven;
    if (consentGiven) {
        res.send({ consent: true, html: SS.custom_html_cookies });
    } else {
        res.send({ consent: false });
    }
    

});

module.exports = router;
