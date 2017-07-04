let express = require('express');
let session = require('express-session');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let passport = require('passport');

let index = require('./routes/index');
let posts = require('./routes/posts');
let login = require('./routes/login');
let logout = require('./routes/logout');
let admin = require('./routes/admin');
let categories = require('./routes/api/v1/categories');
let tags = require('./routes/api/v1/tags');
let thumbnails = require('./routes/api/v1/thumbnails');
let tasks = require('./routes/api/v1/tasks');
let events = require('./routes/api/v1/events');
let db = require('./models/db');
db.connect();

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('trust proxy', 1);
app.use(session({
    secret: 'MasaBlog',
    resave: false,
    saveUninitialized: true,
    cookie: {secure: true}
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
app.use('/posts', posts);
app.use('/login', login);
app.use('/logout', logout);
app.use('/admin', admin);
app.use('/api/v1/categories', categories);
app.use('/api/v1/tags', tags);
app.use('/api/v1/thumbnails', thumbnails);
app.use('/api/v1/tasks', tasks);
app.use('/api/v1/events', events);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
