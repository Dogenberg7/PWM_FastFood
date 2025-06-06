import express from 'express';
import path from 'path';
import authMiddleware from '../middleware/auth.js';
import setupCheckMiddleware from "../middleware/setupCheck.js";
import onlyOwners from "../middleware/onlyOwners.js";
import onlyCustomers from "../middleware/onlyCustomers.js";

const router = express.Router();
const __dirname = path.resolve();

router.get('/home', authMiddleware, setupCheckMiddleware, (req, res) => {
    // #swagger.description = 'Porta alla home, esistono due home, una per i clienti e una per i ristoratori, quella dei clienti permette di cercare piatti e ristoranti, quella dei ristoratori permette di avanzare la coda degli ordini.'
    if (req.user.type === 'customer') res.sendFile(path.join(__dirname, 'frontend/html/homeCustomer.html'));
    else res.sendFile(path.join(__dirname, 'frontend/html/homeOwner.html'));
})

router.get('/profile', authMiddleware, setupCheckMiddleware, (req, res) => {
    // #swagger.description = 'Porta alla pagina del profilo utente, qui è possibile visualizzare i propri dati, lo storico degli ordini e gestire il profilo.'
    res.sendFile(path.join(__dirname, 'frontend/html/profile.html'));
})

router.get('/finalize', authMiddleware, (req, res) => {
    // #swagger.description = 'Porta alla pagina di finalizzazione del profilo di un cliente.'
    res.sendFile(path.join(__dirname, 'frontend/html/finalize.html'));
})

router.get('/restaurant/add', authMiddleware, (req, res) => {
    // #swagger.description = 'Porta alla pagina di finalizzazione del profilo di un ristoratore.'
    res.sendFile(path.join(__dirname, 'frontend/html/addRestaurant.html'));
})

router.get('/menu/manager', authMiddleware, setupCheckMiddleware, onlyOwners, (req, res) => {
    // #swagger.description = 'Porta alla pagina di gestione del menu, qui un ristoratore può modificare i prezzi, i tempi di preparazione, creare, aggiungere e rimuovere piatti.'
    res.sendFile(path.join(__dirname, 'frontend/html/menuManager.html'));
})

router.get('/restaurant/analytics', authMiddleware, setupCheckMiddleware, onlyOwners, (req, res) => {
    // #swagger.description = 'Porta alla pagina delle statistiche, qui un ristoratore può vedere quanto ha guadagnato, quanti ordini ha avuto, quanti ha guadagnato in media per ordine e quale piatto ha venduto di più in un dato periodo.'
    res.sendFile(path.join(__dirname, 'frontend/html/analytics.html'));
})

router.get('/restaurant/:id', authMiddleware, setupCheckMiddleware, onlyCustomers, (req, res) => {
    // #swagger.description = 'Porta alla pagina di un dato ristorante, qui un cliente può visualizzarne le informazioni e ordinare dal menu.'
    //  #swagger.parameters['id'] = { description: 'ID del ristorante di cui si vuole visualizzare la pagina.' }
    res.sendFile(path.join(__dirname, 'frontend/html/restaurantPage.html'));
})

router.get('/cart', authMiddleware, setupCheckMiddleware, onlyCustomers, (req, res) => {
    // #swagger.description = 'Porta alla pagina del carrello, qui un cliente può visualizzare gli ordini nel carrello e modificarne le quantità prima di confermarli.'
    res.sendFile(path.join(__dirname, 'frontend/html/cart.html'));
})

router.get('/checkout', authMiddleware, setupCheckMiddleware, onlyCustomers, (req, res) => {
    // #swagger.description = 'Porta alla pagina del checkout, qui un cliente può vedere il costo totale del suo ordine e selezionare un metodo di pagamento prima di confermarlo (i pagamenti sono simulati).'
    res.sendFile(path.join(__dirname, 'frontend/html/checkout.html'));
})

router.get('/profile/edit', authMiddleware, setupCheckMiddleware, (req, res) => {
    // #swagger.description = 'Porta alla pagina di modifica dell\'account, qui è possibile, in base al tipo di utente, modificare dati base (username, nome, cognome, email, password), indirizzo, dati del ristorante e metodi di pagamento.'
    res.sendFile(path.join(__dirname, 'frontend/html/editProfile.html'));
})

export default router;