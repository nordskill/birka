const mongoose = require('mongoose');
const {
	Schema
} = mongoose;

const UserSchema = new Schema({
	account_details: {
		username: String,
		password: String,
		email: String,
		avatar: {
			ref: 'File',
			type: Schema.Types.ObjectId
		},
		role: String,
		email_notifications: Boolean,
		web_notifications: Boolean
	},
	billing: {
		email: String,
		business: Boolean,
		details: String
	},
	shipping: [{
		full_name: String,
		company_name: String,
		street_address_1: String,
		street_address_2: String,
		zip_code: String,
		city: String,
		region: String,
		default: Boolean,
		name: String,
		country: {
			code: String,
			name: String
		},
		email: String,
		phone: Number
	}],
	cart: {
		products: [{
			ref: 'Product',
			type: Schema.Types.ObjectId
		}],
		// expires: Date
	}
});

const User = mongoose.model('User', UserSchema);
module.exports = User;