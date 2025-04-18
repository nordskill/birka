import mongoose from 'mongoose';
const { Schema } = mongoose;


const TagSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        required: true
    },
    used: {
        type: Number,
        default: 0
    },
    custom: [Schema.Types.Mixed]
}, { timestamps: true });

TagSchema.index({ slug: 1 }, { unique: true, background: true });

const Tag = mongoose.model('Tag', TagSchema);

export default Tag;
