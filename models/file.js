const mongoose = require('mongoose');
const { Schema } = mongoose;

const FileSchema = new Schema({
    type: {
        type: String,
        trim: true
    },
    date_created: {
        type: Date,
        required: true,
        default: Date.now
    },
    title: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    size: Number,
    file_name: {
        type: String,
        trim: true
    },
    mime_type: {
        type: String,
        trim: true
    },
    extension: {
        type: String,
        trim: true
    },
    hash: {
        type: String,
        trim: true
    },
    tags: [{ ref: 'Tag', type: Schema.Types.ObjectId }],
    used: {
        type: Number,
        default: 0
    }
});

const File = mongoose.model('File', FileSchema);

const ImageSchema = new Schema({
    height: Number,
    width: Number,
    alt: {
        type: String,
        trim: true
    },
    sizes: Array,
    optimized_format: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        required: true,
        default: 'uploaded'
    }
});

const VideoSchema = new Schema({
    height: Number,
    width: Number,
    fps: Number,
    duration: Number
});

File.discriminator('Image', ImageSchema);
File.discriminator('Video', VideoSchema);

module.exports = {
    File,
    Image: mongoose.model('Image'),
    Video: mongoose.model('Video')
};