const fs = require('fs');
const path = require('path');

const coreModelsPath = path.join(__dirname, '../models');
const pluginRegistry = {};
const customModels = {};
const modelSlugs = {}; // To store model slugs

function loadModels(modelsPath) {
    const coreModels = loadCoreModels(coreModelsPath);
    loadCustomModels(modelsPath, coreModels);

    return { coreModels, customModels };
}

function loadCoreModels(directory) {
    const models = {};
    fs.readdirSync(directory).forEach(file => {
        if (file.endsWith('.js')) {
            const modelPath = path.join(directory, file);
            const model = require(modelPath);
            models[model.modelName] = model;
        }
    });
    return models;
}

function loadCustomModels(directory, coreModels) {
    fs.readdirSync(directory).forEach(file => {
        if (file.endsWith('.js')) {
            const modelName = file.split('.')[0];
            const coreModelMatch = Object.keys(coreModels).some(coreModel => modelName.startsWith(coreModel + '_'));
            if (!coreModelMatch) {
                const modelPath = path.join(directory, file);
                console.log('Loading custom model:', modelPath);
                const CustomModelClass = require(modelPath);
                console.log(CustomModelClass);

                // Handle custom models and submodels differently
                if (typeof CustomModelClass === 'function') {
                    const customModelInstance = new CustomModelClass();
                    if (typeof customModelInstance.register === 'function') {
                        const model = customModelInstance.register();
                        customModels[customModelInstance.modelName] = model;
                        modelSlugs[customModelInstance.slug] = customModelInstance.modelName; // Store slug

                        if (!pluginRegistry[customModelInstance.modelName]) {
                            pluginRegistry[customModelInstance.modelName] = [];
                        }
                        pluginRegistry[customModelInstance.modelName].push(customModelInstance.type);
                    } else {
                        console.error(`Custom model ${file} does not have a register method.`);
                    }
                } else {
                    console.error(`Custom model ${file} is not a class or constructor function.`);
                }
            }
        }
    });
}

function getSubmodels(modelName) {
    return pluginRegistry[modelName] || [];
}

function getAllSubmodels() {
    return pluginRegistry;
}

function getCustomModel(modelName) {
    return customModels[modelName] || null;
}

function getModelNameBySlug(slug) {
    return modelSlugs[slug] || null;
}

module.exports = {
    loadModels,
    getSubmodels,
    getAllSubmodels,
    getCustomModel,
    getModelNameBySlug
};
