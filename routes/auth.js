const express = require('express');
const User = require('../models/user');
const router = express.Router();

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// Middleware to check if user is NOT logged in
const isLoggedOut = (req, res, next) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    next();
};

// GET Login page
router.get('/login', isLoggedOut, (req, res) => {
    res.render('login', { title: 'Login - NestNav', error: null });
});

// POST Login
router.post('/login', isLoggedOut, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) {
            return res.render('login', {
                title: 'Login - NestNav',
                error: 'Invalid username or password'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', {
                title: 'Login - NestNav',
                error: 'Invalid username or password'
            });
        }

        // Create session
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email
        };

        res.redirect('/dashboard');

    } catch (error) {
        console.error('Login error:', error);
        res.render('login', {
            title: 'Login - NestNav',
            error: 'Something went wrong. Please try again.'
        });
    }
});

// GET Register page
router.get('/register', isLoggedOut, (req, res) => {
    res.render('register', { title: 'Register - NestNav', error: null });
});

// POST Register
router.post('/register', isLoggedOut, async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // Basic validation
        if (!username || !email || !password || !confirmPassword) {
            return res.render('register', {
                title: 'Register - NestNav',
                error: 'All fields are required'
            });
        }

        if (password !== confirmPassword) {
            return res.render('register', {
                title: 'Register - NestNav',
                error: 'Passwords do not match'
            });
        }

        if (password.length < 6) {
            return res.render('register', {
                title: 'Register - NestNav',
                error: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.render('register', {
                title: 'Register - NestNav',
                error: 'Username or email already exists'
            });
        }

        // Create new user
        const user = new User({ username, email, password });
        await user.save();

        // Auto login after registration
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email
        };

        res.redirect('/dashboard');

    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', {
            title: 'Register - NestNav',
            error: 'Something went wrong. Please try again.'
        });
    }
});

// POST Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});


// Add these routes to your auth.js file (replace the commented section)

// Profile update route
router.post('/profile/update', isLoggedIn, async (req, res) => {
    try {
        const { email, fullName, phone, location, preferences } = req.body;

        // Update user in database
        await User.findByIdAndUpdate(req.session.user.id, {
            email,
            fullName,
            phone,
            location,
            preferences
        });

        // Update session data
        req.session.user = {
            ...req.session.user,
            email,
            fullName,
            phone,
            location,
            preferences
        };

        res.render('profile', {
            title: 'Profile | NestNav',
            user: req.session.user,
            message: 'Profile updated successfully!'
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.render('profile', {
            title: 'Profile | NestNav',
            user: req.session.user,
            error: 'Error updating profile. Please try again.'
        });
    }
});

// Change password route
router.post('/profile/change-password', isLoggedIn, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.render('profile', {
                title: 'Profile | NestNav',
                user: req.session.user,
                error: 'New passwords do not match!'
            });
        }

        if (newPassword.length < 6) {
            return res.render('profile', {
                title: 'Profile | NestNav',
                user: req.session.user,
                error: 'Password must be at least 6 characters long!'
            });
        }

        // Get user from database
        const user = await User.findById(req.session.user.id);

        // Verify current password
        const isValidPassword = await user.comparePassword(currentPassword);
        if (!isValidPassword) {
            return res.render('profile', {
                title: 'Profile | NestNav',
                user: req.session.user,
                error: 'Current password is incorrect!'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.render('profile', {
            title: 'Profile | NestNav',
            user: req.session.user,
            message: 'Password updated successfully!'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.render('profile', {
            title: 'Profile | NestNav',
            user: req.session.user,
            error: 'Error changing password. Please try again.'
        });
    }
});

// Delete account route
router.post('/profile/delete', isLoggedIn, async (req, res) => {
    try {
        // Delete user from database
        await User.findByIdAndDelete(req.session.user.id);

        // Destroy session
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
            res.redirect('/?message=Account deleted successfully');
        });
    } catch (error) {
        console.error('Account deletion error:', error);
        res.render('profile', {
            title: 'Profile | NestNav',
            user: req.session.user,
            error: 'Error deleting account. Please try again.'
        });
    }
});

module.exports = router;