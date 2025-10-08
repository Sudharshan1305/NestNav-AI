const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Zone mapping
const zoneMap = {
    "Adambakkam": "South", "Adyar": "South", "Alandur": "South", "Alapakkam": "West",
    "Alwarpet": "Central", "Alwarthirunagar": "West", "Ambattur": "West",
    "Aminjikarai": "Central", "Anna Nagar": "Central", "Annanur": "West",
    "Arumbakkam": "Central", "Ashok Nagar": "Central", "Avadi": "West",
    "Ayanavaram": "Central", "Beemannapettai": "North", "Besant Nagar": "South",
    "Basin Bridge": "North", "Chepauk": "Central", "Chetput": "Central",
    "Chintadripet": "Central", "Chitlapakkam": "South", "Choolai": "Central",
    "Choolaimedu": "Central", "Chrompet": "South", "Egmore": "Central",
    "Ekkaduthangal": "South", "Eranavur": "North", "Ennore": "North",
    "Foreshore Estate": "Central", "Fort St. George": "North", "George Town": "North",
    "Gopalapuram": "Central", "Government Estate": "Central", "Guindy": "South",
    "Guduvancheri": "South", "IIT Madras": "South", "Injambakkam": "East Coast",
    "ICF": "Central", "Iyyapanthangal": "West", "Jafferkhanpet": "South",
    "Kadambathur": "West", "Karapakkam": "East Coast", "Kattivakkam": "North",
    "Kattupakkam": "West", "Kazhipattur": "East Coast", "K.K. Nagar": "Central",
    "Keelkattalai": "South", "Kilpauk": "Central", "Kodambakkam": "Central",
    "Kodungaiyur": "North", "Kolathur": "North", "Korattur": "West",
    "Korukkupet": "North", "Kottivakkam": "East Coast", "Kotturpuram": "Central",
    "Kottur": "Central", "Kovur": "West", "Koyambedu": "West",
    "Kundrathur": "West", "Madhavaram": "North", "Madhavaram Milk Colony": "North",
    "Madipakkam": "South", "Madambakkam": "South", "Maduravoyal": "West",
    "Manali": "North", "Manali New Town": "North", "Manapakkam": "West",
    "Mandaveli": "Central", "Mangadu": "West", "Mannadi": "North",
    "Mathur": "North", "Medavakkam": "South", "Meenambakkam": "South",
    "MGR Nagar": "Central", "Minjur": "North", "Mogappair": "West",
    "MKB Nagar": "North", "Mount Road": "Central", "Moolakadai": "North",
    "Moulivakkam": "West", "Mugalivakkam": "West", "Mudichur": "South",
    "Mylapore": "Central", "Nandanam": "Central", "Nanganallur": "South",
    "Nanmangalam": "South", "Neelankarai": "East Coast", "Nemilichery": "South",
    "Nesapakkam": "South", "Nolambur": "West", "Noombal": "West",
    "Nungambakkam": "Central", "Otteri": "Central", "Padi": "West",
    "Pakkam": "West", "Palavakkam": "East Coast", "Pallavaram": "South",
    "Pallikaranai": "South", "Pammal": "South", "Park Town": "Central",
    "Parry's Corner": "North", "Pattabiram": "West", "Pattaravakkam": "West",
    "Pazhavanthangal": "South", "Peerkankaranai": "South", "Perambur": "North",
    "Peravallur": "North", "Perumbakkam": "South", "Perungalathur": "South",
    "Perungudi": "South", "Pozhichalur": "South", "Poonamallee": "West",
    "Porur": "West", "Pudupet": "Central", "Pulianthope": "North",
    "Purasaiwalkam": "Central", "Puthagaram": "North", "Puzhal": "North",
    "Puzhuthivakkam-Ullagaram": "South", "Raj Bhavan": "Institutional",
    "Ramavaram": "West", "Red Hills": "North", "Royapettah": "Central",
    "Royapuram": "North", "Saidapet": "Central", "Saligramam": "Central",
    "Santhome": "Central", "Sembakkam": "South", "Selaiyur": "South",
    "Shenoy Nagar": "Central", "Sholavaram": "North", "Sholinganallur": "East Coast",
    "Sikkarayapuram": "West", "Sowcarpet": "North", "St. Thomas Mount": "South",
    "Surapet": "North", "Tambaram": "South", "Teynampet": "Central",
    "Tharamani": "East Coast", "T. Nagar": "Central", "Thirumangalam": "Central",
    "Thirumullaivoyal": "West", "Thiruneermalai": "South", "Thiruninravur": "West",
    "Thiruvanmiyur": "East Coast", "Thiruvallur": "West", "Tiruverkadu": "West",
    "Thiruvotriyur": "North", "Thuraipakkam": "East Coast", "Tirusulam": "South",
    "Tiruvallikeni": "Central", "Tondiarpet": "North", "United India Colony": "Central",
    "Vandalur": "South", "Vadapalani": "Central", "Valasaravakkam": "West",
    "Vallalar Nagar": "North", "Vanagaram": "West", "Velachery": "South",
    "Velappanchavadi": "West", "Villivakkam": "Central", "Virugambakkam": "Central",
    "Vyasarpadi": "North", "Washermanpet": "North", "West Mambalam": "Central"
};

class LocationModel {
    constructor() {
        this.data = null;
        this.loadData();
    }

    async loadData() {
        const csvPath = path.join(__dirname, '../public/data/updated_dataset.csv');
        this.data = await this.readCSV(csvPath);
    }

    readCSV(filePath) {
        return new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => {
                    // Convert string numbers to actual numbers
                    Object.keys(data).forEach(key => {
                        if (key !== 'Location' && key !== 'FloodRisk' && !isNaN(data[key])) {
                            data[key] = parseFloat(data[key]);
                        }
                    });
                    results.push(data);
                })
                .on('end', () => resolve(results))
                .on('error', reject);
        });
    }

    getAllAreas() {
        if (!this.data) return [];
        return this.data.map(row => row.Location).sort();
    }

    getZoneForArea(area) {
        return zoneMap[area] || null;
    }

    calculateRecommendations(selectedArea, budget, preferences) {
        if (!this.data) return { error: 'Data not loaded' };

        // Add derived scores
        let filteredData = this.data.map(row => ({
            ...row,
            ResidentialScore: 10 - row.FactoryScore,
            SafetyScore: 10 - row.CrimeScore
        }));

        // Budget filter
        if (budget && budget > 0) {
            filteredData = filteredData.filter(row => row.CostScore >= budget);
        }

        // Zone filter
        const desiredZone = zoneMap[selectedArea];
        if (desiredZone) {
            filteredData = filteredData.filter(row => zoneMap[row.Location] === desiredZone);
        }

        // Calculate weights
        const weights = {
            [preferences[0]]: 0.7,
            [preferences[1]]: 0.6,
            [preferences[2]]: 0.5
        };

        // Set default weights for other parameters
        const allParams = ['FloodScore', 'HospitalScore', 'CollegeScore', 'FactoryScore',
            'CrimeScore', 'ConnectivityScore', 'MallScore', 'PowerScore',
            'ServicesScore', 'CostScore', 'ResidentialScore', 'SafetyScore'];

        allParams.forEach(param => {
            if (!weights[param]) weights[param] = 0.4;
        });

        // Calculate final scores
        filteredData.forEach(row => {
            let finalScore = 0;
            Object.keys(weights).forEach(param => {
                if (row[param] !== undefined) {
                    finalScore += row[param] * weights[param];
                }
            });

            // Plot availability bonus
            if (row.AvailablePlots) {
                const avgPlots = filteredData.reduce((sum, r) => sum + (r.AvailablePlots || 0), 0) / filteredData.length;
                finalScore += 0.1 * (row.AvailablePlots - avgPlots);
            }

            row.FinalScore = finalScore;
        });

        // Sort and get top 3
        const sorted = filteredData.sort((a, b) => b.FinalScore - a.FinalScore);
        let top3 = sorted.slice(0, 3);

        // Get selected area data
        const selectedAreaData = filteredData.find(area =>
            area.Location.toLowerCase() === selectedArea.toLowerCase()
        );

        // Guarantee user's selected area appears in Top 3 if it exists in dataset
        let selectedAreaInTop3 = top3.some(area =>
            area.Location.toLowerCase() === selectedArea.toLowerCase()
        );

        if (!selectedAreaInTop3 && selectedAreaData) {
            // Replace the 3rd item if the selected area is reasonably close or regardless per requirement
            top3[2] = selectedAreaData;
            // Re-sort the top3 for display by score desc
            top3 = top3.sort((a, b) => b.FinalScore - a.FinalScore);
            selectedAreaInTop3 = true;
        }

        return {
            top3,
            selectedAreaInTop3,
            selectedAreaData,
            zone: desiredZone,
            totalFilteredAreas: filteredData.length
        };
    }
}

module.exports = new LocationModel();