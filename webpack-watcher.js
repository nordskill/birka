const chokidar = require('chokidar');
const buildJS = require('./scripts/build-js.js');


chokidar.watch('./src/js').on('change', buildJS);