const mongoose = require('mongoose');
const Page = require('../../../core/models/page');
const ModelRegistry = require('../../../core/functions/model-registry');

const TYPE = 'Contact';
const modelName = `${TYPE}Page`;

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

class AboutPagePlugin extends ModelRegistry {
    constructor() {
        super(Page, TYPE, modelName, SchemaObject);
    }
}

module.exports = AboutPagePlugin;
