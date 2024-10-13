import mongoose from 'mongoose';

import Page from '../../../core/models/page.js';
import ModelRegistry from '../../../core/functions/model-registry.js';


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

export default AboutPagePlugin;
