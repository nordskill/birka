const mongoose = require('mongoose');
const { Schema } = mongoose;
const Page = require('../../../core/models/page');

const PAGE_TYPE = 'Article';
const modelName = `${PAGE_TYPE}Page`;

const SchemaObject = new mongoose.Schema({
    text: [Schema.Types.Mixed]
});

const modelVariable = Page.discriminator(PAGE_TYPE, SchemaObject);

module.exports = { [modelName]: modelVariable }[modelName];
