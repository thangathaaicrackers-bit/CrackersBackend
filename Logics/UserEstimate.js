const express = require('express');
const UserModel = require('../models/Usermodel');

const router = express.Router();

// POST method to add a new cracker
router.post('/userestim', async (req, res) => {
    try {
        const { username, phoneNo, email, address, state, city, orderItems, overalltotal } = req.body;

        // Validate the request data
        if (!username || !phoneNo || !address || !state || !city) {
            return res.status(400).json({ message: 'Name and price are required' });
        }

        // Create a new cracker document
        const newCracker = new UserModel({
            username, phoneNo, email, address, state, city,
            orderItems, overalltotal
        });

        // Save the cracker to the database
        await newCracker.save();

        // Send a success response
        res.status(201).json(newCracker);
    } catch (error) {
        console.error('Error creating cracker:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// // GET method to fetch a specific user by ID
// router.get('/user/:id', async (req, res) => {
//     try {
//         const user = await UserModel.findById(req.params.id).populate('orderItems.productId');
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         res.status(200).json({ data: user });
//     } catch (error) {
//         console.error('Error fetching user:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });


module.exports = router;