import mongoose from 'mongoose';
const { Schema } = mongoose;


const EmailTemplateSchema = new Schema({
    name: {
        type: String,
        trim: true
    },
    file_name: {
        type: String,
        trim: true
    },
    note: {
        type: String,
        trim: true
    },
    custom: [Schema.Types.Mixed]
}, { timestamps: true });

const EmailTemplate = mongoose.model('EmailTemplate', EmailTemplateSchema);

export default EmailTemplate;
