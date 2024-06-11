const mongoose = require('mongoose');
const Page = require('../../../core/models/page');
const ModelRegistry = require('../../../core/functions/model-registry');

const TYPE = 'Article';
const modelName = `${TYPE}Page`;

const SchemaObject = new mongoose.Schema({
    text: [mongoose.Schema.Types.Mixed]
});

class AboutPagePlugin extends ModelRegistry {
    constructor() {
        super(Page, TYPE, modelName, SchemaObject);
    }
}

module.exports = AboutPagePlugin;
