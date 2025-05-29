import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const productSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product', 
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1 
    }
}, { _id: false }); 

const cartSchema = new Schema({
    user: { 
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    products: [productSchema], 
}, {
    timestamps: true 
});

const Cart = model('Cart', cartSchema);

export default Cart;