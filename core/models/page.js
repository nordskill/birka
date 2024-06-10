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
        trim: true
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
    img_preview:    { ref: 'File', type: Schema.Types.ObjectId },
    author:         { ref: 'User', type: Schema.Types.ObjectId },
    tags: [         { ref: 'Tag', type: Schema.Types.ObjectId }]
}, options);

PageSchema.index({ slug: 1 });

const Page = mongoose.model('Page', PageSchema);

module.exports = Page;
