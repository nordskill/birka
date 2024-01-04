const webpack = require('webpack');
const configFunc = require('../webpack.config.js');

const config = configFunc(null, { mode: 'development' });
const compiler = webpack(config);

function buildJS() {

    console.log('Bundling JS...');

    compiler.run((err, stats) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('JS has been bundled.');
    });
    
}
module.exports = buildJS;