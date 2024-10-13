import mongoose from 'mongoose';
const { Schema } = mongoose;


const FileSchema = new Schema({
    type: {
        type: String,
        trim: true
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
    },
    custom: [Schema.Types.Mixed]
}, { timestamps: true });

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

const Image = File.discriminator('Image', ImageSchema);
const Video = File.discriminator('Video', VideoSchema);

export { File, Image, Video };