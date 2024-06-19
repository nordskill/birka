const mongoose = require('mongoose');
const { Schema } = mongoose;

const options = {
    discriminatorKey: 'type',
    timestamps: true
};

const PageSchema = new Schema({
    name: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    excerpt: {
        type: String,
        trim: true
    },
    published: Boolean,
    date_published: Date,
    template: {
        type: String,
        trim: true
    },
    is_home: Boolean,
    author:         { ref: 'Member',type: Schema.Types.ObjectId },
    img_preview:    { ref: 'File', type: Schema.Types.ObjectId },
    tags: [         { ref: 'Tag', type: Schema.Types.ObjectId }],
    content: [Schema.Types.Mixed],
    draft: [Schema.Types.Mixed],
    content_rendered: String,
    content_draft: String,
    custom: [Schema.Types.Mixed]
}, options);

PageSchema.index({ slug: 1 });

const Page = mongoose.model('Page', PageSchema);

module.exports = Page;
