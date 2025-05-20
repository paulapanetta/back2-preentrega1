import { Router } from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Ticket from '../models/Ticket.js';
import { v4 as uuidv4 } from 'uuid'; 

const router = Router(); 

export const purchaseCart = async (req, res) => {
    const { userId } = req.params; 
    try {
        const cart = await Cart.findOne({ user: userId }).populate('products.product');
        
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }

        let totalAmount = 0;
        const productsUnavailable = [];

        for (let item of cart.products) {
            const product = item.product;

            if (product.stock >= item.quantity) {
                totalAmount += product.price * item.quantity;
                product.stock -= item.quantity; 
                await product.save(); 
            } else {
                productsUnavailable.push(product._id);
            }
        }

        cart.products = cart.products.filter(item => !productsUnavailable.includes(item.product._id));
        await cart.save();

        if (totalAmount > 0) {
            const ticket = new Ticket({
                code: uuidv4(),
                purchase_datetime: new Date(),
                amount: totalAmount,
                purchaser: req.user.email 
            });
            await ticket.save();

            return res.status(200).json({
                message: 'Compra realizada con éxito',
                ticket,
                productsUnavailable
            });
        } else {
            return res.status(400).json({ message: 'No hay productos disponibles para completar la compra' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al procesar la compra' });
    }
};

router.post('/:userId/purchase', purchaseCart); 

export default router; 