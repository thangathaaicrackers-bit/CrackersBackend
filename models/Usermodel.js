const mongoose = require('mongoose')
const { default: nodemon } = require('nodemon')

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'provide name']
    },
    phoneNo: {
        type: Number,
        required: [true, 'provide phone number']
    },
    email: {
        type: String,
    },
    address: {
        type: String,
        required: [true, 'provide address']
    },
    state: {
        type: String,
        required: [true, 'provide state']
    },
    city: {
        type: String,
        required: [true, 'provide city']
    },
    orderItems: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Crackers'
            },
            quantity: {
                type: Number,
            },
            total: {
                type: Number,
            }
        }
    ],
    overalltotal: {
        type: Number,
    },
})

const UserModel = mongoose.model('User', UserSchema)

module.exports = UserModel