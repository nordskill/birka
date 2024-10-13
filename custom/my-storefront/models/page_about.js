import mongoose from 'mongoose';

import Page from '../../../core/models/page.js';
import ModelRegistry from '../../../core/functions/model-registry.js';


const TYPE = 'About';
const modelName = `${TYPE}Page`;

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

class AboutPagePlugin extends ModelRegistry {
    constructor() {
        super(Page, TYPE, modelName, SchemaObject);
    }
}

export default AboutPagePlugin;