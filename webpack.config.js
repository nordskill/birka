const fs = require('fs');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin'); // Import TerserPlugin

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    const skinEntries = generateThemeEntries();

    return {
        mode: isProduction ? 'production' : 'development',
        entry: {
            ...skinEntries,
            cms_main: './core/assets/js/cms/main.js',
            cms_style: './core/assets/sass/cms/style.scss',
        },
        output: {
            filename: (chunkData) => {
                const isCMSAsset = chunkData.chunk.name.startsWith('cms_');
                const isStyleChunk = chunkData.chunk.name.endsWith('_style');
                const skinName = chunkData.chunk.name.split('_')[0];
                const folder = isCMSAsset ? 'cms-assets/js/' : `${skinName}/js/`;
                return isProduction && !isStyleChunk
                    ? `${folder}main.min.js`
                    : `dev/[name].js`;
            },
            path: path.resolve(__dirname, 'public')
        },
        module: {
            rules: [
                {
                    test: /\.(scss|sass)$/,
                    use: [
                        isProduction
                            ? MiniCssExtractPlugin.loader
                            : 'style-loader', // Use style-loader in development
                        'css-loader',
                        'sass-loader'
                    ],
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: (pathData) => {
                            const pathSegments = pathData.filename.split('/');
                            const isCore = pathSegments[0] === 'core';
                            const skinName = isCore ? 'birka' : pathSegments[1];
                            return `${skinName}/fonts/[name][ext][query]`;
                        }
                    }
                }
            ],
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: (chunkData) => {
                    const isCMSAsset = chunkData.chunk.name.startsWith('cms_');
                    const skinName = chunkData.chunk.name.split('_')[0];
                    const folder = isCMSAsset ? 'cms-assets/css/' : `${skinName}/css/`;
                    return isProduction
                        ? `${folder}style.min.css`
                        : `dev/[name].css`;
                },
            }),
            new BrowserSyncPlugin({
                host: 'localhost',
                port: 3001,
                proxy: 'http://localhost:3000',
                files: [
                    'public/**/*.css',
                    'public/**/*.js',
                    '!public/files/**/*.*',
                    'core/views/**/*.ejs',
                    'custom/views/**/*.ejs'
                ]
            }),
        ].filter(Boolean),
        optimization: {
            minimize: isProduction,
            minimizer: isProduction ? [new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true, // Remove console logs
                        dead_code: true,    // Remove unreachable code
                        unused: true,       // Remove unused variables and functions
                        warnings: false,    // display warnings when dropping unreachable code or unused declarations etc.
                        drop_debugger: true,// Remove debugger statements
                        inline: 2,          // Inline functions with arguments used < 2 times
                    },
                    output: {
                        comments: false, // remove all comments
                    },
                    ie8: false,
                    keep_fnames: false,
                    safari10: false
                },
            })] : [],
            usedExports: true,
        },
        performance: {
            hints: false
        },
        watch: !isProduction,
        watchOptions: {
            ignored: [
                path.resolve(__dirname, 'node_modules'),
                path.resolve(__dirname, 'public')
            ]
        },
        devtool: isProduction ? 'source-map' : false
    };
};


function generateThemeEntries() {
    const skinsDir = path.resolve(__dirname, 'custom');
    const skinFolders = fs.readdirSync(skinsDir);
    const entries = {
        birka_main: path.resolve(__dirname, 'core/assets/js/main.js'),
        birka_style: path.resolve(__dirname, 'core/assets/sass/style.scss')
    };

    skinFolders.forEach(folder => {
        const skinPath = path.join(skinsDir, folder, 'assets');
        if (fs.existsSync(skinPath)) {
            // Assuming each skin has a 'js' and 'scss' folder with 'main.js' and 'style.scss'
            entries[`${folder}_main`] = path.join(skinPath, 'js', 'main.js');
            entries[`${folder}_style`] = path.join(skinPath, 'sass', 'style.scss');
        }
    });

    return entries;
}
