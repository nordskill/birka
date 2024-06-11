const fs = require('fs');
const path = require('path');

const pluginRegistry = {};

function loadModels(pluginDirectory) {
    fs.readdirSync(pluginDirectory).forEach(file => {
        if (file.endsWith('.js')) {
            const pluginPath = path.join(pluginDirectory, file);
            const PluginClass = require(pluginPath);
            const pluginInstance = new PluginClass();
            const model = pluginInstance.register();

            if (!pluginRegistry[pluginInstance.model.modelName]) {
                pluginRegistry[pluginInstance.model.modelName] = [];
            }

            pluginRegistry[pluginInstance.model.modelName].push(pluginInstance.type);
        }
    });
}

function getSubmodels(modelName) {
    return pluginRegistry[modelName] || [];
}

function getAllSubmodels() {
    return pluginRegistry;
}

module.exports = {
    loadModels,
    getSubmodels,
    getAllSubmodels
};
