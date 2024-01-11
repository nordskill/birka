const fs = require('fs').promises;
const db = require('../functions/db-connect');
const path = require('path');
const mongoose = require('mongoose');
const loadVars = require('../functions/vars');
const passwordUtils = require('../functions/password-utils');
const generateHash = require('../functions/generate-hash');
const resizeImage = require('../functions/image-resizer');
const readline = require('readline');

const pathToModels = path.join(__dirname, '..', 'models');
const pathToData = path.join(__dirname, '..', 'data', 'demo');

loadVars();

(async () => {
    await db.connect();
    console.log('----------');
    await insert_tag_data();
    await insert_email_template_data();
    await insert_file_data();
    await insert_user_data();
    await insert_notification_data();
    await insert_status_data();
    await insert_blog_post_data();
    await insert_category_data();
    await insert_product_data();
    await insert_page_data();
    await insert_settings_data();
    console.log('----------');
    console.log(`Database name: ${process.env.DB_NAME}`);
    console.log('----------');
    db.disconnect();
    process.exit(0);
})();


function load_files(collection) {
    return {
        model: require(path.join(pathToModels, collection + '.js')),
        data: require(path.join(pathToData, collection + '.json'))
    }
}

async function getTags() {
    const tagModel = require(path.join(pathToModels, 'tag'));
    const tags = await tagModel.find({}).exec();
    const tagIDs = tags.map(tag => tag._id.toString());

    return function () {
        if (tagIDs.length === 0) {
            return [];
        }

        let randomTags = new Set();
        const amountToDraw = Math.ceil(Math.random() * tagIDs.length);

        while (randomTags.size < amountToDraw) {
            const index = Math.floor(Math.random() * tagIDs.length);
            randomTags.add(tagIDs[index]);
        }

        return Array.from(randomTags);
    }
}

async function insert_tag_data() {
    const { model, data } = load_files('tag');

    try {
        await model.insertMany(data);
        console.log(`inserted ${data.length} tags`);
    } catch (error) {
        console.log(error);
    }
}

async function insert_email_template_data() {
    const { model, data } = load_files('email-template');

    try {
        await model.insertMany(data);
        console.log(`inserted ${data.length} email templates`);
    } catch (error) {
        console.log(error);
    }
}

async function insert_file_data() {
    const { File, Image, Video } = require(path.join(pathToModels, 'file.js'));
    const data = JSON.parse(await fs.readFile(path.join(pathToData, 'file.json'), 'utf-8'));

    const randomTags = await getTags();

    for (const object of data) {
        object.tags = randomTags();

        const originalFilePath = path.join('./data/demo/files', `${object.file_name}.${object.extension}`);

        try {
            await fs.access(originalFilePath);
        } catch (error) {
            console.warn(`File not found: ${originalFilePath}, skipping.`);
            continue;
        }

        const hash = await generateHash(originalFilePath);
        const newFolderPath = path.join('./public/files', hash.substring(0, 2));
        const newFilePath = path.join(newFolderPath, `${object.file_name}.${object.extension}`);

        await fs.mkdir(newFolderPath, { recursive: true });
        await fs.copyFile(originalFilePath, newFilePath);

        if (object.mime_type.startsWith('image')) {
            const result = await resizeImage(newFilePath, [150, 300, 600, 1024, 1500, 2048, 2560], newFolderPath);
            console.log(object.file_name, ':', Math.round(result.time), 'ms');
            object.status = 'optimized';
            object.sizes = result.sizes;
            object.optimized_format = result.format;
        }

        object.hash = hash;
    }

    // Insert data into the database
    try {
        const images = data.filter(doc => doc.type === 'image');
        const videos = data.filter(doc => doc.type === 'video');
        const insertedImages = await Image.insertMany(images);
        const insertedVideos = await Video.insertMany(videos);
        console.log(`Inserted ${insertedImages.length} images and ${insertedVideos.length} videos`);
    } catch (error) {
        console.error('Error inserting files:', error);
    }
}

async function insert_user_data() {
    const { File, Image, Video } = require(path.join(pathToModels, 'file.js'));
    const { model, data } = load_files('user');
    const avatarData = await File.findOne({ file_name: 'default_avatar' }, '_id').exec();
    const id = avatarData._id.toString();

    data.forEach(user => {
        user.account_details.avatar = id;
    });

    try {
        // Hash the passwords for all users
        const hashedUsers = await Promise.all(data.map(async (user) => {
            const hashedPassword = await passwordUtils.hashPassword(user.account_details.password);
            user.account_details.password = hashedPassword;
            return user;
        }));

        await model.insertMany(hashedUsers);
        console.log(`Inserted ${hashedUsers.length} users`);
    } catch (error) {
        console.error(error);
    }

}

async function insert_notification_data() {
    const { model: notificationModel, data: notificationData } = load_files('notification');
    const { model: userModel } = load_files('user');
    const { model: emailTemplateModel } = load_files('email-template');

    const users = await userModel.find({}, '_id').exec();
    const userIDs = users.map(obj => obj._id.toString());

    const emailTemplates = await emailTemplateModel.find({}, '_id').exec();
    const emailTemplateIDs = emailTemplates.map(obj => obj._id.toString());

    notificationData[0].notify_users = [userIDs[2]]
    notificationData[1].notify_users = [userIDs[0], userIDs[1]]
    notificationData[2].notify_users = userIDs[2];
    notificationData[3].notify_users = userIDs[0];
    notificationData[4].notify_users = userIDs[1];

    for (let i = 0; i < 5; i++) {
        notificationData[i].email_template = emailTemplateIDs[i];
    }


    try {
        await notificationModel.insertMany(notificationData);
        console.log(`inserted ${notificationData.length} notifications`);
    } catch (error) {
        console.log(error);
    }
}

async function insert_status_data() {
    const { model, data } = load_files('status');

    try {
        await model.insertMany(data);
        console.log(`inserted ${data.length} statuses`);
    }
    catch (error) {
        console.log(error);
    }
}

async function insert_blog_post_data() {
    const { model: blogModel, data: blogData } = load_files('blog-post');
    const { File } = require(path.join(pathToModels, 'file.js'));
    const { model: userModel } = load_files('user');

    const blogs = await File.find({}, '_id').limit(25);
    const blogImagesID = blogs.map(obj => obj._id.toString());

    const firstAdmin = await userModel.findOne({}, '_id');
    const firstAdminsID = firstAdmin._id.toString();

    const randomTags = await getTags();

    for (let i = 0; i < blogData.length; i++) {
        blogData[i].img_preview = blogData[i].img_cover = blogImagesID[i];
        blogData[i].author = blogData[i].publisher = firstAdminsID;
        blogData[i].tags = randomTags();
    }

    try {
        await blogModel.insertMany(blogData);
        console.log(`inserted ${blogData.length} blog posts`);
    }
    catch (error) {
        console.log(error);
    }
}

async function insert_category_data() {
    const { model: categoryModel, data: categoryData } = load_files('category');
    const { File } = require(path.join(pathToModels, 'file.js'));

    const categoryImages = await File.find({ file_name: /category$/ }, '_id').exec();
    const categoryImageIDs = categoryImages.map(obj => obj._id.toString());

    for (let i = 0; i < categoryData.length; i++) {
        categoryData[i]._id = new mongoose.Types.ObjectId;
        categoryData[i].image = categoryImageIDs[i];
    }

    categoryData[3].parent = categoryData[0]._id;

    try {
        await categoryModel.insertMany(categoryData);
        console.log(`inserted ${categoryData.length} categories`);
    } catch (error) {
        console.log(error);
    }


}

async function insert_product_data() {
    const { model: productModel, data: productData } = load_files('product');
    const { model: categoryModel } = load_files('category');
    const { File } = require(path.join(pathToModels, 'file.js'));

    const randomTags = await getTags();

    const jacketsIDs = (await File.find({ file_name: /^jacket/ }).exec()).map(obj => obj._id.toString());
    const backpackID = (await File.find({ file_name: 'backpack', mime_type: 'image/png' }, '_id').exec())[0]._id.toString();
    const tentID = (await File.find({ file_name: 'tent' }, '_id').exec())[0]._id.toString();
    const satteliteInternetID = (await File.find({ file_name: 'satellite-internet' }, '_id').exec())[0]._id.toString();
    const sleepingBagID = (await File.find({ file_name: 'sleeping-bag' }, '_id').exec())[0]._id.toString();
    const categoryIDs = (await categoryModel.find({}, '_id').exec()).map(obj => obj._id.toString());

    productData[0].thumbnail = satteliteInternetID;
    productData[1].thumbnail = backpackID;
    productData[2].thumbnail = tentID;
    productData[3].thumbnail = sleepingBagID;
    productData[4].thumbnail = jacketsIDs[0];

    let variants = [];
    for (let i = 5, j = 1; i < 8 && j < 4; i++, j++) {
        productData[i]._id = new mongoose.Types.ObjectId();
        productData[i].categories = categoryIDs[Math.floor(Math.random() * categoryIDs.length)];
        productData[i].thumbnail = jacketsIDs[j];
        variants.push(productData[i]._id);
    }

    productData[4].variants = variants;

    productData.forEach(data => {
        data.categories = categoryIDs[Math.floor(Math.random() * categoryIDs.length)];
        data.tags = randomTags();
    })

    try {
        await productModel.insertMany(productData);
        console.log(`inserted ${productData.length} products`);
    } catch (error) {
        console.log(error);
    }
}

async function insert_page_data() {
    const { model: pageModel, data: pageData } = load_files('page');
    const { model: userModel } = load_files('user');
    const { File } = require(path.join(pathToModels, 'file.js'));

    const secondAdminID = (await userModel.find({}, '_id').exec())[1]._id.toString();
    const imagesIDs = (await File.find({
        $or: [
            { file_name: 'about_icon' },
            { file_name: 'services_icon' },
            { file_name: 'blog_icon' },
        ]
    })).map(obj => obj._id.toString());

    const randomTags = await getTags();

    for (let i = 0; i < pageData.length; i++) {
        const id = new mongoose.Types.ObjectId;
        pageData[i]._id = id;
        pageData[i].img_preview = imagesIDs[i];
        pageData[i].author = pageData[i].publisher = secondAdminID;
        pageData[i].tags = randomTags();
    }

    pageData[0].sub_pages = [pageData[2]._id];

    try {
        await pageModel.insertMany(pageData);
        console.log(`inserted ${pageData.length} pages`);
    } catch (error) {
        console.log(error);
    }
}

async function insert_settings_data() {
    const { model: settingsModel, data: settingsData } = load_files('settings');
    const { File } = require(path.join(pathToModels, 'file.js'));

    const fbID = (await File.findOne({ file_name: 'facebook_icon' }, '_id'))._id.toString();
    const twitterID = (await File.findOne({ file_name: 'twitter_icon' }, '_id'))._id.toString();
    const instagramID = (await File.findOne({ file_name: 'instagram_icon' }, '_id'))._id.toString();

    settingsData.social_links[0].icon = fbID;
    settingsData.social_links[1].icon = twitterID;
    settingsData.social_links[2].icon = instagramID;

    try {
        await settingsModel.insertMany(settingsData);
        console.log(`inserted settings data`);
    } catch (error) {
        console.log(error);
    }
}