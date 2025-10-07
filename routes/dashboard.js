const express = require('express');
const User = require('../models/user');
const locationModel = require('../models/location');
const router = express.Router();

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// GET Dashboard
router.get('/', isLoggedIn, (req, res) => {
    const areas = locationModel.getAllAreas();
    const parameterOptions = [
        'FloodScore',
        'HospitalScore',
        'CollegeScore',
        'FactoryScore',
        'CrimeScore',
        'ConnectivityScore',
        'MallScore',
        'PowerScore',
        'ServicesScore',
        'CostScore',
        'ResidentialScore',
        'SafetyScore'
    ];

    res.render('dashboard', {
        title: 'Dashboard - NestNav',
        areas,
        parameterOptions,
        user: req.session.user
    });
});

// POST Recommendation
router.post('/recommend', isLoggedIn, async (req, res) => {
    try {
        const { selectedArea, budget, preference1, preference2, preference3 } = req.body;

        // Validation
        if (!selectedArea || !preference1 || !preference2 || !preference3) {
            return res.redirect('/dashboard?error=missing_fields');
        }

        const preferences = [preference1, preference2, preference3];

        // Check for duplicate preferences
        if (new Set(preferences).size !== 3) {
            return res.redirect('/dashboard?error=duplicate_preferences');
        }

        // Get recommendations
        const results = locationModel.calculateRecommendations(
            selectedArea,
            parseFloat(budget) || 0,
            preferences
        );

        if (results.error) {
            return res.redirect('/dashboard?error=calculation_error');
        }

        // Save search to user history
        const user = await User.findById(req.session.user.id);
        if (user) {
            await user.addSearchToHistory({
                selectedArea,
                budget: parseFloat(budget) || 0,
                preferences,
                results: results.top3.map(area => ({
                    location: area.Location,
                    score: area.FinalScore
                }))
            });
        }

        // 🔹 Generate forecast data for the results page
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let base = Math.floor(Math.random() * 2000) + 5000;
        const forecastData = months.map((month, i) => {
            const yhat = base + (i * (Math.random() * 300 + 200));
            return { ds: month, yhat: Math.round(yhat) };
        });

        // 🔹 Render results page (now includes forecast data)
        res.render('results', {
            title: 'Recommendations - NestNav',
            selectedArea,
            budget,
            preferences,
            results,
            forecastData,
            user: req.session.user
        });

    } catch (error) {
        console.error('Recommendation error:', error);
        res.redirect('/dashboard?error=server_error');
    }
});

// GET Educational page
router.get('/educational', isLoggedIn, (req, res) => {
    res.render('educational', {
        title: 'Learn About Chennai - NestNav',
        user: req.session.user
    });
});

// 🔹 Forecast Page (Separate Page)
router.get('/forecast', isLoggedIn, (req, res) => {
    const areas = locationModel.getAllAreas();
    res.render('forecast', {
        title: 'Forecast - NestNav',
        areas,
        user: req.session.user,
        query: req.query
    });
});

// 🔹 Forecast API (calls Flask backend)
router.post('/api/forecast', isLoggedIn, async (req, res) => {
    try {
        const { area } = req.body;

        if (!area) {
            return res.status(400).json({ error: "Area is required." });
        }

        // Call Flask backend (running on port 5001)
        const response = await fetch('http://127.0.0.1:5001/forecast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ area })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Flask forecast service error");
        }

        res.json(data);
    } catch (error) {
        console.error("Forecast API error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
