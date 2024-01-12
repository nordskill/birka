// const path = require('path');
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

// module.exports = (env, argv) => {
//     const isProduction = argv.mode === 'production';

//     return {
//         mode: isProduction ? 'production' : 'development',
//         entry: {
//             main: './src/js/main.js',
//             style: './src/sass/style.scss', // Assuming you have a main.scss entry file
//             cms_main: './src/js/cms/main.js',
//             cms_style: './src/sass/cms/style.scss',
//         },
//         output: {
//             filename: (chunkData) => {
//                 return chunkData.chunk.name.includes('cms_') ? '../js/cms/[name].min.js' : '[name].min.js';
//             },
//             path: path.resolve(__dirname, 'public/js')
//         },
//         module: {
//             rules: [
//                 {
//                     test: /\.scss$/,
//                     use: [
//                         isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
//                         'css-loader',
//                         'sass-loader'
//                     ]
//                 }
//             ]
//         },
//         optimization: {
//             minimize: isProduction,
//             usedExports: true
//         },
//         performance: {
//             hints: false
//         },
//         devtool: 'source-map',
//         plugins: [
//             new MiniCssExtractPlugin({
//                 filename: (chunkData) => {
//                     console.log(1);

//                     let name = chunkData.chunk.name.includes('cms_') ? '../css/cms/[name]' : '../css/[name]';
//                     console.log(isProduction);

//                     name += isProduction ? '.min.css' : '.css';
//                     return name;
//                 }
//             }),            
//             new BrowserSyncPlugin({
//                 host: 'localhost',
//                 port: 3001,
//                 proxy: 'http://localhost:3000',
//                 files: [
//                     'public/**/*.*',
//                     '!public/files/**/*.*', // Exclude files in public/files
//                     'views/**/*.ejs',
//                     'src/**/*.*'
//                 ]
//             })
//         ].filter(Boolean),
//         watch: !isProduction
//     };
// };

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin'); // Import TerserPlugin

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        mode: isProduction ? 'production' : 'development',
        entry: {
            main: './src/js/main.js',
            cms_main: './src/js/cms/main.js',
            style: './src/sass/style.scss',
            cms_style: './src/sass/cms/style.scss',
        },
        output: {
            filename: (chunkData) => {
                return isProduction
                    ? `js/[name].min.js`
                    : `dev/[name].js`;
            },
            path: path.resolve(__dirname, 'public')
        },
        module: {
            rules: [
                {
                    test: /\.scss$/,
                    use: [
                        isProduction
                            ? MiniCssExtractPlugin.loader
                            : 'style-loader', // Use style-loader in development
                        'css-loader',
                        'sass-loader'
                    ],
                }
            ],
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: (chunkData) => {
                    let folder = chunkData.chunk.name.includes('cms_') ? 'cms/' : '';
                    return isProduction
                        ? `css/${folder}[name].min.css`
                        : `dev/${folder}[name].js`; // Change to .js for development
                },
            }),
            new BrowserSyncPlugin({
                host: 'localhost',
                port: 3001,
                proxy: 'http://localhost:3000',
                files: [
                    'public/**/*.*',
                    '!public/files/**/*.*', // Exclude files in public/files
                    'views/**/*.ejs'
                ]
            })
        ].filter(Boolean),
        optimization: {
            minimize: isProduction,
            minimizer: isProduction ? [new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true, // Remove console logs
                        dead_code: true, // Remove unreachable code
                        unused: true, // Remove unused variables and functions
                        warnings: false, // display warnings when dropping unreachable code or unused declarations etc.
                        drop_debugger: true,
                        inline: 2, // Inline functions with arguments used < 2 times
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
        // devtool: 'source-map',
    };
};

