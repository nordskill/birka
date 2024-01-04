const mongoose = require('mongoose');
const { Schema } = mongoose;

const EmailTemplateSchema = new Schema({
    name: String,
    file_name: String,
    note: String,
    date_updated: Date,
    date_created: { type: Date, required: true, default: Date.now },
});

const EmailTemplate = mongoose.model('EmailTemplate', EmailTemplateSchema);

module.exports = EmailTemplate;
