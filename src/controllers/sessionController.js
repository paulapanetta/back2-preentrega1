import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const registerUser = async (req, res) => {
    try {
        const { first_name, last_name, email, password, age } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ status: 'error', message: 'User already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = new User({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            age
        });

        await newUser.save();
        res.status(201).json({ status: 'success', message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ status: 'error', message: 'Invalid email or password' });
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: 'error', message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ status: 'success', token });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        res.json({ status: 'success', payload: user });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};