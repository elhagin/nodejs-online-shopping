const jwt = require("jsonwebtoken");

const usersModel = require("../models/users");
const productsModel = require("../models/products");

const authFunc = function(req, res, next) {
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

const addToCartFunc = function(req, res, next) {
	productsModel.findOne({ name: req.body.productName }, function(
		err,
		productData
	) {
		if (err) {
			next(err);
		} else {
			const productQuantity = productData.quantity;
			const purchaseQuantity = req.body.quantity;
			if (productQuantity >= purchaseQuantity) {
				updateProduct(req.body.productName, productQuantity - purchaseQuantity);
				updateUserCart(req.body.userID, productData.name, purchaseQuantity);
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

function updateProduct(productName, newQuantity) {
	productsModel.updateOne(
		{ name: productName },
		{ quantity: newQuantity },
		function(err, res) {
			if (err) {
				next(err);
			}
		}
	);
}

function updateUserCart(userID, productName, quantity) {
	usersModel.findOne({ _id: userID }, function(err, userData) {
		let alreadyAddedProduct = false;
		userData.cart.forEach(product => {
			if (product.productName === productName) {
				alreadyAddedProduct = true;
				const newQuantity = (product.quantity += quantity);

				usersModel.updateOne(
					{ _id: userID, "cart.productName": productName },
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
			usersModel.updateOne(
				{ _id: userID },
				{ $push: { cart: { productName: productName, quantity: quantity } } },
				function(err, res) {
					if (err) {
						next(err);
					}
				}
			);
		}
	});
}

module.exports = {
	authenticate: authFunc,
	addToCart: addToCartFunc
};
