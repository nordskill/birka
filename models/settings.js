const mongoose = require('mongoose');
const { Schema } = mongoose;

const SettingsSchema = new Schema({
    name: {
        type: String,
        trim: true
    },
    brand_name: {
        type: String,
        trim: true
    },
    logo: { ref: 'File', type: Schema.Types.ObjectId },
    domain: {
        type: String,
        trim: true
    },
    social_links: [{
        name: {
            type: String,
            trim: true
        },
        url: {
            type: String,
            trim: true
        },
        icon: { ref: 'File', type: Schema.Types.ObjectId }
    }],
    custom_html: String,
    custom_html_cookies: String,
    language: {
        type: String,
        required: true,
        trim: true,
        default: 'en'
    },
    currency: {
        type: String,
        trim: true
    },
    img_sizes: [{
        type: Number
    }],
    // tax: {
    //     rate: Number,
    //     tax_included: Boolean,
    //     // VAT // TBD...
    //     show_with_tax: Boolean
    // },
    // home_page: { type: Schema.Types.Mixed, required: true, default: {} }
}, { timestamps: true });

const Settings = mongoose.model('Settings', SettingsSchema);
module.exports = Settings;