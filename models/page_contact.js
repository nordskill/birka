const mongoose = require('mongoose');
const Page = require('./page');

const PAGE_TYPE = 'Contact';
const modelName = `${PAGE_TYPE}Page`;

const SchemaObject = new mongoose.Schema({
    contact_form_name: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true
    }
});

const modelVariable = Page.discriminator(PAGE_TYPE, SchemaObject);

module.exports = { [modelName]: modelVariable }[modelName];
