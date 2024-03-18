const mongoose = require('mongoose');
const Page = require('./page');

const PAGE_TYPE = 'Home';
const modelName = `${PAGE_TYPE}Page`;

const SchemaObject = new mongoose.Schema({
    title: {
        type: String,
        trim: true
    },
    welcome_text: {
        type: String,
        trim: true
    }
});

const modelVariable = Page.discriminator(PAGE_TYPE, SchemaObject);

module.exports = { [modelName]: modelVariable }[modelName];
