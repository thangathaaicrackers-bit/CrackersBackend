const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./Config/db');
const crackerRoutes = require('./Logics/Crackers');
const userRoutes = require('./Logics/UserEstimate');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // Password hashing
const jwt = require('jsonwebtoken'); // Token generation

const app = express();

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowlist = [
    'http://localhost:5173',
    '*'
];

const corsOptionsDelegate = (req, callback) => {
    let corsOptions = {
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    };
    if (allowlist.includes(req.header('Origin'))) {
        corsOptions.origin = true;
    } else {
        corsOptions.origin = false;
    }

    callback(null, corsOptions);
};

app.use(cors(corsOptionsDelegate));

app.use('/api', crackerRoutes);
app.use('/api', userRoutes);

const PORT = process.env.PORT || 5000;

// Mock user data (in a real-world app, this would come from your database)
const users = [
    {
        id: 1,
        username: 'admin',
        email:'thangathaaicrackers@gmail.com',
        password: bcrypt.hashSync('crackers2024', 10), // password is hashed
    }
];

// JWT Authentication Middleware
// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];

//     if (token == null) return res.sendStatus(401); // If no token, return Unauthorized

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) return res.sendStatus(403); // If token invalid, return Forbidden
//         req.user = user;
//         next();
//     });
// };

// Login Route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // Check if user exists
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    // Check if the password is correct
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token
    const accessToken = jwt.sign({ username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ accessToken });
});

app.post('/send-estimate', async (req, res) => {
    console.log('Headers:', req.headers);  // Add this to debug
    console.log('Body:', req.body)  
    const { orderData } = req.body;

    const doc = new PDFDocument({ margin: 50 });
    let pdfBuffer = [];

    doc.on('data', pdfBuffer.push.bind(pdfBuffer));
    doc.on('end', () => {
        const pdfData = Buffer.concat(pdfBuffer);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'thangathaaisender@gmail.com',
                pass: 'izvq fvhc cdyj feck',
            },
        });

        const mailOptions = {
            from: 'thangathaaisender@gmail.com', 
            to: 'thangathaaicrackers@gmail.com', 
            cc: orderData.email,
            subject: `Order Estimate - ${orderData.username}`,
            text: 'Please find attached the order estimate.',
            attachments: [
                {
                    filename: 'Estimate.pdf',
                    content: pdfData,
                    contentType: 'application/pdf',
                },
            ],
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).send(error.toString());
            }
            res.status(200).send('Estimate sent successfully');
        });
    });

    doc.fontSize(18).text(`Order Estimate of ${orderData.username}`, { align: 'center' });
    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString('en-GB')}`, { align: 'right' });

    doc.moveDown().fontSize(14).text('Customer Details', { underline: true });
    doc.fontSize(12).text(`Name: ${orderData.username}`);
    doc.text(`Phone: ${orderData.phoneNo}`);
    doc.text(`Email: ${orderData.email}`);
    doc.text(`Address: ${orderData.address}, ${orderData.city}, ${orderData.state}`);

    function drawTableHeaders(doc) {
        doc.moveDown(1.5);

        const tableTop = doc.y + 10;
        const itemNumberX = 50;
        const itemNameX = 100;
        const itemQuantityX = 300;
        const itemPriceX = 370;
        const itemTotalX = 450;

        doc.fontSize(12);
        doc.text('S.NO', itemNumberX, tableTop, { bold: true });
        doc.text('Product Name', itemNameX, tableTop, { bold: true });
        doc.text('Quantity', itemQuantityX, tableTop, { bold: true });
        doc.text('Rate per 1 box', itemPriceX, tableTop, { bold: true });
        doc.text('Total Discounted Amount', itemTotalX, tableTop, { bold: true });

        doc.moveTo(50, doc.y + 10).lineTo(550, doc.y + 10).stroke();
    }

    function checkForNewPage(doc, rowHeight) {
        if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            drawTableHeaders(doc);
        }
    }

    drawTableHeaders(doc);

    orderData.orderItems.forEach((item, index) => {
        const rowHeight = 20; 
        checkForNewPage(doc, rowHeight); 
    
        const rowY = doc.y + 15;
        const itemNumberX = 50;
        const itemNameX = 100;
        const itemQuantityX = 300;
        const itemPriceX = 370;
        const itemTotalX = 450;
    
        doc.text((index + 1).toString(), itemNumberX, rowY);
    
        doc.text(item.name, itemNameX, rowY, {
            width: itemQuantityX - itemNameX - 10, 
            ellipsis: true, 
        });
    
        doc.text(item.quantity.toString(), itemQuantityX, rowY);
        doc.text(item.price.toString(), itemPriceX, rowY);
        doc.text(item.total.toString(), itemTotalX, rowY);
    
        doc.moveDown(); 
    });
    
    doc.moveTo(50, doc.y + 10).lineTo(550, doc.y + 10).stroke();

    const totalsY = doc.y + 20;

    doc.fontSize(12).text(`Total Items: ${orderData.orderItems.length}`, 50, totalsY);
    doc.text(`Overall Total: Rs ${orderData.overallTotal}`, { align: 'right' });

    doc.end();
});


// Root route to confirm server is running
app.get('/', (req, res) => {
    res.json({
        message: 'Server running'
    });
});

// Start the server and connect to the database
const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`);
        });
    } catch (error) {
        console.log(error);
    }
};

start();
