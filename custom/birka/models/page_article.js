import mongoose from 'mongoose';

import Page from '../../../core/models/page.js';
import ModelRegistry from '../../../core/functions/model-registry.js';


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

export default AboutPagePlugin;
