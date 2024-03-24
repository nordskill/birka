const mongoose = require('mongoose');
const { Schema } = mongoose;

const MenuItemSchema = new Schema({
    name:       { type: String, required: true, trim: true },
    title:      { type: String, trim: true },
    url:        { type: String, trim: true },
    target:     { type: String, enum: ['_self', '_blank'], default: '_self' },
    entityType: { type: String, trim: true },
    entityId:   { type: Schema.Types.ObjectId },
    order:      { type: Number, default: 0 }
}, {
    _id: false
});

const MenuSchema = new Schema({
    name: { type: String, required: true, trim: true, unique: true },
    items: [MenuItemSchema]
}, {
    timestamps: true
});

const Menu = mongoose.model('Menu', MenuSchema);

module.exports = Menu;
