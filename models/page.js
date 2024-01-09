const mongoose = require('mongoose');
const { Schema } = mongoose;

const PageSchema = new Schema({
    name: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        trim: true
    },
    excerpt: {
        type: String,
        trim: true
    },
    published: Boolean,
    date_published: Date,
    date_updated: Date,
    date_created:   { type: Date, required: true, default: Date.now },
    img_preview:    { ref: 'File', type: Schema.Types.ObjectId },
    author:         { ref: 'User', type: Schema.Types.ObjectId },
    sub_pages: [    { ref: 'Page', type: Schema.Types.ObjectId }],
    tags:   [       { ref: 'Tag', type: Schema.Types.ObjectId }],
    content:        [Schema.Types.Mixed]
});

const Page = mongoose.model('Page', PageSchema);

module.exports = Page;
