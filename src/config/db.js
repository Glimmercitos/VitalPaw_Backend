const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://vitalpaw:123@localhost:27017/vitalpawdb', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            authSource: 'admin', 
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { connectDB };
 