const mongoose = require('mongoose');
const mongoDB = 'mongodb://localhost:27017/nodejs-shopping';
mongoose.connect(mongoDB, {useNewUrlParser: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Successfully connected to MongoDB!');
});

module.exports = mongoose;
