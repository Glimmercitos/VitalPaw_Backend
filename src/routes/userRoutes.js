const express = require('express');
const { register, login, updateUserRole, getUser } = require('../controllers/userController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/role', updateUserRole);            
router.get('/getUser', getUser);

module.exports = router;
