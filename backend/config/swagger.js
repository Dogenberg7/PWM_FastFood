import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        title: 'PWM FastFood API',
        description: 'Swagger delle API per il progetto PWM FastFood'
    },
    host: 'localhost:5000',
    schemes: ['http'],
    components: {
        securitySchemes: {
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'token',
                description: 'Token JWT salvato in cookie HttpOnly',
            },
        },
    },
    security: [
        {
            cookieAuth: [],
        },
    ],
    definitions: {
        User: {
            _id: '682f252b2bfba60237b8df61',
            username: 'mariorossi',
            firstName: 'Mario',
            lastName: 'Rossi',
            email: 'mario.rossi@gmail.com',
            password: '$2b$10$tDNuGxt6w3vT0VKqhb5.wuXWvR5gE2HFQQhkcRlMMJJdmGN2mwL1q',
            type: 'customer',
            active: true
        },
        Dish: {
            _id: '682f252b2bfba60237b8df61',
            name: 'Pizza margherita',
            category: 'Pizza',
            ingredients: ['Tomato', 'Mozzarella', 'Flour'],
            image: '/images/1748440295971-pizza.png',
            restaurant: '682f252b2bfba64617baaf61'
        },
        Order: {
            _id: '682f252b2bfba60237b8df61',
            customer: '682f252b2bfba6abcdb8df61',
            restaurant: '682fa4b22bfba60237b8dfc3',
            dish: '682f252b2bfb43023a58df13',
            price: 297,
            amount: 3,
            createdAt: '2025-06-01T12:00:00Z'
        },
        Restaurant: {
            _id: '682f252b2bfba60237b8df61',
            owner: '682f25215bf4a60537b8df61',
            phoneNumber: '3450124321',
            vatNumber: '12345678901',
            address: {
                streetAddress: 'Via Mario Rossi, 1',
                city: 'Milano',
                province: 'MI',
                zipCode: '20075'
            },
            menu: [
                {
                    dish: '682f252b2bfba60237b8df61',
                    price: 99,
                    preparationTime: 3
                },
                {
                    dish: '682f256c2bfba64237b8df61',
                    price: 1290,
                    preparationTime: 10
                }
            ],
            lastPreparationStart: '2025-06-01T12:00:00Z',
            active: true
        },
        CustomerData: {
            _id: '682f252b2bfba60237b8df61',
            user: '682f25215bf4a60537b8df61',
            address: {
                streetAddress: 'Via Mario Rossi, 1',
                city: 'Milano',
                province: 'MI',
                zipCode: '20075'
            },
            cards: [
                {
                    cardOwner: 'Mario Rossi',
                    cardNumber: '1234123412341234',
                    expiryDate: '01/30',
                    cvc: '123'
                },
                {
                    cardOwner: 'Luigi Verdi',
                    cardNumber: '4321432143214321',
                    expiryDate: '12/29',
                    cvc: '241'
                }
            ]
        },
        address: {
            streetAddress: 'Via Mario Rossi, 1',
            city: 'Milano',
            province: 'MI',
            zipCode: '20075'
        },
        cards: [
            {
                cardOwner: 'Mario Rossi',
                cardNumber: '1234123412341234',
                expiryDate: '01/30',
                cvc: '123'
            },
            {
                cardOwner: 'Luigi Verdi',
                cardNumber: '4321432143214321',
                expiryDate: '12/29',
                cvc: '241'
            }
        ],
        menu: [
            {
                dish: '682f252b2bfba60237b8df61',
                price: 99,
                preparationTime: 3
            },
            {
                dish: '682f256c2bfba64237b8df61',
                price: 1290,
                preparationTime: 10
            }
        ]
    }
};

const outputFile = './swagger-output.json';
const inputFile = ['../server.js'];

swaggerAutogen()(outputFile, inputFile, doc);