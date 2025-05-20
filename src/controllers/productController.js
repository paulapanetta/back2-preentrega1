import Product from '../models/Product.js';
import { ObjectId } from 'mongoose';

export const getProducts = async (req, res) => {
    try {
        const { limit = 10, page = 1, sort = '', query = '' } = req.query;

        const filter = query ? { $or: [{ category: query }, { available: query }] } : {};
        const options = {
            sort: sort ? { price: sort === 'asc' ? 1 : -1 } : {},
            limit: parseInt(limit),
            skip: (parseInt(page) - 1) * parseInt(limit)
        };

        const products = await Product.find(filter).sort(options.sort).limit(options.limit).skip(options.skip);
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / parseInt(limit));
        const hasPrevPage = page > 1;
        const hasNextPage = page < totalPages;

        res.json({
            status: 'success',
            payload: products,
            totalPages,
            prevPage: hasPrevPage ? page - 1 : null,
            nextPage: hasNextPage ? page + 1 : null,
            page: parseInt(page),
            hasPrevPage,
            hasNextPage,
            prevLink: hasPrevPage ? `/api/products?limit=${limit}&page=${page - 1}&sort=${sort}&query=${query}` : null,
            nextLink: hasNextPage ? `/api/products?limit=${limit}&page=${page + 1}&sort=${sort}&query=${query}` : null
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        }

        res.json({ status: 'success', payload: product });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, price, category, available } = req.body;

        const newProduct = new Product({
            name,
            price,
            category,
            available
        });

        const savedProduct = await newProduct.save();
        res.status(201).json({ status: 'success', payload: savedProduct });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, category, available } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, { name, price, category, available }, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        }

        res.json({ status: 'success', payload: updatedProduct });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ status: 'error', message: 'Invalid product ID' });
        }

        const deletedProduct = await Product.findByIdAndDelete(id);
        if (!deletedProduct) {
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        }

        res.json({ status: 'success', message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};