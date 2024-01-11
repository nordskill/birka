const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        mode: isProduction ? 'production' : 'development',
        entry: {
            main: './src/js/main.js',
            style: './src/sass/style.scss' // Assuming you have a main.scss entry file
        },
        output: {
            filename: isProduction ? '[name].min.js' : '[name].js',
            path: path.resolve(__dirname, 'public/js')
        },
        module: {
            rules: [
                {
                    test: /\.scss$/,
                    use: [
                        isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                        'sass-loader'
                    ]
                }
            ]
        },
        optimization: {
            minimize: isProduction,
            usedExports: true
        },
        performance: {
            hints: false
        },
        devtool: 'source-map',
        plugins: [
            new MiniCssExtractPlugin({
                filename: isProduction ? '../css/[name].min.css' : '../css/[name].css'
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
        watch: !isProduction
    };
};