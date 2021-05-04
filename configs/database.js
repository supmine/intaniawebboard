const mongoose = require('mongoose');


const mongoURI = "mongodb+srv://Tarm:Tarm123@cluster0.0a1dx.mongodb.net/ComEngEss";

const initServer = async() => {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to DB !!");
    } catch (e) {
        console.log(e);
        throw e;
    }
};

module.exports = initServer;