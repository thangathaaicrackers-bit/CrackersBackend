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
    const { name, price, category } = req.body;
    const file = req.file;

    // Validate the request data
    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    // Create a new cracker document
    const newCracker = new Cracker({
      name,
      price,
      category,
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


module.exports = router;