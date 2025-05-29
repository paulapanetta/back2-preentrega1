import { Router } from 'express';
import Cart from '../models/cart.js';
import Product from '../models/Product.js';
import Ticket from '../models/Ticket.js';
import User from '../models/user.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ message: 'No estás autorizado' });
};

router.post('/', isAuthenticated, async (req, res) => {
    const userId = req.user._id;

    try {
        const newCart = new Cart({ user: userId, products: [] });
        await newCart.save();
        res.status(201).json({ message: 'Carrito creado', cartId: newCart._id });
    } catch (error) {
        console.error('Error al crear el carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/:cid/products', isAuthenticated, async (req, res) => {
    const cartId = req.params.cid;
    const { productId, quantity } = req.body;

    try {
        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        const existingProductIndex = cart.products.findIndex(item => item.product.equals(productId));
        if (existingProductIndex !== -1) {
            cart.products[existingProductIndex].quantity += quantity;
        } else {
            cart.products.push({ product: productId, quantity });
        }

        await cart.save();
        res.status(200).json({ message: 'Producto agregado al carrito', cart });
    } catch (error) {
        console.error('Error al agregar el producto al carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/:cid/purchase', isAuthenticated, async (req, res) => {
    const cartId = req.params.cid;

    try {
        const cart = await Cart.findById(cartId).populate('products.product');
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }

        const products = cart.products;
        const productosNoDisponibles = [];

        for (const item of products) {
            const product = await Product.findById(item.product);

            if (product) {
                console.log(`Producto: ${product.name}, Stock: ${product.stock}, Cantidad: ${item.quantity}`);

                if (product.stock >= item.quantity) {
                    product.stock -= item.quantity;
                    await product.save();
                } else {
                    productosNoDisponibles.push(item.product);
                }
            } else {
                console.log(`Producto con ID ${item.product} no encontrado.`);
                productosNoDisponibles.push(item.product);
            }
        }

        const userWithCart = await User.findById(cart.user);
        if (!userWithCart) {
            return res.status(404).json({ message: 'Usuario no encontrado para este carrito' });
        }

        const ticketAmount = await Promise.all(products.map(async item => {
            const product = await Product.findById(item.product);
            return product && !productosNoDisponibles.includes(item.product)
                ? item.quantity * product.price
                : 0;
        }));

        const totalAmount = ticketAmount.reduce((total, amount) => total + amount, 0);

        const ticket = new Ticket({
            code: uuidv4(), // 
            purchase_datetime: new Date(),
            amount: totalAmount,
            purchaser: userWithCart._id
        });
        await ticket.save();

        cart.products = cart.products.filter(item =>
            !productosNoDisponibles.some(productId => productId.equals(item.product))
        );

        await cart.save();

        res.status(200).json({
            message: 'Compra realizada con éxito',
            productosNoDisponibles,
            ticket
        });
    } catch (error) {
        console.error('Error al procesar la compra:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/:cid', isAuthenticated, async (req, res) => {
    const cartId = req.params.cid;

    try {
        const cart = await Cart.findById(cartId).populate('products.product');
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }
        res.status(200).json(cart);
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;