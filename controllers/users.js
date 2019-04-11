const jwt = require("jsonwebtoken");
const createError = require('http-errors');

const usersModel = require("../models/users");
const productsModel = require("../models/products");

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

const addToCart = function(req, res, next) {
	productsModel.findOne({ _id: req.body.productID }, function(
		err,
		productData
	) {
		if (err) {
			next(err);
		} else {
			const productQuantity = productData.quantity;
			const purchaseQuantity = req.body.quantity;
			if (productQuantity >= purchaseQuantity) {
				updateProduct(req.body.productID, productQuantity - purchaseQuantity);
				updateUserCart(req.body.userID, productData, purchaseQuantity);
				res.json({ status: 200, message: "Successfully added to cart" });
			} else {
				res.json({
					status: "error",
					message:
						"Cannot purchase that quantity as it exceeds available quantity"
				});
			}
		}
	});
};

function updateProduct(productID, newQuantity) {
	productsModel.updateOne(
		{ _id: productID },
		{ quantity: newQuantity },
		function(err, res) {
			if (err) {
				next(err);
			}
		}
	);
};

function updateUserCart(userID, productToBeAdded, quantity) {
	usersModel.findOne({ _id: userID }, function(err, userData) {
		let alreadyAddedProduct = false;
		userData.cart.forEach(product => {
			if (product.productID.equals(productToBeAdded.productID)) {
				alreadyAddedProduct = true;
				const newQuantity = (product.quantity += quantity);

				usersModel.updateOne(
					{ _id: userID, "cart.productID": productToBeAdded.productID },
					{ $set: { "cart.$.quantity": newQuantity } },
					function(err, res) {
						if (err) {
							next(err);
						}
					}
				);
			}
		});

		if (!alreadyAddedProduct) {
			productToBeAdded = {
				productID: productToBeAdded._id,
				quantity: quantity,
				price: productToBeAdded.price,
				currency: productToBeAdded.currency
			};
			usersModel.updateOne(
				{ _id: userID },
				{ $push: { cart: productToBeAdded } },
				function(err, res) {
					if (err) {
						next(err);
					}
				}
			);
		}
	});
};

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
			productsModel.findById(product.productID, function(err, productData) {
				if (productData.quantity < product.quantity) {
					next(createError("Product stock is less than required purchase quantity"));
				}
			});

			if (product.currency !== 'USD') {
				switch (product.currency) {
					case 'EGP': product.price /= 17.35;
					break;

					case 'EUR': product.price /= 1.13;
					break;

					default: next(createError('Only EGP/USD/EUR currencies supported'));
				}
			}
			
			totalToBePaid += product.price;
		});

		const sid = 901405743;
		const link = `https://sandbox.2checkout.com/checkout/purchase?sid=${sid}&mode=2CO&li_0_price=${totalToBePaid}`
		
		res.send(link);
	});
};

const purchaseSuccess = function(req, res, next) {
	if (req.query.credit_card_processed === 'Y') {
		res.send("Congratulations on your purchase");
	} else {
		next(createError("Error during purchase"));
	}
};

module.exports = {
	authenticate,
	addToCart,
	proceedWithPayment,
	purchaseSuccess
};
