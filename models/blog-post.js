const mongoose = require('mongoose');
const {
    Schema
} = mongoose;

const BlogPostSchema = new Schema({
    title: String,
    slug: String,
    excerpt: String,
    published: Boolean,
    img_preview: {
        ref: 'File',
        type: Schema.Types.ObjectId
    },
    // img_cover:      { ref: 'File', type: Schema.Types.ObjectId },
    date_created: {
        type: Date,
        required: true,
        default: Date.now
    },
    date_published: Date,
    date_updated: Date,
    author: {
        ref: 'User',
        type: Schema.Types.ObjectId,
    },
    body: [Schema.Types.Mixed],
    tags: [{
        ref: 'Tag',
        type: Schema.Types.ObjectId
    }]
});

const Blog = mongoose.model('Blog', BlogPostSchema);

module.exports = Blog;