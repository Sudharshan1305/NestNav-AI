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

        // 🔹 Fetch real forecast data for the results page from AI service via internal API
        let forecastData = [];
        try {
            const months = 12;
            const resp = await fetch('http://127.0.0.1:3000/api/forecast-prices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ area: selectedArea, months })
            });
            const json = await resp.json();
            if (resp.ok && json && json.success && Array.isArray(json.forecast)) {
                forecastData = json.forecast;
                // Ensure labels start from current month visually (front-end safety net)
                const nowLabel = new Date();
                const thisMonth = new Date(nowLabel.getFullYear(), nowLabel.getMonth(), 1);
                forecastData = forecastData.filter(item => {
                    const [y, m] = (item.ds || '').split('-').map(n => parseInt(n, 10));
                    if (!y || !m) return true;
                    const d = new Date(y, m - 1, 1);
                    return d >= thisMonth;
                });
            }
        } catch (e) {
            console.warn('Forecast fetch failed, continuing without forecast:', e.message);
        }

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
        const { area, months } = req.body;

        if (!area) {
            return res.status(400).json({ error: "Area is required." });
        }

        // Call Flask backend (running on port 5001)
        const response = await fetch('http://127.0.0.1:5001/forecast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ area, months: Math.max(1, Math.min(parseInt(months || 12, 10) || 12, 36)) })
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
