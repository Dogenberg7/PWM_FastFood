import User from '../models/User.js';
import CustomerData from '../models/CustomerData.js';
import Restaurant from '../models/Restaurant.js';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// registrazione utente
export const registerUser = async (req, res) => {
    // #swagger.description = 'Registra un nuovo utente usando i dati nel body.'
    /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Contiene username, nome, cognome, email, password, conferma della password e tipo di utente.',
            required: true,
            schema: { $username: 'mariorossi', $firstName: 'Mario', $lastName: 'Rossi', $email: 'mario.rossi@gmail.com', $password: 'Secret_123', $confirmPassword: 'Secret_123', $type: 'customer' }
    } */
    /* #swagger.responses[201] = {
        description: 'Utente registrato con successo.',
        schema: { message: 'User successfully registered.' }
    } */
    /* #swagger.responses[400] = {
        description: 'Errore di validazione.',
        schema: { error: 'error message' }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const { username, firstName, lastName, email, password, confirmPassword, type } = req.body;
        const newUser = new User({
            username,
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            type
        });

        await newUser.save();

        res.status(201).json({ message: 'User successfully registered!' });
    } catch (err) {
        // username o email già in uso
        if (err.code === 11000) { // l'errore 11000 indica che esiste già una entry che utilizza uno dei field unique
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ error: `${field === 'username' ? 'Username' : 'Email'} already in use.` });
        }

        // errori di validazione
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: messages }); // restituisco un array di messaggi di errore di validazione
        }

        // errore generico del server
        console.error(err);
        return res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const loginUser = async (req, res) => {
    // #swagger.description = 'Esegue il login utilizzando il nome utente e la password indicati nel body, genera un token che viene salvato nei cookies.'
    /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Contiene username e password.',
            required: true,
            schema: { $username: 'mariorossi', $password: 'Secret_123' }
    } */
    /* #swagger.responses[200] = {
        description: 'Login effettuato con successo.',
        schema: {
            message: 'User logged in successfully.',
            username: 'mariorossi',
            extraData: '682f252b2bfb43023a58df13'
         }
    } */
    /* #swagger.responses[400] = {
        description: 'Password errata.',
        schema: { error: 'Wrong Password.' }
    } */
    /* #swagger.responses[404] = {
        description: 'Utente non trovato.',
        schema: { error: 'User not found.' }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username }, '_id username type password');
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Wrong Password.' });

        const customerData = await CustomerData.findOne({user: user._id});
        const restaurant = await Restaurant.findOne({ owner: user._id });

        // controlla se l'account è completo, per un cliente vuol dire avere almeno un indirizzo e una carta, per un ristoratore vuol dire avere un ristorante
        const setupComplete = (user.type === 'customer') ? !!(customerData) : !!(restaurant);

        // creazione token di accesso (durata 1 ora)
        const token = jwt.sign({
            userId: user._id,
            type: user.type,
            setupComplete
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1 * 60 * 60 * 1000 // 1 ora
        });

        res.json({
            message: 'User logged in successfully.',
            username: user.username,
            extraData: customerData?._id || restaurant?._id
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const logoutUser = async (req, res) => {
    // #swagger.description = 'Esegue il logout dell\'utente eliminando il token dai cookies.'
    /* #swagger.responses[200] = {
        description: 'Logout effettuato con successo.',
        schema: { message: 'User logged out successfully.' }
    } */
    res.clearCookie('token');
    res.status(200).json({ message: 'User logged out successfully.' });
}

export const checkLogin = async (req, res) => {
    // #swagger.description = 'Controlla se l\'utente è già loggato verificando la presenza di un token.'
    /* #swagger.responses[200] = {
        description: 'Utente verificato con successo.',
        schema: { ok: true }
    } */
    if (!req.cookies.token) return res.status(200).json({ ok: false });
    else return res.status(200).json({ ok: true });
}