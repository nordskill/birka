const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin'); // Import TerserPlugin
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

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
                let folder = chunkData.chunk.name.includes('cms_') ? 'cms/js/' : 'js/';
                return isProduction
                    ? `${folder}[name].min.js`
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
                    let folder = chunkData.chunk.name.includes('cms_') ? 'cms/css/' : 'css/';
                    return isProduction
                        ? `${folder}[name].min.css`
                        : `dev/[name].js`;
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
            }),
            // new BundleAnalyzerPlugin()
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

