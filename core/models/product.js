const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductSchema = new Schema({
	title: {
        type: String,
        trim: true
    },
	slug: {
        type: String,
        trim: true
    },
	description: {
        type: String,
        trim: true
    },
	price: {
		regular: Number,
		sale: Number,
		declared_value: Number,
        wholesale: Number
	},
    subscription: {
        ebn: {
            type: String,
            trim: true
        },
        period: Number,
        sign_up_fee: Number,
        free_trial: Number,
        first_period_price: Number
    },
    // sections: [{
    //     name: String,
    //     slug: String,
    //     content: String
    // }],
	sku: String,
    attributes: [{
        name: String,
        value: String,
        slug: String, // slugify(value)
        image:          { ref: 'File', type: Schema.Types.ObjectId }
    }],
    show_in_cat: Boolean,
    variants:          [{ ref: 'Product', type: Schema.Types.ObjectId }],
    thumbnail:          { ref: 'File', type: Schema.Types.ObjectId },
    // gallery:            [{ ref: 'File', type: Schema.Types.ObjectId }],
    // in_scock: Boolean,
    // weight: Number,
    // dimensions: {
    //     length: Number,
    //     width: Number,
    //     height: Number
    // },
    // enable_reviews: Boolean,
    // reviews: [{
    //     rating: Number,
    //     message: String,
    //     author:         { ref: 'User', type: Schema.Types.ObjectId }
    // }],
    published: Boolean,
    categories:         [{ ref: 'Category', type: Schema.Types.ObjectId }],
    tags:               [{ ref: 'Tag', type: Schema.Types.ObjectId }],
    // upsells:            [{ ref: 'Product', type: Schema.Types.ObjectId }],
    cross_sells:        [{ ref: 'Product', type: Schema.Types.ObjectId }],
	// custom_fields: [{
	// 	name: String,
	// 	label: String,
    //     value: String
	// }]
    custom:             [Schema.Types.Mixed]
}, { timestamps: true });

ProductSchema.index({ slug: 1 }, { unique: true, background: true });

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
