import dotenv from 'dotenv';
dotenv.config();

const {
    MONGO_URI,    
    JWT_SECRET,   
    PORT = 3000   
} = process.env;

if (!MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
}

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
}

export {
    MONGO_URI,
    JWT_SECRET,
    PORT
};