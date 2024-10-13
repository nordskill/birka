import mongoose from 'mongoose';
const { Schema } = mongoose;


const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    parent: { ref: 'Category', type: Schema.Types.ObjectId },
    image:  { ref: 'File', type: Schema.Types.ObjectId },
    isActive: {
        type: Boolean,
        default: true
    },
    custom: [Schema.Types.Mixed]
}, { timestamps: true });

// Auto-update the updatedAt field before save
categorySchema.pre('save', (next) => {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Category', categorySchema);