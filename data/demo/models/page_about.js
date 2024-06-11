const mongoose = require('mongoose');
const Page = require('./page');

const PAGE_TYPE = 'About';
const modelName = `${PAGE_TYPE}Page`;

const SchemaObject = new mongoose.Schema({
    description: {
        type: String,
        trim: true
    },
    specializations: [
        {
            name: {
                type: String,
                trim: true
            },
            description: {
                type: String,
                trim: true
            },
            img: { ref: 'File', type: mongoose.Schema.Types.ObjectId }
        }
    ],
    founder_photo: { ref: 'File', type: mongoose.Schema.Types.ObjectId }
});

const modelVariable = Page.discriminator(PAGE_TYPE, SchemaObject);

module.exports = { [modelName]: modelVariable }[modelName];
