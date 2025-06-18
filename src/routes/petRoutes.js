const express = require("express");

const router = express.Router();

const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");

const {
    getAllPets,
    getUserPets,
    createPet,
    deletePet,
} = require("../controllers/petController");

router.get('/all', verifyFirebaseToken, getAllPets);
router.get('/my-pets', verifyFirebaseToken, getUserPets);
router.post('/create', verifyFirebaseToken, createPet);
router.delete('/delete/:id', verifyFirebaseToken, deletePet);

module.exports = router;

