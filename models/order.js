const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderSchema = new Schema({
    date_created:       { type: Date, required: true, default: Date.now },
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
        ip: String,
        invoice: String,
        invoice_number: String
    }],
    subtotal: Number,
    shipping_cost: Number,
    tax: Number,
    total_cost: Number,
    currency: String,
    coupons: [{ // TBD as separate model
        discount: Number,
        code: String,
        name: String,
        description: String
    }],
    status_history: [{
        previous_status: String,
        new_status: String,
        date: Date,
        user: { ref: 'User', type: Schema.Types.ObjectId }
    }],
    note: String
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
