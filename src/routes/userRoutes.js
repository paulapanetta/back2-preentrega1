import express from 'express';
import User from '../models/User';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        const newUser = new User({
            first_name,
            last_name,
            email,
            password, 
        });

        await newUser.save();
        res.status(201).send('User registered successfully');
    } catch (error) {
        console.error('Error registering new user:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;