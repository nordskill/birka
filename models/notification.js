const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
    name: String,
    slug: String,
    description: String,
    notify_customer: Boolean,
    notify_users:      [{ ref: 'User', type: Schema.Types.ObjectId }],
    email_template:     { ref: 'EmailTemplate', type: Schema.Types.ObjectId }
});

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
