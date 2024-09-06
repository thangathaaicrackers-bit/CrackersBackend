const mongoose=require('mongoose');

const connectDb=async(url)=>{
    await mongoose
        .connect(url)
        .then((res)=> {
            mongoose.set('debug',true);
            console.log('Connected');
        })
        .catch((error)=>{
            console.log(error);
        });
};

module.exports= connectDb;