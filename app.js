const createError = require("http-errors");
const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("./config/database");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const app = express();

app.set("secretKey", "nodejsShopping");

app.use(logger("dev"));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/", indexRouter);
app.use("/login", usersRouter);

function validateUser(req, res, next) {
	jwt.verify(req.headers["x-access-token"], req.app.get("secretKey"), function(
		err,
		decoded
	) {
		if (err) {
			res.json({ status: "error", message: err.message, data: null });
		} else {
			req.body.userId = decoded.id;
			next();
		}
	});
}

// express doesn't consider not found 404 as an error so we need to handle 404 explicitly
// handle 404 error
app.use(function(req, res, next) {
	let err = new Error("Not Found");
	err.status = 404;
	next(err);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = "error";
	res.locals.error = req.app.get("env") === "development" ? err : {};

	res.status(err.status || 500);
	res.json({ err: err });
});

module.exports = app;
