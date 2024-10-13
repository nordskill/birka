import mongoose from 'mongoose';
const { Schema } = mongoose;


const OrderSchema = new Schema({
    status:             { ref: 'Status', type: Schema.Types.ObjectId },
    customer:           { ref: 'User', type: Schema.Types.ObjectId },
    shipping_details:   { ref: 'UserShipping', type: Schema.Types.ObjectId },
    billing_details:    { ref: 'UserBilling', type: Schema.Types.ObjectId },
    products:          [{ ref: 'Product', type: Schema.Types.ObjectId }],
    payment_method:     { ref: 'PaymentMethod', type: Schema.Types.ObjectId },
    shipping_method:    { ref: 'ShippingMethod', type: Schema.Types.ObjectId },
    subscription: {
        frequency: Number,
        start_date: Date,
        end_date: Date,
        duration: Number,
        enabled: Boolean
    },
    transactions: [{
        payment_method: { ref: 'PaymentMethod', type: Schema.Types.ObjectId },
        date: Date,
        ip: {
            type: String,
            trim: true
        },
        invoice: {
            type: String,
            trim: true
        },
        invoice_number: {
            type: String,
            trim: true
        }
    }],
    subtotal: Number,
    shipping_cost: Number,
    tax: Number,
    total_cost: Number,
    currency: {
        type: String,
        trim: true
    },
    coupons: [{ // TBD as separate model
        discount: Number,
        code: {
            type: String,
            trim: true
        },
        name: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        }
    }],
    status_history: [{
        previous_status: {
            type: String,
            trim: true
        },
        new_status: {
            type: String,
            trim: true
        },
        date: Date,
        user: { ref: 'User', type: Schema.Types.ObjectId }
    }],
    note: {
        type: String,
        trim: true
    },
    custom: [Schema.Types.Mixed]
}, { timestamps: true });

const Order = mongoose.model('Order', OrderSchema);

export default Order;
