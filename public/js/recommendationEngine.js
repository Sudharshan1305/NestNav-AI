/**
 * NestNav AI Recommendation Engine
 * Core ML recommendation logic for Chennai neighborhood suggestions
 */

class NestNavRecommendationEngine {
    constructor() {
        this.neighborhoods = [];
        this.userPreferences = {};
        this.weights = {
            budget: 0.25,
            commute: 0.20,
            amenities: 0.15,
            safety: 0.15,
            lifestyle: 0.10,
            connectivity: 0.10,
            environment: 0.05
        };
        this.isInitialized = false;
    }

    /**
     * Initialize the recommendation engine with data
     */
    async initialize() {
        try {
            await this.loadNeighborhoodData();
            await this.loadZoneMapping();
            this.isInitialized = true;
            console.log('Recommendation Engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize recommendation engine:', error);
            throw error;
        }
    }

    /**
     * Load neighborhood data from CSV
     */
    async loadNeighborhoodData() {
        try {
            const response = await fetch('/data/chennai_dataset.csv');
            const csvText = await response.text();
            this.neighborhoods = this.parseCSV(csvText);
        } catch (error) {
            console.error('Error loading neighborhood data:', error);
            // Fallback to sample data
            this.neighborhoods = this.getSampleData();
        }
    }

    /**
     * Load zone mapping configuration
     */
    async loadZoneMapping() {
        try {
            const response = await fetch('/data/zone_mapping.json');
            this.zoneMapping = await response.json();
        } catch (error) {
            console.error('Error loading zone mapping:', error);
            this.zoneMapping = this.getDefaultZoneMapping();
        }
    }

    /**
     * Parse CSV data into structured format
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim() : '';
            });
            data.push(this.processNeighborhoodData(row));
        }

        return data;
    }

    /**
     * Process and normalize neighborhood data
     */
    processNeighborhoodData(row) {
        return {
            id: row.id || Math.random().toString(36).substr(2, 9),
            name: row.name || '',
            zone: row.zone || 'Central',
            lat: parseFloat(row.lat) || 13.0827,
            lng: parseFloat(row.lng) || 80.2707,
            avgRent1BHK: parseFloat(row.avgRent1BHK) || 0,
            avgRent2BHK: parseFloat(row.avgRent2BHK) || 0,
            avgRent3BHK: parseFloat(row.avgRent3BHK) || 0,
            safetyScore: parseFloat(row.safetyScore) || 5,
            connectivityScore: parseFloat(row.connectivityScore) || 5,
            amenitiesScore: parseFloat(row.amenitiesScore) || 5,
            environmentScore: parseFloat(row.environmentScore) || 5,
            lifestyleScore: parseFloat(row.lifestyleScore) || 5,
            commuteTime: parseFloat(row.commuteTime) || 30,
            nearbyPlaces: row.nearbyPlaces ? row.nearbyPlaces.split('|') : [],
            description: row.description || '',
            pros: row.pros ? row.pros.split('|') : [],
            cons: row.cons ? row.cons.split('|') : []
        };
    }

    /**
     * Generate recommendations based on user preferences
     */
    generateRecommendations(preferences) {
        if (!this.isInitialized) {
            throw new Error('Recommendation engine not initialized');
        }

        this.userPreferences = preferences;
        const scoredNeighborhoods = this.neighborhoods.map(neighborhood => {
            const score = this.calculateCompatibilityScore(neighborhood, preferences);
            return {
                ...neighborhood,
                compatibilityScore: score,
                matchReasons: this.getMatchReasons(neighborhood, preferences)
            };
        });

        // Sort by compatibility score
        scoredNeighborhoods.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

        // Return top recommendations with detailed analysis
        return {
            recommendations: scoredNeighborhoods.slice(0, 10),
            analysis: this.generateAnalysis(scoredNeighborhoods, preferences),
            alternativeOptions: scoredNeighborhoods.slice(10, 15)
        };
    }

    /**
     * Calculate compatibility score for a neighborhood
     */
    calculateCompatibilityScore(neighborhood, preferences) {
        let totalScore = 0;

        // Budget compatibility
        const budgetScore = this.calculateBudgetScore(neighborhood, preferences);
        totalScore += budgetScore * this.weights.budget;

        // Commute compatibility
        const commuteScore = this.calculateCommuteScore(neighborhood, preferences);
        totalScore += commuteScore * this.weights.commute;

        // Amenities compatibility
        const amenitiesScore = this.calculateAmenitiesScore(neighborhood, preferences);
        totalScore += amenitiesScore * this.weights.amenities;

        // Safety score
        totalScore += (neighborhood.safetyScore / 10) * this.weights.safety;

        // Lifestyle compatibility
        const lifestyleScore = this.calculateLifestyleScore(neighborhood, preferences);
        totalScore += lifestyleScore * this.weights.lifestyle;

        // Connectivity score
        totalScore += (neighborhood.connectivityScore / 10) * this.weights.connectivity;

        // Environment score
        totalScore += (neighborhood.environmentScore / 10) * this.weights.environment;

        return Math.round(totalScore * 100);
    }

    /**
     * Calculate budget compatibility score
     */
    calculateBudgetScore(neighborhood, preferences) {
        const bhkType = preferences.bhkType || '2BHK';
        const budget = preferences.budget || 25000;

        let rent = 0;
        switch (bhkType) {
            case '1BHK':
                rent = neighborhood.avgRent1BHK;
                break;
            case '2BHK':
                rent = neighborhood.avgRent2BHK;
                break;
            case '3BHK':
                rent = neighborhood.avgRent3BHK;
                break;
            default:
                rent = neighborhood.avgRent2BHK;
        }

        if (rent === 0) return 0.5; // Neutral score if no data

        // Score based on budget fit
        if (rent <= budget * 0.8) return 1.0; // Well within budget
        if (rent <= budget) return 0.8; // Within budget
        if (rent <= budget * 1.2) return 0.4; // Slightly over budget
        return 0.1; // Way over budget
    }

    /**
     * Calculate commute compatibility score
     */
    calculateCommuteScore(neighborhood, preferences) {
        if (!preferences.workLocation) return 0.5;

        const maxCommuteTime = preferences.maxCommuteTime || 45;
        const actualCommuteTime = neighborhood.commuteTime || 30;

        if (actualCommuteTime <= maxCommuteTime * 0.7) return 1.0;
        if (actualCommuteTime <= maxCommuteTime) return 0.8;
        if (actualCommuteTime <= maxCommuteTime * 1.3) return 0.4;
        return 0.1;
    }

    /**
     * Calculate amenities compatibility score
     */
    calculateAmenitiesScore(neighborhood, preferences) {
        const requiredAmenities = preferences.amenities || [];
        if (requiredAmenities.length === 0) return neighborhood.amenitiesScore / 10;

        const availableAmenities = neighborhood.nearbyPlaces || [];
        let matchCount = 0;

        requiredAmenities.forEach(amenity => {
            if (availableAmenities.some(place =>
                place.toLowerCase().includes(amenity.toLowerCase()))) {
                matchCount++;
            }
        });

        const matchRatio = matchCount / requiredAmenities.length;
        const baseScore = neighborhood.amenitiesScore / 10;

        return (matchRatio * 0.7) + (baseScore * 0.3);
    }

    /**
     * Calculate lifestyle compatibility score
     */
    calculateLifestyleScore(neighborhood, preferences) {
        const lifestyle = preferences.lifestyle || 'balanced';
        const baseScore = neighborhood.lifestyleScore / 10;

        // Adjust based on lifestyle preference
        switch (lifestyle) {
            case 'vibrant':
                return neighborhood.zone === 'Central' ? baseScore * 1.2 : baseScore * 0.8;
            case 'peaceful':
                return neighborhood.zone === 'Suburban' ? baseScore * 1.2 : baseScore * 0.8;
            case 'balanced':
            default:
                return baseScore;
        }
    }

    /**
     * Get match reasons for a neighborhood
     */
    getMatchReasons(neighborhood, preferences) {
        const reasons = [];

        // Budget reasons
        const bhkType = preferences.bhkType || '2BHK';
        const budget = preferences.budget || 25000;
        let rent = neighborhood[`avgRent${bhkType}`] || 0;

        if (rent <= budget * 0.9) {
            reasons.push(`Affordable - ₹${rent.toLocaleString()} for ${bhkType}`);
        }

        // Safety reasons
        if (neighborhood.safetyScore >= 8) {
            reasons.push('High safety rating');
        }

        // Connectivity reasons
        if (neighborhood.connectivityScore >= 8) {
            reasons.push('Excellent connectivity');
        }

        // Amenities reasons
        if (neighborhood.amenitiesScore >= 8) {
            reasons.push('Great amenities nearby');
        }

        // Environment reasons
        if (neighborhood.environmentScore >= 8) {
            reasons.push('Clean and green environment');
        }

        return reasons;
    }

    /**
     * Generate detailed analysis
     */
    generateAnalysis(neighborhoods, preferences) {
        const topNeighborhoods = neighborhoods.slice(0, 5);
        const avgScore = topNeighborhoods.reduce((sum, n) => sum + n.compatibilityScore, 0) / 5;

        return {
            averageCompatibility: Math.round(avgScore),
            bestMatch: topNeighborhoods[0],
            budgetAnalysis: this.analyzeBudget(topNeighborhoods, preferences),
            zoneDistribution: this.analyzeZones(topNeighborhoods),
            recommendations: this.generateInsights(topNeighborhoods, preferences)
        };
    }

    /**
     * Analyze budget distribution
     */
    analyzeBudget(neighborhoods, preferences) {
        const bhkType = preferences.bhkType || '2BHK';
        const budget = preferences.budget || 25000;

        const rentKey = `avgRent${bhkType}`;
        const rents = neighborhoods.map(n => n[rentKey]).filter(r => r > 0);

        return {
            averageRent: Math.round(rents.reduce((sum, r) => sum + r, 0) / rents.length),
            minRent: Math.min(...rents),
            maxRent: Math.max(...rents),
            withinBudget: rents.filter(r => r <= budget).length,
            totalOptions: rents.length
        };
    }

    /**
     * Analyze zone distribution
     */
    analyzeZones(neighborhoods) {
        const zoneCount = {};
        neighborhoods.forEach(n => {
            zoneCount[n.zone] = (zoneCount[n.zone] || 0) + 1;
        });
        return zoneCount;
    }

    /**
     * Generate insights and recommendations
     */
    generateInsights(neighborhoods, preferences) {
        const insights = [];

        // Budget insights
        const budget = preferences.budget || 25000;
        const bhkType = preferences.bhkType || '2BHK';
        const rentKey = `avgRent${bhkType}`;

        const affordableCount = neighborhoods.filter(n => n[rentKey] <= budget).length;
        if (affordableCount < 3) {
            insights.push('Consider increasing your budget or looking at smaller BHK options for more choices.');
        }

        // Commute insights
        if (preferences.workLocation) {
            const longCommuteCount = neighborhoods.filter(n => n.commuteTime > 45).length;
            if (longCommuteCount > 3) {
                insights.push('Consider areas closer to your workplace to reduce commute time.');
            }
        }

        // Zone insights
        const centralCount = neighborhoods.filter(n => n.zone === 'Central').length;
        if (centralCount === 0 && preferences.lifestyle === 'vibrant') {
            insights.push('Consider exploring Central Chennai areas for a more vibrant lifestyle.');
        }

        return insights;
    }

    /**
     * Get sample data for fallback
     */
    getSampleData() {
        return [
            {
                id: '1',
                name: 'T. Nagar',
                zone: 'Central',
                lat: 13.0418,
                lng: 80.2341,
                avgRent1BHK: 18000,
                avgRent2BHK: 28000,
                avgRent3BHK: 42000,
                safetyScore: 8,
                connectivityScore: 9,
                amenitiesScore: 9,
                environmentScore: 6,
                lifestyleScore: 9,
                commuteTime: 25,
                nearbyPlaces: ['Metro Station', 'Shopping Mall', 'Hospital', 'School'],
                description: 'Bustling commercial hub with excellent connectivity',
                pros: ['Great shopping', 'Metro connectivity', 'Vibrant lifestyle'],
                cons: ['Traffic congestion', 'Higher rent', 'Noise pollution']
            },
            {
                id: '2',
                name: 'Adyar',
                zone: 'South',
                lat: 13.0067,
                lng: 80.2206,
                avgRent1BHK: 20000,
                avgRent2BHK: 32000,
                avgRent3BHK: 48000,
                safetyScore: 9,
                connectivityScore: 8,
                amenitiesScore: 8,
                environmentScore: 8,
                lifestyleScore: 8,
                commuteTime: 30,
                nearbyPlaces: ['Beach', 'IT Parks', 'Restaurants', 'Cinema'],
                description: 'Upscale residential area near the coast',
                pros: ['Safe neighborhood', 'Beach proximity', 'Good restaurants'],
                cons: ['Expensive', 'Limited public transport', 'Traffic during peak hours']
            }
            // Add more sample data as needed
        ];
    }

    /**
     * Get default zone mapping
     */
    getDefaultZoneMapping() {
        return {
            "Central": {
                "description": "Heart of Chennai with commercial activities",
                "characteristics": ["High connectivity", "Commercial hub", "Dense population"]
            },
            "North": {
                "description": "Industrial and residential mix",
                "characteristics": ["Industrial areas", "Growing residential", "Good transport"]
            },
            "South": {
                "description": "IT corridor and upscale residential",
                "characteristics": ["IT companies", "Premium localities", "Modern infrastructure"]
            },
            "East": {
                "description": "Coastal areas with mix of old and new",
                "characteristics": ["Coastal proximity", "Traditional areas", "Port activities"]
            },
            "West": {
                "description": "Rapidly developing suburban areas",
                "characteristics": ["New developments", "Suburban feel", "Growing infrastructure"]
            }
        };
    }

    /**
     * Update user preferences and recalculate
     */
    updatePreferences(newPreferences) {
        this.userPreferences = { ...this.userPreferences, ...newPreferences };
        return this.generateRecommendations(this.userPreferences);
    }

    /**
     * Get neighborhood details by ID
     */
    getNeighborhoodById(id) {
        return this.neighborhoods.find(n => n.id === id);
    }

    /**
     * Search neighborhoods by name or features
     */
    searchNeighborhoods(query) {
        const lowerQuery = query.toLowerCase();
        return this.neighborhoods.filter(n =>
            n.name.toLowerCase().includes(lowerQuery) ||
            n.zone.toLowerCase().includes(lowerQuery) ||
            n.nearbyPlaces.some(place => place.toLowerCase().includes(lowerQuery))
        );
    }
}

// Initialize global instance
const nestNavEngine = new NestNavRecommendationEngine();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await nestNavEngine.initialize();
        console.log('NestNav Recommendation Engine ready!');

        // Dispatch custom event to notify other modules
        window.dispatchEvent(new CustomEvent('nestNavEngineReady', {
            detail: { engine: nestNavEngine }
        }));
    } catch (error) {
        console.error('Failed to initialize NestNav Engine:', error);
    }
});

// Export for use in other modules
window.NestNavEngine = nestNavEngine;