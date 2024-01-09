const mongoose = require('mongoose');
const {
	Schema
} = mongoose;

const UserSchema = new Schema({
	account_details: {
		username: {
			type: String,
			trim: true
		},
		password: String,
		email: {
			type: String,
			trim: true
		},
		avatar: { ref: 'File', type: Schema.Types.ObjectId },
		role: {
			type: String,
			trim: true
		},
		email_notifications: Boolean,
		web_notifications: Boolean
	},
	billing: {
		email: {
			type: String,
			trim: true
		},
		business: Boolean,
		details: {
			type: String,
			trim: true
		}
	},
	shipping: [{
		full_name: {
			type: String,
			trim: true
		},
		company_name: {
			type: String,
			trim: true
		},
		street_address_1: {
			type: String,
			trim: true
		},
		street_address_2: {
			type: String,
			trim: true
		},
		zip_code: {
			type: String,
			trim: true
		},
		city: {
			type: String,
			trim: true
		},
		region: {
			type: String,
			trim: true
		},
		default: Boolean,
		name: {
			type: String,
			trim: true
		},
		country: {
			code: {
				type: String,
				trim: true
			},
			name: {
				type: String,
				trim: true
			}
		},
		email: {
			type: String,
			trim: true
		},
		phone: Number
	}],
	cart: {
		products: [{ ref: 'Product', type: Schema.Types.ObjectId }],
		// expires: Date
	}
});

const User = mongoose.model('User', UserSchema);
module.exports = User;