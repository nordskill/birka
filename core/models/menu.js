import mongoose from 'mongoose';
const { Schema } = mongoose;


const MenuItemSchema = new Schema({
    name:           { type: String, trim: true },
    title:          { type: String, trim: true },
    url:            { type: String, trim: true },
    target:         { type: String, enum: ['_self', '_blank'], default: '_self' },
    image:          { ref: 'File', type: mongoose.Schema.Types.ObjectId },
    entity_type:    { type: String, trim: true },
    entity_id:      { type: Schema.Types.ObjectId },
    order:          { type: Number, default: 0 }
});

const MenuSchema = new Schema({
    name: { type: String, required: true, trim: true, unique: true },
    items: [MenuItemSchema],
    custom: [Schema.Types.Mixed]
}, {
    timestamps: true
});

const Menu = mongoose.model('Menu', MenuSchema);

export default Menu;
