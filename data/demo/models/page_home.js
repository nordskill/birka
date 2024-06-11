const mongoose = require('mongoose');
const Page = require('../../../core/models/page');
const ModelRegistry = require('../../../core/functions/model-registry');

const TYPE = 'Home';
const modelName = `${TYPE}Page`;

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

class AboutPagePlugin extends ModelRegistry {
    constructor() {
        super(Page, TYPE, modelName, SchemaObject);
    }
}

module.exports = AboutPagePlugin;
