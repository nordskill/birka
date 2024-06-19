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
        ref: 'Member',
        type: Schema.Types.ObjectId,
    },
    body: [Schema.Types.Mixed],
    draft: [Schema.Types.Mixed],
    body_rendered: String,
    draft_rendered: String,
    tags: [{
        ref: 'Tag',
        type: Schema.Types.ObjectId
    }],
    custom: [Schema.Types.Mixed]
}, { timestamps: true });

const BlogPost = mongoose.model('BlogPost', BlogPostSchema);

module.exports = BlogPost;