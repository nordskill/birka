const mongoose = require('mongoose');
const { Schema } = mongoose;

const FileSchema = new Schema({
    type:           String,
    date_created:   { type: Date, required: true, default: Date.now },
    title:          String, // for SVGs
    description:    String,
    size:           Number,
    file_name:      String,
    mime_type:      String,
    extension:      String,
    hash:           String,
    tags:           [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    used: {
        type: Number,
        default: 0
    }
});

const File = mongoose.model('File', FileSchema);

const ImageSchema = new Schema({
    height:             Number,
    width:              Number,
    alt:                String,
    sizes:              Array,
    optimized_format:   String,
    status:             { type: String, required: true, default: 'uploaded' }
});

const VideoSchema = new Schema({
    height:     Number,
    width:      Number,
    fps:        Number,
    duration:   Number,
    title:      String
});

const SvgSchema = new Schema({
    title: String,
    description: String
});

File.discriminator('Image', ImageSchema);
File.discriminator('Video', VideoSchema);

module.exports = {
    File,
    Image: mongoose.model('Image'),
    Video: mongoose.model('Video')
};