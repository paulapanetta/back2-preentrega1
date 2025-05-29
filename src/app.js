import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import flash from 'connect-flash';
import { engine } from 'express-handlebars';
import User from './models/user.js'; 
import Cart from './models/cart.js'; 

import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

import { MONGO_URI, PORT } from './config/config.js';
import './config/passportConfig.js';
import { isAdmin, isUser } from './middleware/authMiddleware.js'; 

dotenv.config();

const app = express();

app.engine('handlebars', engine({
    extname: '.handlebars',
    defaultLayout: 'main',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
}));
app.set('view engine', 'handlebars');
app.set('views', './src/views');  

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' ? true : false } 
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

app.use(flash());

app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});


app.get('/', async (req, res) => {
    let cart = null;
    if (req.user) {
        
        cart = await Cart.findOne({ user: req.user._id }).populate('products.product');
    }
    res.render('home', { user: req.user, cart }); 
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/register', async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'El usuario ya existe');
            return res.redirect('/register');
        }

        const newUser = new User({
            first_name,
            last_name,
            email,
            password 
        });

        await newUser.save();
        req.flash('success', 'Usuario registrado con éxito');
        res.redirect('/login');
    } catch (error) {
        console.error('Error al registrar el nuevo usuario:', error);
        req.flash('error', 'Error interno del servidor');
        res.redirect('/register');
    }
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true 
}));

app.use('/api/users', userRoutes);
app.use('/api/products', isAdmin, productRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/sessions', sessionRoutes);

const connectToDB = async () => {
    try {
        await mongoose.connect(MONGO_URI,);
        console.log('Conectado a MongoDB');
    } catch (err) {
        console.error('Error al conectar a MongoDB', err);
    }
};

connectToDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor ejecutándose en el puerto ${PORT}`);
    });
});