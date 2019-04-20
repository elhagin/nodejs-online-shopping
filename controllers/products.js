const productsModel = require("../models/products");

const showAllProducts = function(req, res, next) {
	productsModel.find({}, function(err, products) {
		if (err) {
			next(err);
		} else {
			res.json({
				products: products
			});
		}
	});
};

module.exports = {
	showAllProducts
};
