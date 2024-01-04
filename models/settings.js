const mongoose = require('mongoose');
const { Schema } = mongoose;

const SettingsSchema = new Schema({
    name: String,
    brand_name: String,
    domain: String,
    social_links: [{
        name: String,
        url: String,
        icon: { ref: 'File', type: Schema.Types.ObjectId }
    }],
    custom_html: String,
    language: { type: String, required: true, default: 'en' },
    currency: String,
    // tax: {
    //     rate: Number,
    //     tax_included: Boolean,
    //     // VAT // TBD...
    //     show_with_tax: Boolean
    // },
    // home_page: { type: Schema.Types.Mixed, required: true, default: {} }
});

const Settings = mongoose.model('Settings', SettingsSchema);
module.exports = Settings;