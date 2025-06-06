import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    dish: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dish',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [1, 'At least one dish must be ordered.']
    },
    price: {
        type: Number,
        required: true
    },
    state: {
        type: String,
        enum: ['received', 'preparing', 'ready', 'completed'],
        default: 'received'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Order = mongoose.model('Order', OrderSchema);
export default Order;