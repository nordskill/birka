const express = require('express');
const router = express.Router();
const OperationalError = require('../../functions/operational-error');

const nodemailer = require('nodemailer');

const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'xxx',
        pass: 'xxx'
    }
});

// Email validation function
function validateEmail(email) {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
}

router.post('/', async (req, res, next) => {
    const { user_name, user_email, user_message } = req.body;

    // Validate the email format
    if (!validateEmail(user_email)) {
        return next(new OperationalError('Invalid email format.', 400));
    }

    // Construct the email message
    const mailOptions = {
        from: 'nordskill.design@gmail.com',
        to: user_email,
        subject: 'New Message from AJAX Form',
        text: `Name: ${user_name}\nEmail: ${user_email}\nMessage: ${user_message}`
    };

    try {
        // await mailTransporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (err) {
        next(err);
    }
});



module.exports = router;
