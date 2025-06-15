const express = require('express');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const { register, login, changeUserRole, getUser } = require('../controllers/userController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/role/:id', verifyFirebaseToken, changeUserRole);
router.get('/getUser', getUser);

module.exports = router;
