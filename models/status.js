const mongoose = require('mongoose');
const { Schema } = mongoose;

const StatusSchema = new Schema({
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
    sorting_order: Number,
    color: {
        type: String,
        trim: true
    },
    notifications: [{ ref: 'Notification', type: Schema.Types.ObjectId }],
    // functions:      { ref: 'Module', type: Schema.Types.ObjectId } // TBD...
});

const Status = mongoose.model('Status', StatusSchema);

module.exports = Status;
