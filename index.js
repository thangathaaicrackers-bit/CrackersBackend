const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./Config/db');
const crackerRoutes = require('./Logics/Crackers');
const userRoutes = require('./Logics/UserEstimate');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allowlist for CORS
const allowlist = [
    'http://localhost:5173',
    '*'
];

// CORS options with dynamic origin checking
const corsOptionsDelegate = (req, callback) => {
    let corsOptions = {
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    };
    if (allowlist.includes(req.header('Origin'))) {
        corsOptions.origin = true; // Allow the origin
    } else {
        corsOptions.origin = false; // Disallow the origin
    }

    callback(null, corsOptions);
};

// Use the cors middleware with the delegate
app.use(cors(corsOptionsDelegate));

app.use('/api', crackerRoutes);
app.use('/api', userRoutes);

const PORT = process.env.PORT || 5000;

app.post('/send-estimate', async (req, res) => {
    const { orderData } = req.body;

    const doc = new PDFDocument({ margin: 50 });
    let pdfBuffer = [];

    doc.on('data', pdfBuffer.push.bind(pdfBuffer));
    doc.on('end', () => {
        const pdfData = Buffer.concat(pdfBuffer);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'thangathaaicrackers@gmail.com', // Replace with your email
                pass: 'sazt fick irpx gfsr', // Replace with your 
                
            },
        });

        const mailOptions = {
            from: 'thagathaai@gmail.com', // Replace with your email
            to: 'mselvapriya31@gmail.com', // Replace with the owner's email
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

    // Add content to the PDF document
    doc.fontSize(18).text(`Order Estimate of ${orderData.username}`, { align: 'center' });
    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString('en-GB')}`, { align: 'right' });

    // Customer Details
    doc.moveDown().fontSize(14).text('Customer Details', { underline: true });
    doc.fontSize(12).text(`Name: ${orderData.username}`);
    doc.text(`Phone: ${orderData.phoneNo}`);
    doc.text(`Email: ${orderData.email}`);
    doc.text(`Address: ${orderData.address}, ${orderData.city}, ${orderData.state}`);

    // Add some spacing
    // Add some spacing before the table header
doc.moveDown(1.5);

// Table Headers with proper column alignment
const tableTop = doc.y + 10;  // Adjust the top position
const itemNumberX = 50;
const itemNameX = 100;
const itemQuantityX = 300;
const itemPriceX = 370;
const itemTotalX = 450;

doc.fontSize(12);
doc.text('S.NO', itemNumberX, tableTop, { bold: true });
doc.text('Product Name', itemNameX, tableTop, { bold: true });
doc.text('Quantity', itemQuantityX, tableTop, { bold: true });
doc.text('Rate Rs', itemPriceX, tableTop, { bold: true });
doc.text('Amount Rs', itemTotalX, tableTop, { bold: true });

// Draw a horizontal line under the header with extra padding
doc.moveTo(50, doc.y + 10).lineTo(550, doc.y + 10).stroke();

// Table Data with proper column alignment
orderData.orderItems.forEach((item, index) => {
    const rowY = doc.y + 15;  // Add extra spacing between rows
    doc.text((index + 1).toString(), itemNumberX, rowY);
    doc.text(item.name, itemNameX, rowY);
    doc.text(item.quantity.toString(), itemQuantityX, rowY);
    doc.text(item.price.toString(), itemPriceX, rowY);
    doc.text(item.total.toString(), itemTotalX, rowY);
    doc.moveDown();  // Ensure spacing between items
});

    // Add a horizontal line before totals
    doc.moveTo(50, doc.y + 10).lineTo(550, doc.y + 10).stroke();

    // Total Items and Overall Total
    const totalsY = doc.y + 20; // Add some space before totals

    doc.fontSize(12).text(`Total Items: ${orderData.orderItems.length}`, itemNumberX, totalsY);
    doc.text(`Overall Total: Rs ${orderData.overallTotal}`, { align: 'right' });

    doc.end();
});

app.get('/', (req, res) => {
    res.json({
        message: 'Server running'
    });
});

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
