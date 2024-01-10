const mongoose = require('mongoose');
const {
    Schema
} = mongoose;

const BlogPostSchema = new Schema({
    title: {
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
    img_preview: {
        ref: 'File',
        type: Schema.Types.ObjectId
    },
    // img_cover:      { ref: 'File', type: Schema.Types.ObjectId },
    date_published: Date,
    author: {
        ref: 'User',
        type: Schema.Types.ObjectId,
    },
    body: [Schema.Types.Mixed],
    tags: [{
        ref: 'Tag',
        type: Schema.Types.ObjectId
    }]
}, { timestamps: true });

const Blog = mongoose.model('Blog', BlogPostSchema);

module.exports = Blog;