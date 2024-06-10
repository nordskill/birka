const mongoose = require('mongoose');
const { Schema } = mongoose;

const MemberSchema = new Schema({
	username: {
		type: String,
		unique: true,
		trim: true
	},
	password: String,
	email: {
		type: String,
		unique: true,
		trim: true
	},
	role: {
		type: String,
		required: true,
		default: 'Editor',
		trim: true
	},
	email_notifications: Boolean,
	web_notifications: Boolean
}, { timestamps: true });

const Member = mongoose.model('Member', MemberSchema);
module.exports = Member;