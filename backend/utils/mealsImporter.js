import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Dish from "../models/Dish.js";
import connectDB from '../config/db.js';

dotenv.config();

// importa i piatti contenuti in meals.json nel DB, ignora quelli già presenti
async function importMeals() {
    try {
        await connectDB();

        const __dirname = path.resolve();
        const filePath = path.join(__dirname, 'backend/meals.json');
        const data = fs.readFileSync(filePath, 'utf8');
        const meals = JSON.parse(data);

        const dishes = meals.map(meal => ({
            _id: meal._id?.$oid || undefined,
            name: meal.strMeal,
            category: meal.strCategory,
            image: meal.strMealThumb,
            ingredients: meal.ingredients,
            restaurant: null
        }));

        const inserted = await Dish.insertMany(dishes, { ordered: false });
        console.log(`Imported ${inserted.length} dishes.`);
        process.exit(0);
    } catch (err) {
        console.error('Error importing dishes: ', err.message);
        process.exit(1);
    }
}

importMeals();