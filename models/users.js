const mongoose = require('../config/database');
const Schema = mongoose.Schema;

const UsersSchema = new Schema({
    name: String,
    email: String,
    password: String
});

module.exports = mongoose.model('Users', UsersSchema, 'Users');