const mongoose = require('mongoose');
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
    date_updated: Date,
    date_created: {
        type: Date,
        required: true,
        default: Date.now
    },
});

const EmailTemplate = mongoose.model('EmailTemplate', EmailTemplateSchema);

module.exports = EmailTemplate;
