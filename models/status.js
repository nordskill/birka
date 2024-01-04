const mongoose = require('mongoose');
const { Schema } = mongoose;

const StatusSchema = new Schema({
    name: String,
    slug: String,
    description: String,
    sorting_order: Number,
    color: String,
    notifications: [{ ref: 'Notification', type: Schema.Types.ObjectId }],
    // functions:      { ref: 'Module', type: Schema.Types.ObjectId } // TBD...
});

const Status = mongoose.model('Status', StatusSchema);

module.exports = Status;
