const mongoose =require('mongoose')

const CrackersSchema= new mongoose.Schema({
    name:{
        type:String,
        required:[true,'provide name']
    },
    price:{
        type:Number,
        required:[true,'provide price']
    },
    imageUrl: {
        type:String,
        default:'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg'
    },
    category: {
        type: String,
        required:[true,'provide category']
    },
    discount:{
        type:String,
        required:[true,'provide discount']
    }
})

// bijili => qty 2, rs. 50,
const CrackerModel=mongoose.model('Crackers',CrackersSchema)

module.exports=CrackerModel