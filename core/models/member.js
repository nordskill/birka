const mongoose = require('mongoose');
const { Schema } = mongoose;

const MemberSchema = new Schema({
	username: {
		type: String,
		unique: true,
		trim: true,
		required: true
	},
	password: {
		type: String,
		trim: true,
		required: true
	},
	email: {
		type: String,
		trim: true
	},
	permissions: {
		type: [String],
		default: []
	},
	email_notifications: Boolean,
	web_notifications: Boolean
}, { timestamps: true });

const Member = mongoose.model('Member', MemberSchema);
module.exports = Member;