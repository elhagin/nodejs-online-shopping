const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const validateUser = require('./middlewares/validateUser');

const app = express();

app.set('secretKey', 'nodejsShopping');

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// routes
app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/products', validateUser, productsRouter);

// express doesn't consider not found 404 as an error so we need to handle 404 explicitly
// handle 404 error
app.use(function(req, res, next) {
	let err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.log(err);
  
	res.status(err.status || 500);
	res.json({ err: err });
});

module.exports = app;
