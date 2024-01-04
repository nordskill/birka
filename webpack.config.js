const path = require('path');

module.exports = (env, argv) => {
	const isProduction = argv.mode === 'production';

	return {
		mode: isProduction ? 'production' : 'development',
		entry: './src/js/main.js',
		output: {
			filename: isProduction ? 'main.min.js' : 'main.js',
			path: path.resolve(__dirname, 'public/js')
		},
		optimization: {
			minimize: isProduction,
			usedExports: true
		},
		performance: {
			hints: false
		},
		devtool: 'source-map'
	};
};
