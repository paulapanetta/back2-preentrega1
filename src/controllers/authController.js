import User from '../models/User';
import passport from 'passport';

export const registerUser = async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El correo electrónico ya está en uso' });
        }

        const newUser = new User({ first_name, last_name, email, password });
        await newUser.save();
        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
};

export const loginUser = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info.message });

        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.status(200).json({ message: 'Inicio de sesión exitoso', user });
        });
    })(req, res, next);
};

export const logoutUser = (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error al cerrar sesión' });
        }
        res.status(200).json({ message: 'Cierre de sesión exitoso' });
    });
};
