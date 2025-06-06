import express from 'express';
import authMiddleware from '../middleware/auth.js';
import onlyCustomers from "../middleware/onlyCustomers.js";
import onlyOwners from "../middleware/onlyOwners.js";
import imgUpload from "../middleware/imgUpload.js";
import {
    getProfile, getOrders, finalizeSetup,
    addCard, addRestaurant, getNearby,
    getMenu, getDishes, addDish,
    editMenu, getCards, newOrder,
    confirmPickup, getQueue, advanceQueue,
    waitEstimation, deactivateAccount, removeCard,
    editAddress, editProfile, editRestaurant,
    getAnalytics, searchDishes, searchRestaurants
} from '../controllers/apiController.js';

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);
router.get('/orders', authMiddleware, getOrders);
router.get('/nearby', authMiddleware, onlyCustomers, getNearby);
router.get('/menu/:id', authMiddleware, getMenu);
router.get('/dishes', authMiddleware, onlyOwners, getDishes );
router.get('/cards', authMiddleware, onlyCustomers, getCards);
router.get('/queue', authMiddleware, onlyOwners, getQueue);
router.get('/estimate/:id', authMiddleware, waitEstimation);
router.get('/restaurant/analytics', authMiddleware, onlyOwners, getAnalytics);
router.get('/dishes/search', authMiddleware, onlyCustomers, searchDishes);
router.get('/restaurant/search', authMiddleware, onlyCustomers, searchRestaurants)

router.post('/finalize', authMiddleware, finalizeSetup);
router.post('/card/add', authMiddleware, onlyCustomers, addCard);
router.post('/restaurant/add', authMiddleware, onlyOwners, addRestaurant);
router.post('/dish/add', authMiddleware, onlyOwners, imgUpload.single('image'), addDish);
router.post('/order', authMiddleware, onlyCustomers, newOrder);

router.put('/confirmpickup/:id', authMiddleware, onlyCustomers, confirmPickup);
router.put('/order/update', authMiddleware, onlyOwners, advanceQueue);
router.put('/menu/update', authMiddleware, onlyOwners, editMenu);
router.put('/address/update', authMiddleware, onlyCustomers, editAddress);
router.put('/profile/update', authMiddleware, editProfile);
router.put('/restaurant/update', authMiddleware, editRestaurant)

router.delete('/deactivate', authMiddleware, deactivateAccount);
router.delete('/card/delete/:id', authMiddleware, onlyCustomers, removeCard);

export default router;