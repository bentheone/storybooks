const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');

// Load config
dotenv.config({ path: './config/config.env' });

const app = express();

//Body parser 
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

// Passport config
require('./config/passport')(passport);

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

const { formatDate, scriptTags, truncate, editIcon } = require('./helpers/ejs')

// EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set global variables 
app.use((req, res, next) => {
    res.locals.formatDate = formatDate;
    res.locals.scriptTags = scriptTags;
    res.locals.truncate = truncate;
    res.locals.editIcon = editIcon;
    res.locals.user = req.user || null 
    next();
})

// Sessions
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        touchAfter: 24 * 3600 // time period in seconds
    })
}));

// Middleware for passport and static files
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/stories', require('./routes/stories'));

// Middleware for logging requests
app.use((req, res, next) => {
    console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
    next();
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
