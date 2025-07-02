const express = require('express');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const { register, login, changeUserRole, getUser, updateUserVitalCoin, searchClients, getVeterinarians, getUserById } = require('../controllers/userController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/role/:id', verifyFirebaseToken, changeUserRole);
router.post('/vitalCoins/:id', verifyFirebaseToken, updateUserVitalCoin);
router.get('/getUser', getUser);
router.get('/search-clients', verifyFirebaseToken, searchClients);
router.get('/veterinarians', verifyFirebaseToken, getVeterinarians);
router.get('/:id', verifyFirebaseToken, getUserById);

module.exports = router;
