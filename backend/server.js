import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import pagesRoutes from './routes/pagesRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import swaggerUI from 'swagger-ui-express';
import swaggerDocument from './config/swagger-output.json' with { type: 'json'};

// setup .env
dotenv.config();

// connessione a MongoDB
connectDB();

// percorso del progetto
const __dirname = path.resolve();

// setup Express
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/swagger', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// routes statiche
app.use(express.static(__dirname + '/frontend/public')); // cartella public (index, login, register)
app.use('/js', express.static(__dirname + '/frontend/js')); // cartella codice js frontend
app.use('/css', express.static(__dirname + '/frontend/css')); // cartella css
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist')); // bootstrap da npm

// routes
app.use('/auth', authRoutes); // register, login, logout, checkLogin
app.use('/', pagesRoutes); // pagine di home, profilo
app.use('/api', apiRoutes); // dati per profilo, ordini

// avvio server
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});