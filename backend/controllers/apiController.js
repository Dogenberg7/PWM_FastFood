import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import CustomerData from "../models/CustomerData.js";
import path from "path";
import jwt from "jsonwebtoken";
import Dish from "../models/Dish.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const __dirname = path.resolve();

export const getProfile = async (req, res) => {
    // #swagger.description = 'Restituisce i dati dell\'utente, comprendono i dati comuni a tutti i tipi di utente e in base alla tipologia dell\'utente i dati del cliente (indirizzo e carte) o del ristorante.'
    // #swagger.security = [{ cookieAuth: [] }]
    /* #swagger.responses[200] = {
        description: 'Profilo ricevuto con successo.',
        schema: {
            profile: { $ref: '#/definitions/User' },
            cards: {
                $ref: '#/definitions/cards',
                nullable: true
            },
            address: {
                $ref: '#/definitions/address',
                nullable: true
            },
            restaurant: {
                $ref: '#/definitions/Restaurant',
                nullable: true
            }
         }
    } */
    /* #swagger.responses[404] = {
        description: 'Utente non trovato.',
        schema: { error: 'User not found' }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error, try again later.' }
    } */
    try{
        const user = req.user;

        const profile = await User.findOne({ _id: user.userId }, 'username firstName lastName email type');
        if (!profile) return res.status(404).json({ error: 'User not found.' });

        const customerData = await CustomerData.findOne({ user: user.userId });

        const restaurant = await Restaurant.findOne({ owner: user.userId });

        res.json({ profile, cards: customerData ? customerData.cards : null, address: customerData ? customerData.address : null, restaurant: restaurant});
    } catch(err){
        res.status(500).json({ error: 'Server error, try again later.' });
    }
}

export const getOrders = async (req, res) => {
    // #swagger.description = 'Restituisce il numero totale di ordini e una pagina di 20 ordini, dal più recente, appartenenti all\'utente loggato se è un cliente o ricevuti dal ristorante dell\'utente loggato se è un proprietario. Di default restituisce la prima pagina, è possibile richiedere le successive specificando il paramentro page.'
    /* #swagger.parameters['page'] = {
        in: 'query',
        description: 'Numero della pagina',
        required: false,
        type: 'string'
    } */
    /* #swagger.responses[200] = {
        description: 'Ordini ricevuti con successo.',
        schema: {
            total: 1,
            orders: [{
                id: '682f252b2bfba60237b8df61',
                customer: {
                    id: '682f252bcbfba60201b8df61',
                    username: 'mariorossi',
                    name: 'Mario Rossi',
                },
                restaurant: {
                    id: '682f25cb2bfbaa8237b8df61',
                    name: 'Da Mario',
                    address: { $ref: '#/definitions/address' },
                    phone: '3492361283'
                },
                dish: {
                    id: '682f222b2b1ba6d237b8df61',
                    name: 'Pizza margherita',
                    category: 'Pizza',
                    image: '/images/1748440295971-pizza.png'
                },
                amount: 3,
                price: 24,
                state: 'received',
                createdAt: '2025-06-01T12:00:00Z'
            }]
        }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error, try again later.' }
    } */
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        let filter

        if (user.type === 'customer') {
            filter = { customer: user.userId };
        } else {
            const restaurant = await Restaurant.findOne({ owner: user.userId }, '_id');
            if (!restaurant) return res.json({ total: 0, orders: [] });

            filter = { restaurant: restaurant._id };
        }

        const total = await Order.countDocuments(filter);

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('restaurant')
            .populate('dish')
            .populate('customer');

        const cleanOrders = orders.map((order) => {
            return {
                id: order._id,
                customer: {
                    id: order.customer._id,
                    username: order.customer.username,
                    name: order.customer.firstName + ' ' + order.customer.lastName,
                },
                restaurant: {
                    id: order.restaurant._id,
                    name: order.restaurant.name,
                    address: order.restaurant.address,
                    phone: order.restaurant.phoneNumber
                },
                dish: {
                    id: order.dish._id,
                    name: order.dish.name,
                    category: order.dish.category,
                    image: order.dish.image
                },
                amount: order.amount,
                price: order.price,
                state: order.state,
                createdAt: order.createdAt
            }
        });

        res.json({ total, orders: cleanOrders });
    } catch(err){
        res.status(500).json({ message: 'Server error, try again later.' });
    }
}

export const finalizeSetup = async (req, res) => {
    // #swagger.description = 'Completa il profilo del cliente loggato aggiungendo un indirizzo e un metodo di pagamento.'
    /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Contiene l\'indirizzo e il primo metodo di pagamento.',
            required: true,
            schema: { $address: { $streetAddress: 'Via Mario Rossi, 1', $city: 'Milano', $province: 'MI', $zipCode: '20000' }, $card: { $cardOwner: 'Mario Rossi', $cardNumber: '1234123412341234', $expiryDate: '01/30', $cvc: '123' } }
    } */
    /* #swagger.responses[201] = {
        description: 'Account completato con successo.',
        schema: { message: 'Profile successfully finalized.' }
    } */
    /* #swagger.responses[400] = {
        description: 'Errore di nella richiesta.',
        schema: { message: 'Profile successfully finalized.' }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const user = req.user;
        const address = req.body.address;
        const card = req.body.card;

        const newCustomerData = new CustomerData({
            user: user.userId,
            address,
            cards: [{
                cardOwner: card.cardOwner,
                cardNumber: card.cardNumber,
                expiryDate: card.expiryDate,
                cvc: card.cvc
            }]
        });

        await newCustomerData.save();

        // refresh del token
        const newToken = jwt.sign({
            userId: user.userId,
            type: user.type,
            setupComplete: true
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1 * 60 * 60 * 1000 // 1 ora
        });

        res.status(201).json({ message: 'Profile successfully finalized.' });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: `User already has an address registered.` });
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

export const addCard = async (req, res) => {
    // #swagger.description = 'Aggiunge un nuovo metodo di pagamento al cliente loggato.'
    /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Contiene i dati del metodo di pagamento da aggiungere.',
            required: true,
            schema: { $card: { $cardOwner: 'Mario Rossi', $cardNumber: '1234123412341234', $expiryDate: '01/30', $cvc: '123' } }
    } */
    /* #swagger.responses[201] = {
        description: 'Carta aggiunta con successo.',
        schema: { message: 'Card successfully added.', cards: { $ref: '#/definitions/cards' } }
    } */
    /* #swagger.responses[400] = {
        description: 'Errori di validazione.',
        schema: { error: ['Error1.', 'Error2.'] }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const user = req.user;
        const card = req.body.card;
        console.log(card);

        const updated = await CustomerData.findOneAndUpdate({ user: user.userId }, {
            $push: { cards: card } },
            {
                new:true,
                runValidators: true
            }
        );

        console.log(updated);

        res.status(201).json({ message: 'Card successfully added!', cards: updated.cards });
    } catch (err) {
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

export const addRestaurant = async (req, res) => {
    // #swagger.description = 'Completa il profilo di un proprietario creando il suo ristorante.'
    /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Contiene il ristorante da creare.',
            require: true,
            schema: { $restaurant: { $owner: '682f252b2bfba60237b8df61', $name: 'Da Mario', $address: { $streetAddress: 'Via Mario Rossi, 1', $city: 'Milano', $province: 'MI', $zipCode: '20000' }, $vatNumber: '12345678901', $phoneNumber: '3490320259' } }
    } */
    /* #swagger.responses[201] = {
        description: 'Ristorante aggiunto con successo.',
        schema: { restaurant: '682f252b2bfb43023a58df13' }
    } */
    /* #swagger.responses[400] = {
        description: 'Errore di validazione.',
        schema: { error: 'message.' }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const user = req.user;
        const restaurant = req.body.restaurant;

        const newRestaurant = new Restaurant({
            owner: user.userId,
            name: restaurant.name,
            address: restaurant.address,
            vatNumber: restaurant.vatNumber,
            phoneNumber: restaurant.phoneNumber,
            menu: [],
            queue: []
        });

        await newRestaurant.save();

        // refresh del token
        const newToken = jwt.sign({
            userId: user.userId,
            type: user.type,
            setupComplete: true
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1 * 60 * 60 * 1000 // 1 ora
        });

        res.status(201).json({ restaurant: newRestaurant._id });
    } catch (err) {
        // username o email già in uso
        if (err.code === 11000) { // l'errore 11000 indica che esiste già una entry che utilizza uno dei field unique
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ error: `${
                field === 'owner' ? 'User already has a restaurant.' : (field === 'vatNumber' ? 'VAT' : 'Phone') + ' already in use.'}`
            });
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

export const getNearby = async (req, res) => {
    // #swagger.description = 'Restituisce i ristoranti vicini al cliente loggato, per semplicità un ristorante è ritenuto vicino se ha lo stesso CAP dell\'indirizzo del cliente.'
    /* #swagger.responses[200] = {
        description: 'Ristoranti vicini trovati.',
        schema: { nearbyRestaurants: {
            _id: '682f252b2bfb43023a58df13',
            name: 'Da Mario',
            address: { $ref: '#/definitions/address' },
            phoneNumber: '3458320198'
        } }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try{
        const user = req.user;

        const userAddress = await CustomerData.findOne({ user: user.userId }, 'address');
        const nearbyRestaurants = await Restaurant.find({ 'address.zipCode': userAddress.address.zipCode, active: true }, 'name phoneNumber address _id');

        res.json({ nearbyRestaurants: nearbyRestaurants });
    } catch (err){
        console.error(err);
        return res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const getMenu = async (req, res) => {
    // #swagger.description = 'Restituisce nome, menu, indirizzo, numero di telefono e stato del ristorante (aperto o chiuso permanentemente).'
    //  #swagger.parameters['id'] = { description: 'ID del ristorante.' }
    /* #swagger.responses[200] = {
        description: 'Menu trovato.',
        schema: {
            name: 'Da Mario',
            phone: '3458230985',
            address: { $ref: '#/definitions/address' },
            menu: [{
                dish: { $ref: '#/definitions/Dish' },
                price: 199,
                preparationTime: 3
            }],
            active: true
         }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const restaurant = req.params.id;

        const restaurantMenu = await Restaurant.findById(restaurant).populate('menu.dish');

        res.json({ name: restaurantMenu.name, phone: restaurantMenu.phoneNumber, address: restaurantMenu.address, menu: restaurantMenu.menu, active: restaurantMenu.active });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const getDishes = async (req, res) => {
    // #swagger.description = 'Restituisce una pagina di 20 piatti dall\'elenco comune e da quelli creati dal ristorante.'
    /* #swagger.parameters['page'] = {
        in: 'query',
        description: 'Numero della pagina',
        required: false,
        type: 'string'
    } */
    /* #swagger.parameters['query'] = {
        in: 'query',
        description: 'Termine di ricerca',
        required: false,
        type: 'string'
    } */
    /* #swagger.parameters['restaurant'] = {
        in: 'query',
        description: 'ID del ristorante',
        required: true,
        type: 'string'
    } */
    /* #swagger.responses[200] = {
        description: 'Piatti ricevuti con successo.',
        schema: {
            total: 1,
            dishes: [{ $ref: '#/definitions/Dish' }]
         }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const restaurant = req.query.restaurant;
        const query = req.query.query;
        const page = req.query.page || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        const filter = {
            $and: [
                {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { category: { $regex: query, $options: 'i' } }
                    ]
                },
                {
                    $or: [
                        { restaurant: null },
                        { restaurant: restaurant }
                    ]
                }
            ]
        };

        const total = await Dish.countDocuments(filter);

        // prendo tutti i piatti che contengono il termine di ricerca nel nome o nella categoria che sono comuni (null)
        // o del ristorante che ha effettuato la richiesta
        const dishes = await Dish.find(filter).sort({ name: 1 })
            .skip(skip)
            .limit(limit);

        res.json({ total, dishes });
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const addDish = async (req, res) => {
    // #swagger.description = 'Crea un nuovo piatto, solo il ristorante che lo ha creato può aggiungerlo al proprio menu.'
    /*
        #swagger.consumes = ['multipart/form-data']
        #swagger.parameters['name'] = {
            in: 'formData',
            type: 'string',
            required: 'true',
            description: 'Nome del piatto.',
            example: 'Pizza margherita'
    } */
    /*
        #swagger.consumes = ['multipart/form-data']
        #swagger.parameters['category'] = {
            in: 'formData',
            type: 'string',
            required: 'true',
            description: 'Categoria del piatto.',
            example: 'Pizza'
    } */
    /*
        #swagger.consumes = ['multipart/form-data']
        #swagger.parameters['ingredients'] = {
            in: 'formData',
            type: 'array',
            required: 'true',
            description: 'Ingredienti del piatto.',
            collectionFormat: 'multi',
            items: { type: 'string' },
            example: ['Tomato', 'Mozzarella', 'Flour']
    } */
    /*
        #swagger.consumes = ['multipart/form-data']
        #swagger.parameters['restaurant'] = {
            in: 'formData',
            type: 'string',
            required: 'true',
            description: 'Ristorante a cui appartiene il piatto.',
            example: '682f252b2bfba60237b8df61'
    } */
    /*
        #swagger.consumes = ['multipart/form-data']
        #swagger.parameters['image'] = {
            in: 'formData',
            type: 'file',
            required: 'true',
            description: 'Immagine del piatto.'
    } */
    /* #swagger.responses[201] = {
        description: 'Piatto creato con successo.',
        schema: { dish: { $ref: '#/definitions/Dish' } }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const { name, category, ingredients, restaurant } = req.body;
        const image = `/images/${req.file.filename}`;

        const newDish = new Dish({
            name,
            category,
            ingredients: Array.isArray(ingredients) ? ingredients : [ingredients],
            image,
            restaurant
        });

        await newDish.save();
        res.status(201).json({ dish: newDish });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const editMenu = async (req, res) => {
    // #swagger.description = 'Modifica il menu di un ristorante.'
    /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Contiene l\'ID del ristorante e il suo nuovo menu.',
            required: true,
            schema: { $restaurant: '682f252b2bfba60237b8df61', $newMenu: [{ $dish: '682f252b2bfba60237b8df61', $price: 100, $preparationTime: 10 }] }
    } */
    /* #swagger.responses[200] = {
        description: 'Menu modificato con successo.',
        schema: { message: 'Menu edited.' }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const { restaurant, newMenu } = req.body;

        await Restaurant.findByIdAndUpdate(restaurant, { menu: newMenu }, { runValidators: true });

        res.json({ message: 'Menu edited.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const getCards = async (req, res) => {
    // #swagger.description = 'Restituisce i metodi di pagamento del cliente loggato, il numero di carta viene censurato.'
    /* #swagger.responses[200] = {
        description: 'Carte ricevute con successo.',
        schema: { cards: [{
            owner: 'Mario Rossi',
            expiry: '01/30',
            number: '**** **** **** 1234'
        }] }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const user = req.user;
        const userData = await CustomerData.findOne({ user: user.userId });
        const cards = userData.cards;

        const censoredCards = cards.map((card) => {
            return {
                owner: card.cardOwner,
                expiry: card.expiryDate,
                number: '**** **** **** ' + card.cardNumber.substring(12)
            }
        });

        res.json({ cards: censoredCards });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const newOrder = async (req, res) => {
    // #swagger.description = 'Crea un nuovo ordine per il cliente loggato.'
    /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Contiene gli ordini da creare, ogni proprietà ha un nome nel formato <ID ristorante><ID piatto> e ognuna contiene i dati del rispettivo ordine (cliente, ristorante, piatto quantità, prezzo)',
            schema: {
               "682f252b2bfba60237b8df61682f552b2bfba03617b8df41": {
                    "restaurant": "682f252b2bfba60237b8df61",
                    "dish": "682f552b2bfba03617b8df41",
                    "amount": 3,
                    "price": 600
                },
                "682f220b2bfba60237b8df61682f510b2bfba03617b8df41": {
                    "restaurant": "682f220b2bfba60237b8df61",
                    "dish": "682f510b2bfba03617b8df41",
                    "amount": 2,
                    "price": 800
                }
            }
    } */
    /* #swagger.responses[201] = {
        description: 'Ordine creato con successo.',
        schema: { message: 'Order received.' }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const user = req.user;
        for (const key in req.body) {
            const order = req.body[key];
            const newOrder = new Order({
                customer: user.userId,
                restaurant: order.restaurant,
                dish: order.dish,
                amount: order.amount,
                price: order.price,
                state: 'received',
                createdAt: Date.now()
            });
            await newOrder.save();

            await Restaurant.findByIdAndUpdate(
                order.restaurant,
                {$push: { queue: newOrder._id } },
                {
                    new: true,
                    runValidators: true
                }
            );
        }

        res.status(201).json({ message: 'Order received.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const confirmPickup = async (req, res) => {
    // #swagger.description = 'Permette a un cliente di confermare il ritiro di un suo piatto in stato "ready".'
    //  #swagger.parameters['id'] = { description: 'ID dell\'ordine di cui confermare il ritiro.' }
    /* #swagger.responses[200] = {
        description: 'Ordine completato con successo.',
        schema: { message: 'Order completed.' }
    } */
    /* #swagger.responses[404] = {
        description: 'Ordine non trovato.',
        schema: { error: 'Order not found.' }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const user = req.user;
        const id = req.params.id;

        const updated = await Order.findOneAndUpdate({ _id: id, customer: user.userId, state: 'ready' }, { state: 'completed' }, { runValidators: true });

        if (updated) res.json({ message: 'Order completed.' });
        else res.status(404).json({ message: 'Order not found.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const getQueue = async (req, res) => {
    // #swagger.description = 'Restituisce la coda degli ordini del ristorante del proprietario loggato.'
    /* #swagger.responses[200] = {
        description: 'Coda degli ordini ricevuta con successo.',
        schema: {
            queue: [{
                id: '682f252b2bfba60237b8df61',
                customer: {
                    id: '682a552b2bfba10237b8df61',
                    name: 'Mario Rossi',
                    username: 'mariorossi'
                },
                dish: {
                    id: '682f252b2bfba60237b8df61',
                    name: 'Pizza margherita',
                    image: '/images/1748440295971-pizza.png',
                    prepTime: 10
                },
                amount: 2,
                price: 16,
                createdAt: '2025-06-01T12:00:00Z',
                state: 'preparing'
            }]
        }
    } */
    /* #swagger.responses[404] = {
        description: 'Ristorante non trovato.',
        schema: { error: 'Restaurant not found.' }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const user = req.user;
        const restaurant = await Restaurant.findOne({ owner: user.userId }).populate({
            path: 'queue',
            populate: [
                { path: 'dish' },
                { path: 'customer'},
                { path: 'restaurant'},
                { path: 'amount' },
                { path: 'state'}
            ]
        });
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });

        const queue = restaurant.queue;

        const cleanQueue = queue.map((order) => {
            return {
                id: order._id,
                customer: {
                    id: order.customer.id,
                    name: order.customer.firstName + ' ' + order.customer.lastName,
                    username: order.customer.username
                },
                dish: {
                    id: order.dish._id,
                    name: order.dish.name,
                    image: order.dish.image,
                    prepTime: order.restaurant.menu.find(item => item.dish == order.dish.id).preparationTime
                },
                amount: order.amount,
                price: order.price,
                createdAt: order.createdAt,
                state: order.state
            }
        })

        res.json({ queue: cleanQueue });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const advanceQueue = async (req, res) => {
    // #swagger.description = 'Avanza lo stato del primo ordine della coda del ristorante del proprietario loggato da "received" a "preparing" e da "preparing" a "ready". Aggiorna anche il timestamp dell\'ultimo ordine entrato in preaparazione.'
    /* #swagger.responses[200] = {
        description: 'Coda mandata avanti con successo.',
        schema: { message: 'Queue advanced successfully' }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const user = req.user;
        const restaurant = await Restaurant.findOne({ owner: user.userId }).populate('queue');
        const firstOrder = await Order.findOne({ _id: restaurant.queue[0] })

        if (firstOrder.state === 'received') {
            firstOrder.state = 'preparing'
            restaurant.lastPreparationStart = Date.now();
        }
        else {
            firstOrder.state = 'ready';
            restaurant.queue.shift();
        }

        await restaurant.save();
        await firstOrder.save();

        res.json({ message: 'Queue advanced successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const waitEstimation = async (req, res) => {
    // #swagger.description = 'Calcola un stima di attesa di un ordine, viene calcolata facendo la somma di tutti i tempi di attesa degli ordini in coda moltiplicati per la propria quantità fino all\'ordine desiderato, all\'ordine in preparazione viene sottratto il tempo dall\'ultimo inizio di preparazione.'
    //  #swagger.parameters['id'] = { description: 'ID dell\'ordine di cui stimare il tempo di attesa.' }
    /* #swagger.responses[200] = {
        description: 'Stima dell\'attesa effettuata con successo.',
        schema: { estimatedTime: '2025-06-01T12:00:00Z' }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const user = req.user;
        const orderId = req.params.id;

        const order = await Order.findOne({ _id: orderId, customer: user.userId }).populate();

        const restaurant = await Restaurant.findById(order.restaurant).populate('queue');

        let waitingTime = 0;
        let index = 0;

        for (let queuedOrder of restaurant.queue) {
            const menuItem = restaurant.menu.find(item => item.dish.toString() === queuedOrder.dish.toString());

            if (index === 0 && queuedOrder.state === 'preparing') {
                waitingTime += Math.max(menuItem.preparationTime * queuedOrder.amount - (((Date.now() - restaurant.lastPreparationStart) || 0) / (60 * 1000)),0);
            } else {
                waitingTime += menuItem.preparationTime * queuedOrder.amount;
            }

            if (queuedOrder._id.toString() === orderId.toString()) break;
            index++;
        }

        const estimatedDate = new Date(Date.now() + waitingTime * 60 * 1000);
        const estimatedTime = estimatedDate.getHours().toString().padStart(2,'0') + ':' + estimatedDate.getMinutes().toString().padStart(2,'0');

        res.json({ estimatedTime });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const deactivateAccount = async (req, res) => {
    // #swagger.description = 'Disattiva un account, imposta active a false e username e indirizzo email a null, se è un cliente elimina i dati aggiuntivi (indirizzo e metodi di pagamento), se è un proprietario al ristorante setta active a false, IVA e numero di telefono a null. Facendo così l\'account diventa inaccessibile, non è più possibile ordinare dall\'eventuale ristorante, è possibile creare un nuovo account che usi quei dati unici e viene mantenuto lo storico degli ordini.'
    /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Contiene la password per verificare l\'utente prima della disattivazione.',
            schema: { $password: 'Secret_123' }
    } */
    /* #swagger.responses[200] = {
        description: 'Account disattivato con successo.',
        schema: { message: 'Account deactivated.' }
    } */
    /* #swagger.responses[400] = {
        description: 'Password errata.',
        schema: { error: 'Wrong password.' }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const user = req.user;

        const password = req.body.password;

        const account = await User.findOne({ _id: user.userId });

        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) return res.status(400).json({ error: 'Wrong Password.' });

        if (user.type === 'customer') {
            await CustomerData.findOneAndDelete({ user: user.userId });
        } else {
            await Restaurant.findOneAndUpdate(
                {
                    owner: user.userId
                },
                {
                    active: false,
                    phoneNumber: null,
                    vatNumber: null
                });
        }

        await User.findOneAndUpdate({ _id: user.userId }, {
            active: false,
            username: null,
            email: null
        });

        res.clearCookie('token').json({ message: 'Account deactivated.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const removeCard = async (req, res) => {
    // #swagger.description = 'Rimuove un metodo di pagamento dal cliente loggato.'
    //  #swagger.parameters['id'] = { description: 'ID della carta da rimuovere.' }
    /* #swagger.responses[200] = {
        description: 'Carta rimossa con successo.',
        schema: { cards: { $ref: '#/definitions/cards' } }
    } */
    /* #swagger.responses[404] = {
        description: 'Cliente o carta non trovato/a.',
        schema: { error: 'message' }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const user = req.user;
        const cardId = req.params.id;

        const customerData = await CustomerData.findOne({ user: user.userId });

        if (!customerData) return res.status(404).json({ error: 'Customer not found' });

        const cardIndex = customerData.cards.findIndex(card => card._id.toString() === cardId);
        if (cardIndex === -1) return res.status(404).json({ error: 'Card not found' });

        if (customerData.cards.length <= 1) return res.status(400).json({ error: 'You must have at least one card registered' });

        const updated = await CustomerData.findOneAndUpdate({ user: user.userId },
            { $pull: {cards: { _id: cardId } } },
            {
                new: true,
                runValidators: true
            }
        );

        res.json({ cards: updated.cards });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const editProfile = async (req, res) => {
    // #swagger.description = 'Modifica le informazioni base del profilo utente (username, nome, cognome, email e password).'
    /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Contiene i nuovi dati del profilo (username, nome, cognome, email, password attuale, nuova password e conferma della nuova password), solo campi non null vengono modificati.',
            schema: { $username: 'luigiverdi', $firstName: 'Luigi', $lastName: 'Verdi', $email: 'luigi.verdi@gmail.com', $password: 'Secret_123', $newPassword: 'SuperSecret_321', $confirmPassword: 'SuperSecret_321' }
    } */
    /* #swagger.responses[200] = {
        description: 'Profilo aggiornato con successo.',
        schema: { message: 'Profile updated!' }
    } */
    /* #swagger.responses[400] = {
        description: 'Errore nella richiesta',
        schema: { error: 'Message.' }
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
        const user = req.user;
        const newProfile = req.body.newProfile;

        if (!(newProfile.password && newProfile.newPassword && newProfile.confirmPassword) && (newProfile.password || newProfile.newPassword || newProfile.confirmPassword)) {
            return res.status(400).json({ error: 'Fill all three password fields to change it.' });
        }

        const userProfile = await User.findOne({ _id: user.userId });
        if (!userProfile) return res.status(404).json({ error: 'User not found.' });

        if (newProfile.password) {
            const isMatch = await bcrypt.compare(newProfile.password, userProfile.password);
            if (!isMatch) return res.status(400).json({ error: 'Wrong current Password.' });

            if (newProfile.newPassword !== newProfile.confirmPassword) return res.status(400).json({ error: 'New password and confirm do not match.' });

            userProfile.password = newProfile.newPassword;
            userProfile.confirmPassword = newProfile.confirmPassword;
        }

        for (const [key, value] of Object.entries(newProfile)) {
            if (!(value === null || value === undefined) && (key !== 'password' && key !== 'newPassword' && key !== 'confirmPassword')) userProfile[key] = value;
        }

        await userProfile.save();

        res.json({ message: 'Profile updated!' });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: messages }); // restituisco un array di messaggi di errore di validazione
        }

        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const editAddress = async (req, res) => {
    // #swagger.description = 'Modifica l\'indirizzo del cliente loggato.'
    /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Contiene il nuovo indirizzo del cliente, solo i campi non null vengono modificati.',
            required: true,
            schema: { $address: { $streetAddress: 'Via Luigi Verdi, 1', $city: 'Sanremo', $province: 'IM', $zipCode: '18038' } }
    } */
    /* #swagger.responses[200] = {
        description: 'Indirizzo aggiornato con successo.',
        schema: { message: 'Profile updated.' }
    } */
    /* #swagger.responses[400] = {
        description: 'Errore di validazione.',
        schema: { error: 'Message.' }
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
        const user = req.user;
        const address = req.body.address;

        let updateFields = {};

        for (const [key, value] of Object.entries(address)) {
            if (!(value === null || value === undefined)) updateFields[`address.${key}`] = value;
        }

        if (Object.keys(updateFields).length === 0) return res.status(400).json({ error: 'No fields to update.' });

        const updated = await CustomerData.findOneAndUpdate(
            { user: user.userId },
            { $set: updateFields },
            {
                new: true,
                runValidators: true
            }
            );

        if (!updated) return res.status(404).json({ error: 'User not found' });

        res.json({ message: 'Address updated.' });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: messages }); // restituisco un array di messaggi di errore di validazione
        }

        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const editRestaurant = async (req, res) => {
    // #swagger.description = 'Modifica i dati del ristorante del ristoratore loggato.'
    /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Contiene i nuovi dati del ristorante, solo i campi non null vengono modificati.',
            required: true,
            schema: { $restaurant: { $owner: '682f252b2bfba05647b8df61', $name: 'Da Luigi', $address: { $streetAddress: 'Via Luigi Verdi, 1', $city: 'Sanremo', $province: 'IM', $zipCode: '18038' }, $vatNumber: '12345678100', $phoneNumber: '3490420259' } }
    } */
    /* #swagger.responses[200] = {
        description: 'Ristorante modificato con successo.',
        schema: { message: 'Restaurant updated!' }
    } */
    /* #swagger.responses[400] = {
        description: 'Errore di validazione.',
        schema: { error: 'Message.' }
    } */
    /* #swagger.responses[404] = {
        description: 'Ristorante non trovato.',
        schema: { error: 'Restaurant not found.' }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const user = req.user;
        const newRestaurant = req.body.newRestaurant;

        const restaurant = await Restaurant.findOne({ owner: user.userId });
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

        restaurant.name = newRestaurant.name || restaurant.name;
        restaurant.phoneNumber = newRestaurant.phoneNumber || restaurant.phoneNumber;
        restaurant.vatNumber = newRestaurant.vatNumber || restaurant.vatNumber;
        restaurant.address.streetAddress = newRestaurant.address.streetAddress || restaurant.address.streetAddress;
        restaurant.address.city = newRestaurant.address.city || restaurant.address.city;
        restaurant.address.province = newRestaurant.address.province || restaurant.address.province;
        restaurant.address.zipCode = newRestaurant.address.zipCode || restaurant.address.zipCode;

        restaurant.save();

        res.json({ message: 'Restaurant updated!' });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: messages }); // restituisco un array di messaggi di errore di validazione
        }

        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const getAnalytics = async (req, res) => {
    // #swagger.description = 'Restituisce le statistiche del ristorante del ristoratore loggato (guadagno totale, numero di ordine, guadagno medio per ordine, piatto più venduto, quanto ha venduto e quanto ha fatto guadagnare), filtrabili per periodo.'
    /* #swagger.parameters['start'] = {
        in: 'query',
        description: 'Timestamp data di inizio.',
        required: false,
        type: 'string'
    } */
    /* #swagger.parameters['end'] = {
        in: 'query',
        description: 'Timestamp data di fine.',
        required: false,
        type: 'string'
    } */
    /* #swagger.responses[200] = {
        description: 'Statistiche ricevute con successo.',
        schema: {
            totalOrders: 10,
            totalEarned: 10000,
            avgEarned: 1000,
            mostOrdered: { $ref: '#/definitions/Dish' }
        }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const user = req.user;
        const { start, end } = req.query;

        const restaurant = await Restaurant.findOne({ owner: user.userId });
        const restaurantId = restaurant._id.toString();

        const match = {
            restaurant: new mongoose.Types.ObjectId(restaurantId),
            state: 'completed'
        };

        const startDate = new Date(parseInt(start) || 1735732800000);
        const endDate = new Date(parseInt(end) || 4102488000000);
        match.createdAt = { $gte: startDate, $lte: endDate };

        const data = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$dish",
                    totalOrders: { $sum: 1 },
                    totalEarned: { $sum: "$price" },
                    totalAmount: { $sum: "$amount" },
                }
            },
            {
                $lookup: {
                    from: 'dishes',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'dishData'
                }
            },
            { $unwind: '$dishData' }
        ]);

        const totalOrders = data.reduce((sum, d) => sum + d.totalOrders, 0);
        const totalEarned = data.reduce((sum, d) => sum + d.totalEarned, 0);
        const avgEarned = totalOrders ? totalEarned / totalOrders : 0;
        const mostOrdered = data.sort((a, b) => b.totalAmount - a.totalAmount)[0];

        res.json({ totalOrders, totalEarned, avgEarned: Math.floor(avgEarned), mostOrdered });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const searchDishes = async (req, res) => {
    // #swagger.description = 'Restituisce l\'elenco dei piatti presenti nei menu dei ristoranti che soddisfano i termini di ricerca.'
    /* #swagger.parameters['name'] = {
        in: 'query',
        description: 'Nome del piatto.',
        required: false,
        type: 'string'
    } */
    /* #swagger.parameters['category'] = {
        in: 'query',
        description: 'Categoria del piatto.',
        required: false,
        type: 'string'
    } */
    /* #swagger.parameters['price'] = {
        in: 'query',
        description: 'Prezzo massimo',
        required: false,
        type: 'string'
    } */
    /* #swagger.parameters['page'] = {
        in: 'query',
        description: 'Numero della pagina',
        required: false,
        type: 'string'
    } */
    /* #swagger.responses[200] = {
        description: 'Piatti trovati con successo.'
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const { name = '', category = '', price, page = 1 } = req.query;
        const limit = 20;
        const skip = (page - 1) * limit;

        const dishQuery =  {};
            if (name) dishQuery.name = { $regex: name, $options: 'i' }
            if (category) dishQuery.category = { $regex: category, $options: 'i' };

        const matchingDishes = await Dish.find(dishQuery).select('_id');
        const dishIds = matchingDishes.map((dish) => dish._id);

        if (dishIds.length === 0) return res.json({ results: [], total: 0});

        const matches = {
            active: true,
            ...(dishIds.length && { 'menu.dish': { $in: dishIds } }),
            ...(price && { 'menu.price': { $lte: parseInt(price) } })
        }

        const dataPipeline = [
            { $unwind: '$menu'},
            { $match: matches },
            {
                $lookup: {
                    from: 'dishes',
                    localField: 'menu.dish',
                    foreignField: '_id',
                    as: 'dishDetails',
                }
            },
            { $unwind: '$dishDetails' },
            {
                $project: {
                    _id: 0,
                    restaurantId: '$_id',
                    restaurantName: '$name',
                    address: 1,
                    dish: '$dishDetails',
                    price: '$menu.price',
                    preparationTime: '$menu.preparationTime',
                }
            },
            { $skip: skip },
            { $limit: limit }
        ];

        const countPipeline = [
            { $unwind: '$menu' },
            { $match: matches },
            { $count: 'total'}
        ];

        const [results, countResults] = await Promise.all([
            Restaurant.aggregate(dataPipeline),
            Restaurant.aggregate(countPipeline)
        ]);

        const total = countResults[0]?.total || 0;

        res.json({ results, total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}

export const searchRestaurants = async (req, res) => {
    // #swagger.description = 'Restituisce l\'elenco dei ristoranti che soddisfano i termini di ricerca.'
    /* #swagger.parameters['name'] = {
        in: 'query',
        description: 'Nome del ristorante.',
        required: false,
        type: 'string'
    } */
    /* #swagger.parameters['street'] = {
        in: 'query',
        description: 'Via e numero civico del ristorante.',
        required: false,
        type: 'string'
    } */
    /* #swagger.parameters['city'] = {
        in: 'query',
        description: 'Città del ristorante',
        required: false,
        type: 'string'
    } */
    /* #swagger.parameters['page'] = {
        in: 'query',
        description: 'Numero della pagina',
        required: false,
        type: 'string'
    } */
    /* #swagger.responses[200] = {
        description: 'Ristoranti trovati con successo.',
        schema: { total: 1, restaurants: [{ $ref: '#/definitions/Restaurant' }] }
    } */
    /* #swagger.responses[500] = {
        description: 'Errore generico del server.',
        schema: { error: 'Server error. Try again later.' }
    } */
    try {
        const { name = '', street = '', city = '', page = 1 } = req.query;

        const filter = { active: true };
        if (name) filter.name = { $regex: name, $options: 'i' };
        if (street) filter['address.streetAddress'] = { $regex: street, $options: 'i' };
        if (city) filter['address.city'] = { $regex: city, $options: 'i' };

        const limit = 20;
        const skip = (page - 1) * limit;

        const total = await Restaurant.countDocuments(filter);

        const restaurants = await Restaurant
            .find(filter)
            .skip(skip)
            .limit(limit);

        res.json({ total, restaurants });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Try again later.' });
    }
}