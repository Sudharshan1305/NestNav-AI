const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const apiRoutes = require('./routes/api');
const historyRoutes = require('./routes/history');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/nestnav');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected");
});

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
const sessionConfig = {
    name: 'nestnav.session',
    secret: 'your-secret-key-here', // Change this in production
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7
    },
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/nestnav',
        touchAfter: 24 * 3600 // lazy session update
    })
};

app.use(session(sessionConfig));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user available in all templates
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user;
    next();
});

// Routes
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/api', apiRoutes);
app.use('/history', historyRoutes);

module.exports = app;

// Home route
app.get('/', (req, res) => {
    res.render('home', {
        title: 'NestNav - Find Your Perfect Neighborhood in Chennai'
    });
});

// Educational route - Add this BEFORE the catch-all route
app.get('/educational', (req, res) => {
    res.render('educational', {
        title: 'About Chennai - Understanding Neighborhoods | NestNav'
    });
});

// Profile route - Requires authentication
app.get('/profile', (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
        return res.redirect('/login');
    }

    res.render('profile', {
        title: 'Profile | NestNav',
        user: req.session.user
    });
});

// 404 handler - This should be the LAST route
app.all('/*catchall', (req, res) => {
    res.status(404).render('error', {
        status: 404,
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    res.status(status).render('error', {
        status: status,
        title: status === 500 ? 'Internal Server Error' : 'Something went wrong!',
        message: status === 500
            ? 'An error occurred while processing your request.'
            : err.message || 'An unexpected error occurred.'
    });
});

console.log("✅ App loaded routes successfully.");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`NestNav serving on port ${PORT}`);
});

