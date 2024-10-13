import fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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
    fs.readdirSync(directory).forEach(async file => {
        if (file.endsWith('.js')) {
            const modelPath = path.join(directory, file);
            try {
                const { default: model } = await import(modelPath);

                if (model && model.modelName) {
                    models[model.modelName] = model;
                } else {
                    console.error(`Model in file ${file} does not have a modelName property.`);
                }
            } catch (error) {
                console.error(`Error loading model from file ${file}:`, error);
            }
        }
    });
    return models;
}


async function loadCustomModels(directory, coreModels) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        if (file.endsWith('.js')) {
            const modelName = file.split('.')[0];
            const coreModelMatch = Object.keys(coreModels).some(coreModel => {
                const coreModelName = coreModel.toLowerCase();
                return modelName.toLowerCase().startsWith(coreModelName + '_');
            });

            const modelPath = path.join(directory, file);

            try {
                if (coreModelMatch) {
                    // This is a submodel
                    console.log('Loading custom submodel:', modelPath);
                    const { default: SubModelClass } = await import(modelPath);

                    if (typeof SubModelClass === 'function') {
                        const subModelInstance = new SubModelClass();
                        if (typeof subModelInstance.register === 'function') {
                            const model = subModelInstance.register();
                            if (subModelInstance.modelName) {
                                subModels[subModelInstance.modelName] = model;
                                pluginRegistry[subModelInstance.modelName] = subModelInstance.type; // Store submodel
                            } else {
                                console.error(`Submodel ${file} does not have a modelName property.`);
                            }
                        } else {
                            console.error(`Submodel ${file} does not have a register method.`);
                        }
                    } else {
                        console.error(`Submodel ${file} is not a class or constructor function.`);
                    }
                } else {
                    // This is a custom model
                    console.log('Loading custom model:', modelPath);
                    const { default: CustomModelClass } = await import(modelPath);

                    if (typeof CustomModelClass === 'function') {
                        const customModelInstance = new CustomModelClass();
                        if (typeof customModelInstance.register === 'function') {
                            const model = customModelInstance.register();
                            if (customModelInstance.modelName) {
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
                                console.error(`Custom model ${file} does not have a modelName property.`);
                            }
                        } else {
                            console.error(`Custom model ${file} does not have a register method.`);
                        }
                    } else {
                        console.error(`Custom model ${file} is not a class or constructor function.`);
                    }
                }
            } catch (error) {
                console.error(`Error loading model from file ${file}:`, error);
            }
        }
    }
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

export {
    loadModels,
    getSubmodels,
    getAllSubmodels,
    getCustomModel,
    getModelNameBySlug,
    getCustomModelMeta
};