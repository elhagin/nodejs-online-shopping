const userModel = require('../models/users');
const jwt = require('jsonwebtoken');

module.exports = {
	authenticate: function(req, res, next) {
		userModel.findOne({ email: req.body.email }, function(err, userData) {
			if (err) {
				next(err);
			} else {
				if (req.body.password === userData.password) {
					const token = jwt.sign(
						{ id: userData._id },
						req.app.get('secretKey'),
						{ expiresIn: '24h' }
					);
					res.json({
						token: token
					});
				} else {
					res.json({
						status: 'error',
						message: 'Unable to authenticate user. Invalid email/password',
						data: null
					});
				}
			}
		});
	}
};
