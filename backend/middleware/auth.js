import jwt from 'jsonwebtoken';
import user from "../models/User.js";

function authMiddleware(req, res, next) {
    const token = req.cookies.token;

    if (!token) return res.redirect('/login.html');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // refresh del token
        const newToken = jwt.sign({
            userId: decoded.userId,
            type: decoded.type,
            setupComplete: decoded.setupComplete
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1 * 60 * 60 * 1000 // 1 ora
        });

        next();
    } catch (err) {
        // elimina il token dal cookie se non è valido e fa un redirect al login
        res.clearCookie('token');
        res.redirect('/login.html');
    }
}

export default authMiddleware;