const mongoose = require('mongoose');
const { Schema } = mongoose;

const TagSchema = new Schema([{
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true
    },
    used: {
        type: Number,
        default: 0
    }
}]);

const Tag = mongoose.model('Tag', TagSchema);

module.exports = Tag;
