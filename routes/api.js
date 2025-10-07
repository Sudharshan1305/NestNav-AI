const express = require('express');
const locationModel = require('../models/location');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const axios = require('axios');

// Middleware to check if user is logged in (for API)
const isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// GET All areas
router.get('/areas', isLoggedIn, (req, res) => {
    try {
        const areas = locationModel.getAllAreas();
        res.json({ success: true, data: areas });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch areas' });
    }
});

// GET Zone info for specific area
router.get('/zones/:area', isLoggedIn, (req, res) => {
    try {
        const area = req.params.area;
        const zone = locationModel.getZoneForArea(area);
        res.json({ success: true, data: { area, zone } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch zone info' });
    }
});

// POST Get recommendations (AJAX version)
router.post('/recommend', isLoggedIn, (req, res) => {
    try {
        const { selectedArea, budget, preferences } = req.body;

        // Validation
        if (!selectedArea || !preferences || preferences.length !== 3) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input parameters'
            });
        }

        // Check for duplicate preferences
        if (new Set(preferences).size !== 3) {
            return res.status(400).json({
                success: false,
                error: 'Preferences must be unique'
            });
        }

        // Get recommendations
        const results = locationModel.calculateRecommendations(
            selectedArea,
            parseFloat(budget) || 0,
            preferences
        );

        if (results.error) {
            return res.status(500).json({
                success: false,
                error: results.error
            });
        }

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('API recommendation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// GET Parameter options
router.get('/parameters', isLoggedIn, (req, res) => {
    const parameters = [
        { key: 'FloodScore', display: 'Flood Score' },
        { key: 'HospitalScore', display: 'Hospital Score' },
        { key: 'CollegeScore', display: 'College Score' },
        { key: 'FactoryScore', display: 'Factory Score' },
        { key: 'CrimeScore', display: 'Crime Score' },
        { key: 'ConnectivityScore', display: 'Connectivity Score' },
        { key: 'MallScore', display: 'Mall Score' },
        { key: 'PowerScore', display: 'Power Score' },
        { key: 'ServicesScore', display: 'Services Score' },
        { key: 'CostScore', display: 'Cost Score' },
        { key: 'ResidentialScore', display: 'Residential Score (Low Factory)' },
        { key: 'SafetyScore', display: 'Safety Score (Low Crime)' }
    ];

    res.json({ success: true, data: parameters });
});

// // Middleware to check if user is logged in
// const isLoggedIn = (req, res, next) => {
//     if (!req.session.user) {
//         return res.status(401).json({ success: false, error: 'Not authenticated' });
//     }
//     next();
// };

// // Get neighborhoods overview for dashboard (PUBLIC - no auth required)
// router.get('/neighborhoods/overview', async (req, res) => {
//     try {
//         // Read Chennai dataset
//         const dataPath = path.join(__dirname, '../public/data/chennai_dataset.csv');

//         if (!fs.existsSync(dataPath)) {
//             return res.status(404).json({
//                 success: false,
//                 error: 'Chennai dataset not found'
//             });
//         }

//         const csvData = fs.readFileSync(dataPath, 'utf8');

//         const results = Papa.parse(csvData, {
//             header: true,
//             dynamicTyping: true,
//             skipEmptyLines: true
//         });

//         if (results.errors.length > 0) {
//             console.warn('CSV parsing warnings:', results.errors);
//         }

//         // Process data for charts with flexible column mapping
//         const neighborhoods = results.data.map(row => {
//             // Handle different possible column name formats
//             const getName = () => row.Neighborhood || row.neighborhood || row.Location || row.location || row.Name || row.name;
//             const getZone = () => row.Zone || row.zone || row.Area || row.area;

//             return {
//                 name: getName(),
//                 zone: getZone(),
//                 safetyScore: parseFloat(row.SafetyScore || row.safety_score || row.Safety || 0) || 0,
//                 connectivityScore: parseFloat(row.ConnectivityScore || row.connectivity_score || row.Connectivity || 0) || 0,
//                 amenitiesScore: parseFloat(row.AmenitiesScore || row.amenities_score || row.Amenities || 0) || 0,
//                 environmentScore: parseFloat(row.EnvironmentScore || row.environment_score || row.Environment || 0) || 0,
//                 lifestyleScore: parseFloat(row.LifestyleScore || row.lifestyle_score || row.Lifestyle || 0) || 0,
//                 floodScore: parseFloat(row.FloodScore || row.flood_score || row.Flood || 0) || 0,
//             };
//         }).filter(n => n.name && n.name.trim() !== ''); // Filter out rows without valid names

//         console.log(`Loaded ${neighborhoods.length} neighborhoods for overview`);

//         res.json({
//             success: true,
//             neighborhoods: neighborhoods,
//             totalCount: neighborhoods.length
//         });

//     } catch (error) {
//         console.error('Error loading neighborhoods overview:', error);
//         res.status(500).json({
//             success: false,
//             error: 'Failed to load neighborhoods data',
//             details: error.message
//         });
//     }
// });



// FIXED VERSION OF api.js - Replace the neighborhoods overview route

// Enhanced neighborhoods overview with FIXED data processing
router.get('/neighborhoods/overview', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, '../public/data/updated_dataset.csv');

        if (!fs.existsSync(dataPath)) {
            return res.status(404).json({
                success: false,
                error: 'Dataset not found'
            });
        }

        const csvData = fs.readFileSync(dataPath, 'utf8');

        const results = Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim() // Clean headers
        });

        if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
        }

        console.log('CSV Headers found:', results.meta.fields);
        console.log('Total rows in CSV:', results.data.length);

        // FIXED: Enhanced data processing that matches your CSV exactly
        const neighborhoods = results.data
            .map((row, index) => {
                // Debug first few rows
                if (index < 3) {
                    console.log(`Row ${index}:`, {
                        Location: row.Location,
                        AvailablePlots: row.AvailablePlots,
                        FloodScore: row.FloodScore
                    });
                }

                // Use EXACT column names from your CSV
                const location = row.Location?.trim();
                if (!location || location === '') {
                    console.log(`Skipping row ${index}: no location`);
                    return null;
                }

                // Map your CSV data to the expected chart format
                return {
                    // Primary identifiers - EXACT match to your CSV
                    name: location,
                    location: location, // For compatibility
                    Location: location, // Keep original

                    // Zone mapping (you might need to add Zone column to CSV or map it)
                    zone: mapLocationToZone(location), // We'll create this function
                    Zone: mapLocationToZone(location),

                    // EXACT scores from your CSV - using actual column names
                    safetyScore: 10 - (parseFloat(row.CrimeScore) || 0), // Invert crime score
                    connectivityScore: parseFloat(row.ConnectivityScore) || 0,
                    floodScore: parseFloat(row.FloodScore) || 0,
                    hospitalScore: parseFloat(row.HospitalScore) || 0,
                    collegeScore: parseFloat(row.CollegeScore) || 0,
                    mallScore: parseFloat(row.MallScore) || 0,
                    powerScore: parseFloat(row.PowerScore) || 0,
                    servicesScore: parseFloat(row.ServicesScore) || 0,
                    costScore: parseFloat(row.CostScore) || 0,
                    factoryScore: parseFloat(row.FactoryScore) || 0,

                    // Calculated composite scores
                    amenitiesScore: calculateAmenitiesScore(row),
                    environmentScore: calculateEnvironmentScore(row),
                    lifestyleScore: calculateLifestyleScore(row),
                    infrastructureScore: calculateInfrastructureScore(row),

                    // Direct mappings from CSV
                    floodRisk: row.FloodRisk || 'Medium',
                    availablePlots: parseInt(row.AvailablePlots) || 0, // This is the key fix!
                    crimeScore: parseFloat(row.CrimeScore) || 0,

                    // Transport data (derived from connectivity)
                    metroAccess: Math.min(10, (parseFloat(row.ConnectivityScore) || 0) + Math.random() * 2),
                    busConnectivity: Math.min(10, (parseFloat(row.ConnectivityScore) || 0) + Math.random() * 2),

                    // Rent data - you might need to add these to CSV or estimate
                    avgRent1BHK: estimateRent(location, '1BHK', row.CostScore),
                    avgRent2BHK: estimateRent(location, '2BHK', row.CostScore),
                    avgRent3BHK: estimateRent(location, '3BHK', row.CostScore),

                    // Other useful mappings
                    schoolProximity: parseFloat(row.CollegeScore) || 0,
                    shoppingCenters: parseFloat(row.MallScore) || 0
                };
            })
            .filter(n => n !== null && n.availablePlots !== undefined); // Filter out invalid entries

        console.log(`Processed ${neighborhoods.length} neighborhoods with plot data`);

        // Debug: Show first neighborhood's data
        if (neighborhoods.length > 0) {
            console.log('Sample processed neighborhood:', neighborhoods[0]);
        }

        const zones = [...new Set(neighborhoods.map(n => n.zone))].filter(z => z && z !== 'Unknown');

        res.json({
            success: true,
            neighborhoods: neighborhoods,
            totalCount: neighborhoods.length,
            zones: zones
        });

    } catch (error) {
        console.error('Error loading neighborhoods overview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load neighborhoods data',
            details: error.message
        });
    }
});

// Helper function to map locations to zones (add this to your api.js)
function mapLocationToZone(location) {
    const zoneMapping = {
        // North Chennai
        'Ambattur': 'North Chennai',
        'Anna Nagar': 'North Chennai',
        'Aminjikarai': 'North Chennai',
        'Avadi': 'North Chennai',
        'Ayanavaram': 'North Chennai',
        'Kilpauk': 'North Chennai',
        'Korattur': 'North Chennai',
        'Madhavaram': 'North Chennai',
        'Manali': 'North Chennai',
        'Mogappair': 'North Chennai',
        'Perambur': 'North Chennai',
        'Red Hills': 'North Chennai',
        'Shenoy Nagar': 'North Chennai',
        'Villivakkam': 'North Chennai',

        // South Chennai  
        'Adyar': 'South Chennai',
        'Besant Nagar': 'South Chennai',
        'Guindy': 'South Chennai',
        'IIT Madras': 'South Chennai',
        'Kotturpuram': 'South Chennai',
        'Mylapore': 'South Chennai',
        'Nandanam': 'South Chennai',
        'Saidapet': 'South Chennai',
        'Thiruvanmiyur': 'South Chennai',
        'Velachery': 'South Chennai',

        // Central Chennai
        'Egmore': 'Central Chennai',
        'Nungambakkam': 'Central Chennai',
        'T. Nagar': 'Central Chennai',
        'Teynampet': 'Central Chennai',
        'West Mambalam': 'Central Chennai',
        'Kodambakkam': 'Central Chennai',
        'Royapettah': 'Central Chennai',

        // West Chennai
        'Porur': 'West Chennai',
        'Koyambedu': 'West Chennai',
        'Vadapalani': 'West Chennai',
        'Valasaravakkam': 'West Chennai',
        'Virugambakkam': 'West Chennai',

        // East Chennai
        'Sholinganallur': 'East Chennai',
        'Thoraipakkam': 'East Chennai',
        'Pallikaranai': 'East Chennai',
        'Medavakkam': 'East Chennai'
    };

    return zoneMapping[location] || 'Other Chennai';
}

// Helper function to calculate composite amenities score
function calculateAmenitiesScore(row) {
    const hospital = parseFloat(row.HospitalScore) || 0;
    const college = parseFloat(row.CollegeScore) || 0;
    const mall = parseFloat(row.MallScore) || 0;
    const services = parseFloat(row.ServicesScore) || 0;

    return parseFloat(((hospital + college + mall + services) / 4).toFixed(1));
}

// Helper function to calculate environment score
function calculateEnvironmentScore(row) {
    const flood = parseFloat(row.FloodScore) || 0;
    const factory = 10 - (parseFloat(row.FactoryScore) || 0); // Invert factory score
    const crime = 10 - (parseFloat(row.CrimeScore) || 0);     // Invert crime score

    return parseFloat(((flood + factory + crime) / 3).toFixed(1));
}

// Helper function to calculate lifestyle score
function calculateLifestyleScore(row) {
    const mall = parseFloat(row.MallScore) || 0;
    const connectivity = parseFloat(row.ConnectivityScore) || 0;
    const services = parseFloat(row.ServicesScore) || 0;
    const power = parseFloat(row.PowerScore) || 0;

    return parseFloat(((mall + connectivity + services + power) / 4).toFixed(1));
}

// Helper function to calculate infrastructure score
function calculateInfrastructureScore(row) {
    const power = parseFloat(row.PowerScore) || 0;
    const connectivity = parseFloat(row.ConnectivityScore) || 0;
    const services = parseFloat(row.ServicesScore) || 0;
    const hospital = parseFloat(row.HospitalScore) || 0;

    return parseFloat(((power + connectivity + services + hospital) / 4).toFixed(1));
}

// Helper function to estimate rent based on location and cost score
function estimateRent(location, bhkType, costScore) {
    const baseRent = {
        '1BHK': 12000,
        '2BHK': 20000,
        '3BHK': 30000
    };

    const cost = parseFloat(costScore) || 5;
    const multiplier = 0.8 + (cost / 10) * 0.8; // Range 0.8 to 1.6

    // Premium locations
    const premiumAreas = ['Adyar', 'T. Nagar', 'Anna Nagar', 'Nungambakkam', 'Besant Nagar'];
    const isPremium = premiumAreas.includes(location);

    const finalMultiplier = isPremium ? multiplier * 1.3 : multiplier;

    return Math.round(baseRent[bhkType] * finalMultiplier);
}

// Add this route to get available plots data specifically for charts
router.get('/neighborhoods/plots', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, '../public/data/updated_dataset.csv');
        const csvData = fs.readFileSync(dataPath, 'utf8');

        const results = Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });

        const plotsData = results.data
            .map(row => ({
                location: row.Location,
                availablePlots: parseInt(row.AvailablePlots) || 0,
                zone: mapLocationToZone(row.Location)
            }))
            .filter(item => item.location && item.availablePlots > 0);

        console.log(`Found ${plotsData.length} areas with available plots`);

        res.json({
            success: true,
            plotsData: plotsData,
            totalPlots: plotsData.reduce((sum, item) => sum + item.availablePlots, 0)
        });

    } catch (error) {
        console.error('Error loading plots data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load plots data'
        });
    }
});

// NEW: Get detailed data for specific recommendations (for results page)
router.get('/neighborhoods/detailed/:areas', isLoggedIn, async (req, res) => {
    try {
        const areaNames = req.params.areas.split(',');
        const dataPath = path.join(__dirname, '../public/data/chennai_dataset.csv');

        if (!fs.existsSync(dataPath)) {
            return res.status(404).json({
                success: false,
                error: 'Dataset not found'
            });
        }

        const csvData = fs.readFileSync(dataPath, 'utf8');
        const results = Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });

        // Find matching neighborhoods
        const detailedData = results.data
            .filter(row => {
                const name = row.Location || row.location || row.Name || row.name;
                return areaNames.some(area =>
                    name && name.toLowerCase().includes(area.toLowerCase())
                );
            })
            .map(row => ({
                Location: row.Location || row.location || row.Name || row.name,
                Zone: row.Zone || row.zone,
                FinalScore: parseFloat(row.FinalScore || Math.random() * 100),
                SafetyScore: parseFloat(row.SafetyScore || (10 - (row.CrimeScore || 0))),
                ConnectivityScore: parseFloat(row.ConnectivityScore || Math.random() * 10),
                FloodScore: parseFloat(row.FloodScore || Math.random() * 10),
                FloodRisk: row.FloodRisk || 'Medium',
                AvailablePlots: parseInt(row.AvailablePlots || Math.random() * 50),
                // Add all the preference scores
                HospitalScore: parseFloat(row.HospitalScore || Math.random() * 10),
                CollegeScore: parseFloat(row.CollegeScore || Math.random() * 10),
                MallScore: parseFloat(row.MallScore || Math.random() * 10),
                PowerScore: parseFloat(row.PowerScore || Math.random() * 10),
                ServicesScore: parseFloat(row.ServicesScore || Math.random() * 10),
                CostScore: parseFloat(row.CostScore || Math.random() * 10),
                ResidentialScore: parseFloat(row.ResidentialScore || Math.random() * 10),
                CrimeScore: parseFloat(row.CrimeScore || Math.random() * 5)
            }));

        res.json({
            success: true,
            neighborhoods: detailedData
        });

    } catch (error) {
        console.error('Error loading detailed neighborhood data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load detailed data'
        });
    }
});

// NEW: Get budget analysis data
router.get('/neighborhoods/budget-analysis', async (req, res) => {
    try {
        const { budget = 25000, bhkType = '2BHK' } = req.query;
        const dataPath = path.join(__dirname, '../public/data/updated_dataset.csv');

        const csvData = fs.readFileSync(dataPath, 'utf8');
        const results = Papa.parse(csvData, { header: true, dynamicTyping: true, skipEmptyLines: true });

        const rentKey = `AvgRent${bhkType}`;
        const budgetNum = parseFloat(budget);

        let withinBudget = 0;
        let slightlyOver = 0;
        let wayOver = 0;
        let noData = 0;

        results.data.forEach(row => {
            const rent = parseFloat(row[rentKey] || row[rentKey.toLowerCase()] || 0);

            if (!rent || rent === 0) {
                noData++;
            } else if (rent <= budgetNum) {
                withinBudget++;
            } else if (rent <= budgetNum * 1.2) {
                slightlyOver++;
            } else {
                wayOver++;
            }
        });

        res.json({
            success: true,
            budgetAnalysis: {
                withinBudget,
                slightlyOver,
                wayOver,
                noData,
                budget: budgetNum,
                bhkType,
                total: results.data.length
            }
        });

    } catch (error) {
        console.error('Error in budget analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze budget data'
        });
    }
});

// Add this to the end of your existing api.js file (before module.exports)
module.exports = router;

// Get zone statistics
router.get('/zones/stats', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, '../public/data/chennai_dataset.csv');
        const csvData = fs.readFileSync(dataPath, 'utf8');

        const results = Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });

        const neighborhoods = results.data;
        const zoneStats = {};

        neighborhoods.forEach(row => {
            const zone = row.Zone || row.zone;
            if (!zone) return;

            if (!zoneStats[zone]) {
                zoneStats[zone] = {
                    count: 0,
                    totalSafety: 0,
                    totalConnectivity: 0,
                    totalAmenities: 0,
                    totalRent2BHK: 0,
                    rentCount: 0
                };
            }

            const stats = zoneStats[zone];
            stats.count++;
            stats.totalSafety += parseFloat(row.SafetyScore || row.safety_score) || 0;
            stats.totalConnectivity += parseFloat(row.ConnectivityScore || row.connectivity_score) || 0;
            stats.totalAmenities += parseFloat(row.AmenitiesScore || row.amenities_score) || 0;

            const rent = parseFloat(row.AvgRent2BHK || row.avg_rent_2bhk) || 0;
            if (rent > 0) {
                stats.totalRent2BHK += rent;
                stats.rentCount++;
            }
        });

        // Calculate averages
        const processedStats = Object.keys(zoneStats).map(zone => ({
            zone,
            count: zoneStats[zone].count,
            avgSafety: (zoneStats[zone].totalSafety / zoneStats[zone].count).toFixed(1),
            avgConnectivity: (zoneStats[zone].totalConnectivity / zoneStats[zone].count).toFixed(1),
            avgAmenities: (zoneStats[zone].totalAmenities / zoneStats[zone].count).toFixed(1),
            avgRent2BHK: zoneStats[zone].rentCount > 0 ?
                Math.round(zoneStats[zone].totalRent2BHK / zoneStats[zone].rentCount) : 0
        }));

        res.json({
            success: true,
            zoneStats: processedStats
        });

    } catch (error) {
        console.error('Error loading zone statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load zone statistics'
        });
    }
});

// Get user's search analytics
router.get('/analytics/search-history', isLoggedIn, async (req, res) => {
    try {
        const User = require('../models/user');
        const user = await User.findById(req.session.user.id);

        if (!user || !user.searchHistory) {
            return res.json({
                success: true,
                analytics: {
                    totalSearches: 0,
                    searchTrends: [],
                    popularZones: [],
                    budgetTrends: []
                }
            });
        }

        const searchHistory = user.searchHistory;

        // Calculate analytics
        const analytics = {
            totalSearches: searchHistory.length,
            searchTrends: calculateSearchTrends(searchHistory),
            popularZones: calculatePopularZones(searchHistory),
            budgetTrends: calculateBudgetTrends(searchHistory)
        };

        res.json({
            success: true,
            analytics: analytics
        });

    } catch (error) {
        console.error('Error calculating search analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate analytics'
        });
    }
});

// Helper functions
function calculateSearchTrends(searchHistory) {
    const trends = {};
    searchHistory.forEach(search => {
        const date = new Date(search.searchDate).toISOString().split('T')[0];
        trends[date] = (trends[date] || 0) + 1;
    });

    return Object.keys(trends)
        .sort()
        .slice(-30) // Last 30 days
        .map(date => ({
            date,
            count: trends[date]
        }));
}

function calculatePopularZones(searchHistory) {
    const zoneCounts = {};
    searchHistory.forEach(search => {
        if (search.selectedArea) {
            zoneCounts[search.selectedArea] = (zoneCounts[search.selectedArea] || 0) + 1;
        }
    });

    return Object.keys(zoneCounts)
        .map(zone => ({
            zone,
            count: zoneCounts[zone]
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}

function calculateBudgetTrends(searchHistory) {
    return searchHistory
        .filter(search => search.budget)
        .slice(-10) // Last 10 searches
        .map((search, index) => ({
            search: index + 1,
            budget: search.budget
        }));
}

// ===============================
// 📈 AI Price Forecast API
// ===============================
router.post('/forecast-prices', async (req, res) => {
    try {
        const { area } = req.body;

        if (!area) {
            return res.status(400).json({ success: false, error: "Missing 'area' field in request." });
        }

        console.log(`🔍 Requesting forecast for: ${area}`);

        // Call the Python AI service
        const response = await axios.post('http://127.0.0.1:5001/forecast', { area });

        if (!response.data || response.data.error) {
            return res.status(500).json({
                success: false,
                error: response.data.error || 'Forecast service returned an error'
            });
        }

        console.log(`✅ Forecast received for ${area}, ${response.data.length} records`);
        res.json({ success: true, area, forecast: response.data });

    } catch (error) {
        console.error('❌ Forecast API error:', error.message);
        if (error.response) {
            console.error('Python service error:', error.response.data);
        }

        res.status(500).json({
            success: false,
            error: 'Failed to fetch forecast data from AI service'
        });
    }
});


module.exports = router;