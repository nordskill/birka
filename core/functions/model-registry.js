const mongoose = require('mongoose');

class ModelRegistry {
    constructor(Model, type, modelName, schemaDefinition) {
        this.model = Model;
        this.type = type;
        this.modelName = modelName;
        this.schema = new mongoose.Schema(schemaDefinition);
        this.discriminatorModel = null;
    }

    register() {
        if (!this.discriminatorModel) { // Check if already registered
            this.discriminatorModel = this.model.discriminator(this.type, this.schema);
        }
        return this;
    }

    get_model() {
        return this.discriminatorModel;
    }
}

module.exports = ModelRegistry;