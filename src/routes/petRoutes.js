const express = require("express");

const router = express.Router();

const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const upload = require("../middlewares/uploadImage");

const {
    getAllPets,
    getUserPets,
    createPet,
    deletePet,
    deleteUserPet
} = require("../controllers/petController");

router.get('/my-pets', verifyFirebaseToken, getUserPets);
router.delete('/delete/user/:id', verifyFirebaseToken, deleteUserPet);

router.post('/create', verifyFirebaseToken, upload.single("image"), createPet);

router.delete('/delete/:id', verifyFirebaseToken, deletePet);
router.get('/all', verifyFirebaseToken, getAllPets);


module.exports = router;

