const fs = require('fs').promises;
const db = require('../core/functions/db-connect');
const path = require('path');
const mongoose = require('mongoose');
const loadVars = require('../core/functions/vars');
const passwordUtils = require('../core/functions/password-utils');
const generateHash = require('../core/functions/generate-hash');
const resizeImage = require('../core/functions/image-resizer');
const { copyFiles } = require('../core/functions/copy-files');

const pathToModels = path.join(__dirname, '../core/models');
const pathToData = path.join(__dirname, '../data/demo');

loadVars();

// Use an argument with function names to run only specific functions via the 
// command line.
//
// Example: npm run demo-content insert_tag_data insert_user_data
// If no arguments are provided, all functions will run in the order they are 
// defined.
//
// Note: If some function uses data from another function, make sure to run
// the required function first.
const functionMap = {
    'insert_tag_data': insert_tag_data,
    'insert_email_template_data': insert_email_template_data,
    'insert_file_data': insert_file_data,
    'insert_settings_data': insert_settings_data,
    'insert_member_data': insert_member_data,
    'insert_user_data': insert_user_data,
    'insert_notification_data': insert_notification_data,
    'insert_status_data': insert_status_data,
    'insert_blog_post_data': insert_blog_post_data,
    'insert_category_data': insert_category_data,
    'insert_product_data': insert_product_data,
    'insert_page_data': insert_page_data,
    'insert_menu_data': insert_menu_data
};

(async () => {
    await db.connect();
    console.log('----------');

    const args = process.argv.slice(2); // Remove the first two default arguments (node path and script path)

    if (args.length === 0) {
        // No specific function requested; run them all
        for (const func of Object.values(functionMap)) {
            await func();
        }
    } else {
        // Run only the functions specified in the arguments
        for (const arg of args) {
            const func = functionMap[arg];
            if (func) {
                await func();
            } else {
                console.log(`No function matches the argument: ${arg}`);
            }
        }
    }

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
            const SS_IMG_SIZES = [150, 300, 600, 1024, 1500, 2048, 2560];
            const result = await resizeImage(newFilePath, SS_IMG_SIZES, newFolderPath);
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

async function insert_member_data() {
    const { model, data } = load_files('member');

    try {
        // Hash the passwords for all users and create new members
        const members = await Promise.all(data.map(async (user) => {
            const hashedPassword = await passwordUtils.hashPassword(user.password);
            return new model({
                username: user.username,
                password: hashedPassword,
                email: user.email,
                role: user.role || 'Editor',
                email_notifications: user.email_notifications || false,
                web_notifications: user.web_notifications || false
            });
        }));

        await model.insertMany(members);
        console.log(`Inserted ${members.length} team members`);
    } catch (error) {
        console.error(error);
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
    const backpackID = (await File.find({ file_name: 'backpack' }, '_id').exec())[0]._id.toString();
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

    const from = path.join(__dirname, '../data/demo/models');
    const to = path.join(__dirname, '../custom/birka/models');
    await copyFiles(from, to);

    const { data: pageData } = load_files('page'); // Assuming this returns an array of page objects
    const { model: memberModel } = load_files('member');
    const { File } = require(path.join(pathToModels, 'file.js'));
    const HomePage = require(path.join(to, 'page_home.js'));
    const AboutPage = require(path.join(to, 'page_about.js'));
    const ArticlePage = require(path.join(to, 'page_article.js'));
    const ContactPage = require(path.join(to, 'page_contact.js'));

    // Instantiate and register models
    const homePluginInstance = new HomePage();
    homePluginInstance.register();
    const aboutPluginInstance = new AboutPage();
    aboutPluginInstance.register();
    const articlePluginInstance = new ArticlePage();
    articlePluginInstance.register();
    const contactPluginInstance = new ContactPage();
    contactPluginInstance.register();

    const admin = await memberModel.findOne({}).exec();
    const imagesIDs = (await File.find({
        $or: [
            { file_name: 'about_icon' },
            { file_name: 'services_icon' },
            { file_name: 'blog_icon' },
        ]
    })).map(obj => obj._id);

    const randomTags = await getTags();

    for (let i = 0; i < pageData.length; i++) {
        const data = pageData[i];
        data.img_preview = imagesIDs[i % imagesIDs.length];
        data.author = admin._id;
        data.tags = randomTags().slice(0, 3);

        let model;
        switch (data.type) {
            case 'Home':
                model = homePluginInstance.get_model();
                break;
            case 'About':
                model = aboutPluginInstance.get_model();
                break;
            case 'Article':
                model = articlePluginInstance.get_model();
                break;
            case 'Contact':
                model = contactPluginInstance.get_model();
                break;
            default:
                console.error(`Unsupported page type: ${data.type}`);
                continue; // Skip unsupported page types
        }

        try {
            await model.create(data);
            console.log(`Inserted page of type ${data.type}`);
        } catch (error) {
            console.error(`Error inserting data for page of type ${data.type}:`, error);
        }
    }
}

async function insert_settings_data() {
    const { model: settingsModel, data: settingsData } = load_files('settings');
    try {
        await settingsModel.insertMany(settingsData);
        console.log(`inserted settings data`);
    } catch (error) {
        console.log(error);
    }
}

async function insert_menu_data() {
    const { model: pageModel } = load_files('page'); // Load the page model
    const { model: menuModel } = load_files('menu'); // Load the menu model

    // Fetch all pages from the database
    const pages = await pageModel.find({}).exec();

    // Map pages to menu items
    const menuItems = pages.map(page => ({
        name: page.name,
        title: page.excerpt,
        url: page.is_home ? '/' : `/${page.slug}`,
        target: '_self',
        entity_type: 'Page',
        entity_id: page._id,
        order: 0
    }));

    // Create a new menu object
    const mainMenu = new menuModel({
        name: 'Main Menu',
        items: menuItems
    });

    // Save the new menu to the database
    try {
        await mainMenu.save();
        console.log('Main Menu created with links to all the pages.');
    } catch (error) {
        console.log('Error creating Main Menu:', error);
    }
}
