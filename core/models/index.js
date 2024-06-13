const BlogPost = require('./blog-post');
const Category = require('./category');
const Menu = require('./menu');
const Order = require('./order');
const Page = require('./page');
const Product = require('./product');
const Settings = require('./settings');
const Tag = require('./tag');
const User = require('./user');
const Status = require('./status');
const EmailTemplate = require('./email-template');
const Member = require('./member');
const Notification = require('./notification');
const { File, Image, Video } = require('./file');

module.exports = {
    BlogPost,
    Category,
    File,
    Image,
    Video,
    Menu,
    Order,
    Page,
    Product,
    Settings,
    Tag,
    User,
    Status,
    EmailTemplate,
    Member,
    Notification
};
