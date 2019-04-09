const productsModel = require("../models/products");

module.exports = {
	showAllProducts: function(req, res, next) {
		productsModel.find({}, function(err, products) {
			if (err) {
				next(err);
			} else {
				res.json({
					products: products
				});
			}
		});
	}
};
