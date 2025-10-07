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

// GET Search history
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);

        // Get recent searches directly from the searchHistory array
        // Sort by searchDate (newest first) and limit to 20
        const searchHistory = user && user.searchHistory ?
            user.searchHistory
                .sort((a, b) => new Date(b.searchDate) - new Date(a.searchDate))
                .slice(0, 20) : [];

        res.render('history', {
            title: 'Search History - NestNav',
            searchHistory,
            user: req.session.user
        });

    } catch (error) {
        console.error('History fetch error:', error);
        res.render('history', {
            title: 'Search History - NestNav',
            searchHistory: [],
            user: req.session.user,
            error: 'Failed to load search history'
        });
    }
});

// GET Search history via API
router.get('/api', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);

        // Get recent searches directly from the searchHistory array
        const searchHistory = user && user.searchHistory ?
            user.searchHistory
                .sort((a, b) => new Date(b.searchDate) - new Date(a.searchDate))
                .slice(0, 20) : [];

        res.json({
            success: true,
            data: searchHistory
        });

    } catch (error) {
        console.error('History API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch search history'
        });
    }
});

// DELETE a specific search from history
router.delete('/:searchId', isLoggedIn, async (req, res) => {
    const { searchId } = req.params;

    try {
        const user = await User.findById(req.session.user.id);

        if (!user) {
            return res.status(401).json({ success: false, error: 'User not found or not logged in' });
        }

        // Find the index of the search entry
        const searchIndex = user.searchHistory.findIndex(
            search => search._id.toString() === searchId
        );

        if (searchIndex === -1) {
            return res.status(404).json({ success: false, error: 'Search entry not found' });
        }

        // Remove the search entry using splice
        user.searchHistory.splice(searchIndex, 1);
        await user.save();

        return res.json({ success: true, message: 'Search deleted successfully' });
    } catch (error) {
        console.error('Error deleting search history:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST Clear all history
router.post('/clear', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);

        if (user) {
            user.searchHistory = [];
            await user.save();
            res.redirect('/history?message=history_cleared');
        } else {
            res.redirect('/history?error=user_not_found');
        }

    } catch (error) {
        console.error('Clear history error:', error);
        res.redirect('/history?error=clear_failed');
    }
});

module.exports = router;