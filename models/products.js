const mongoose = require('../config/database');
const Schema = mongoose.Schema;

const ProductsSchema = new Schema({
    name: String,
    price: String,
    currency: String,
    category: String,
    vendor: String,
    publisher: String,
    quantity: String,
    description: String
});

module.exports = mongoose.model('Products', ProductsSchema, 'Products');
