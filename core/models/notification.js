import mongoose from 'mongoose';
const { Schema } = mongoose;


const NotificationSchema = new Schema({
    name: {
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
    notify_customer: Boolean,
    notify_users:   [{ ref: 'User', type: Schema.Types.ObjectId }],
    notify_team:    [{ ref: 'Member', type: Schema.Types.ObjectId }],
    email_template:  { ref: 'EmailTemplate', type: Schema.Types.ObjectId },
    custom:         [Schema.Types.Mixed]
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
