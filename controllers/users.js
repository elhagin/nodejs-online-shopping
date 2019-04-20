const jwt = require("jsonwebtoken");
const createError = require("http-errors");

const usersModel = require("../models/users");
const productsModel = require("../models/products");
const mongoose = require("../config/database");
const ObjectID = mongoose.Types.ObjectId;

const authenticate = function(req, res, next) {
	usersModel.findOne({ email: req.body.email }, function(err, userData) {
		if (err) {
			next(err);
		} else {
			if (req.body.password === userData.password) {
				const token = jwt.sign({ id: userData._id }, req.app.get("secretKey"), {
					expiresIn: "24h"
				});
				res.json({
					token: token
				});
			} else {
				res.json({
					status: "error",
					message: "Unable to authenticate user. Invalid email/password",
					data: null
				});
			}
		}
	});
};

const addToCart = async function(req, res, next) {
	const productIDs = [];
	req.body.products.forEach(product => {
		productIDs.push(ObjectID(product.productID));
	});

	const products = await productsModel.find(
		{ _id: { $in: productIDs } },
		{ quantity: 1, price: 1, currency: 1 }
	);

	let notEnoughQuantity = false;
	let userCart = await usersModel.findOne(
		{ _id: ObjectID(req.body.userID) },
		{ _id: 0, cart: 1 }
	);
	userCart = userCart.toObject().cart;

	req.body.products.forEach(productInReq => {
		const currentProductInCart = userCart.filter(productInCart =>
			productInCart._id.equals(productInReq.productID)
		)[0];

		const newQuantity = currentProductInCart
			? currentProductInCart.quantity + productInReq.quantity
			: 0;
		notEnoughQuantity = products.some(
			product =>
				product.quantity < productInReq.quantity ||
				newQuantity > product.quantity
		);

		products.forEach(product => (product.quantity = productInReq.quantity));
	});
	if (!notEnoughQuantity) {
		updateUserCart(req.body.userID, products, res);
	} else {
		res.send("Some products in cart exceed available quantity");
	}
};

async function updateUserCart(userID, productsToBeAdded, res) {
	const productIDs = [];
	productsToBeAdded.forEach(product => {
		productIDs.push(ObjectID(product._id));
	});

	let totalResult = [];

	productsToBeAdded.forEach(async product => {
		const productID = ObjectID(product._id);
		let result = await usersModel.updateOne(
			{ _id: ObjectID(userID), "cart._id": ObjectID(productID) },
			{ $inc: { "cart.$.quantity": product.quantity } }
		);
		result = Number(result.n === result.nModified);
		totalResult.push(Promise.resolve(result.nModified));
	});

	result = await usersModel.updateOne(
		{ _id: userID, "cart._id": { $nin: productIDs } },
		{ $push: { cart: { $each: productsToBeAdded } } }
	);

	result = Number(result.n === result.nModified);
	totalResult.push(Promise.resolve(result.nModified));

	Promise.all(totalResult).then(function(results) {
		if (!results.includes(0)) {
			res.send("Successfully added to cart");
		} else {
			res.send("Error while adding some items to cart");
		}
	});
}

const proceedWithPayment = function(req, res, next) {
	if (!req.body.userID) {
		next(createError("User not authenticated"));
	}

	usersModel.findById(req.body.userID, function(err, user) {
		if (!user.cart || user.cart.length == 0) {
			next(createError("User does not have any products in cart"));
		}

		let totalToBePaid = 0;

		user.cart.forEach(product => {
			productsModel.findById(product._id, function(err, productData) {
				if (productData.quantity < product.quantity) {
					next(
						createError("Product stock is less than required purchase quantity")
					);
				}

				decrementProductStock(
					product._id,
					productData.quantity - product.quantity,
					next
				);
			});

			if (product.currency !== "USD") {
				switch (product.currency) {
					case "EGP":
						product.price /= 17.35;
						break;

					case "EUR":
						product.price /= 1.13;
						break;

					default:
						next(createError("Only EGP/USD/EUR currencies supported"));
				}
			}

			totalToBePaid += product.price * quantity;
		});

		const sid = 901405743;
		const link = `https://sandbox.2checkout.com/checkout/purchase?sid=${sid}
		&mode=2CO&li_0_price=${totalToBePaid}`;

		res.send(link);
	});
};

const purchaseSuccess = function(req, res) {
	if (req.query.credit_card_processed === "Y") {
		res.send("Congratulations on your purchase");
	} else {
		res.send("Error during purchase");
	}
};

function decrementProductStock(productID, newQuantity, next) {
	productsModel.updateOne(
		{ _id: productID },
		{ quantity: newQuantity },
		function(err, res) {
			if (err) {
				next(err);
			}
		}
	);
}

module.exports = {
	authenticate,
	addToCart,
	proceedWithPayment,
	purchaseSuccess
};
