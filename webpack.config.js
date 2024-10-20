import fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import BrowserSyncPlugin from 'browser-sync-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

import copyFiles from './core/functions/copy-files.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async (env, argv) => {
    const isProduction = argv.mode === 'production';
    const skinEntries = await generateThemeEntries();

    return {
        mode: isProduction ? 'production' : 'development',
        entry: {
            ...skinEntries,
            cms_main: './core/assets/js/main.js',
            cms_style: './core/assets/sass/style.scss',
        },
        output: {
            filename: (chunkData) => {
                const isCMSAsset = chunkData.chunk.name.startsWith('cms_');
                const isStyleChunk = chunkData.chunk.name.endsWith('_style');
                const skinName = chunkData.chunk.name.split('_')[0];
                const folder = isCMSAsset ? 'cms-assets/js/' : `${skinName}/js/`;
                const filename = isProduction && !isStyleChunk
                    ? `${folder}main.min.js`
                    : `dev/[name].js`;
                console.log(`Output filename for ${chunkData.chunk.name}:`, filename);
                return filename;
            },
            path: path.resolve(__dirname, 'public')
        },
        module: {
            rules: [
                {
                    test: /\.(scss|sass)$/,
                    use: [
                        isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                        'sass-loader',
                        {
                            loader: 'sass-loader',
                            options: {
                                sassOptions: {
                                    quietDeps: true
                                }
                            }
                        }
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
                    'custom/**/*.ejs'
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


async function generateThemeEntries() {
    const skinsDir = path.resolve(__dirname, 'custom');
    const skinFolders = fs.readdirSync(skinsDir);
    console.log('Scanning directory:', skinsDir);
    console.log('Found skin folders:', skinFolders);
    const entries = {};

    for (let folder of skinFolders) {
        const skinPath = path.join(skinsDir, folder, 'assets');
        if (fs.existsSync(skinPath)) {
            entries[`${folder}_main`] = path.join(skinPath, 'js/main.js');
            entries[`${folder}_style`] = path.join(skinPath, 'sass/style.scss');
            console.log(`Generated entry for: ${folder}`, entries[`${folder}_main`], entries[`${folder}_style`]);

            const imgSourcePath = path.join(skinPath, 'img');
            if (fs.existsSync(imgSourcePath)) {
                const imgDestPath = path.resolve(__dirname, 'public', folder, 'img');
                fs.mkdirSync(imgDestPath, { recursive: true });
                await copyFiles(imgSourcePath, imgDestPath);
            }
        }
    }
    console.log('All generated entries:', entries);
    return entries;
}
