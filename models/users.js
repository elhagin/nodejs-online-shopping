const mongoose = require("../config/database");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const UsersSchema = new Schema({
	name: String,
	email: String,
	password: String,
	cart: [{ productID: ObjectId, quantity: Number }]
});

module.exports = mongoose.model("Users", UsersSchema, "Users");
