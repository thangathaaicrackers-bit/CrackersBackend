const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const Cracker = require('../models/Crackersmodel');

const router = express.Router();

// Setup S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST method to add a new cracker and upload an image
router.post('/crackers', upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, discount } = req.body;
    const file = req.file;

    // Validate the request data
    if (!name || !price || !category || !discount) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    // Create a new cracker document
    const newCracker = new Cracker({
      name,
      price,
      category,
      discount,
    });

    // If an image is provided, upload it to S3
    if (file) {
      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read', // Uncomment if you want the image to be publicly accessible
      };

      const s3Response = await s3.upload(s3Params).promise();
      newCracker.imageUrl = s3Response.Location;
    }

    // Save the cracker to the database
    await newCracker.save();

    // Send a success response
    res.status(201).json(newCracker);
  } catch (error) {
    console.error('Error creating cracker:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET method to fetch all crackers
router.get('/getcrackers', async (req, res) => {
  try {
    const crackers = await Cracker.find();
    res.status(200).json({ data: crackers });
  } catch (error) {
    console.error('Error fetching crackers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT method to update an existing cracker item
router.put('/crackers/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, discount } = req.body;
    const file = req.file;

    const cracker = await Cracker.findById(id);

    if (!cracker) {
      return res.status(404).json({ message: 'Cracker not found' });
    }

    if (name) cracker.name = name;
    if (price) cracker.price = price;
    if (category) cracker.category = category;
    if (discount) cracker.discount = discount;

    if (file) {
      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const s3Response = await s3.upload(s3Params).promise();
      cracker.imageUrl = s3Response.Location;
    }

    await cracker.save();

    res.status(200).json(cracker);
  } catch (error) {
    console.error('Error updating cracker:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/crackers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the cracker exists
        const cracker = await Cracker.findById(id);
        if (!cracker) {
            return res.status(404).json({ message: 'Cracker not found' });
        }

        // Remove the cracker
        await Cracker.findByIdAndDelete(id);

        // Send success response
        res.status(200).json({ message: 'Cracker deleted successfully' });
    } catch (error) {
        console.error('Error deleting cracker:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;