import mongoose from 'mongoose';

import Page from '../../../core/models/page.js';
import ModelRegistry from '../../../core/functions/model-registry.js';


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

export default AboutPagePlugin;
