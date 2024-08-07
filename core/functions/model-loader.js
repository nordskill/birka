const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const coreModelsPath = path.join(__dirname, '../models');
const pluginRegistry = {};
const customModels = {};
const subModels = {}; // Separate registry for submodels
const modelSlugs = {}; // To store model slugs

function loadModels(modelsPath) {
    const coreModels = loadCoreModels(coreModelsPath);
    loadCustomModels(modelsPath, coreModels);
    return { coreModels, customModels, subModels };
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
            const coreModelMatch = Object.keys(coreModels).some(coreModel => {
                const coreModelName = coreModel.toLowerCase();
                return modelName.toLowerCase().startsWith(coreModelName + '_');
            });

            if (coreModelMatch) {
                // This is a submodel
                const modelPath = path.join(directory, file);
                console.log('Loading custom submodel:', modelPath);
                const SubModelClass = require(modelPath);
                console.log(SubModelClass);

                if (typeof SubModelClass === 'function') {
                    const subModelInstance = new SubModelClass();
                    if (typeof subModelInstance.register === 'function') {
                        const model = subModelInstance.register();
                        subModels[subModelInstance.modelName] = model;
                        pluginRegistry[subModelInstance.modelName] = subModelInstance.type; // Store submodel
                    } else {
                        console.error(`Submodel ${file} does not have a register method.`);
                    }
                } else {
                    console.error(`Submodel ${file} is not a class or constructor function.`);
                }
            } else {
                // This is a custom model
                const modelPath = path.join(directory, file);
                console.log('Loading custom model:', modelPath);
                const CustomModelClass = require(modelPath);
                console.log(CustomModelClass);

                if (typeof CustomModelClass === 'function') {
                    const customModelInstance = new CustomModelClass();
                    if (typeof customModelInstance.register === 'function') {
                        const model = customModelInstance.register();
                        customModels[customModelInstance.modelName] = {
                            model,
                            modelName: customModelInstance.modelName,
                            title: customModelInstance.title,
                            menuName: customModelInstance.menuName,
                            icon: customModelInstance.icon,
                            position: customModelInstance.position,
                            slug: customModelInstance.slug,
                            table: customModelInstance.table
                        };
                        modelSlugs[customModelInstance.slug] = customModelInstance.modelName; // Store slug
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
    return customModels[modelName]?.model || null;
}

function getModelNameBySlug(slug) {
    return modelSlugs[slug] || null;
}

function getCustomModelMeta(modelName) {
    return customModels[modelName] || {};
}

module.exports = {
    loadModels,
    getSubmodels,
    getAllSubmodels,
    getCustomModel,
    getModelNameBySlug,
    getCustomModelMeta
};
