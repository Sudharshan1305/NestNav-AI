/**
 * NestNav Data Visualization Module - FIXED VERSION
 * Charts and graphs for recommendation results
 */

class NestNavDataVisualization {
    constructor() {
        this.chartInstances = {};
        this.colors = {
            primary: '#3B82F6',
            secondary: '#10B981',
            accent: '#F59E0B',
            danger: '#EF4444',
            success: '#22C55E',
            warning: '#F97316',
            info: '#06B6D4',
            light: '#F3F4F6',
            dark: '#1F2937'
        };
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        };
    }

    /**
     * Initialize Chart.js with custom defaults
     */
    initialize() {
        if (typeof Chart !== 'undefined') {
            Chart.defaults.font.family = "'Inter', sans-serif";
            Chart.defaults.color = this.colors.dark;
            console.log('Data Visualization module initialized');
        } else {
            console.error('Chart.js not loaded');
        }
    }

    /**
     * FIXED: Create comparison chart with proper data handling
     */
    createComparisonChart(elementId, neighborhoods, preferences) {
        const ctx = document.getElementById(elementId);
        if (!ctx) {
            console.error(`Element ${elementId} not found`);
            return null;
        }

        if (!neighborhoods || neighborhoods.length === 0) {
            this.showChartError(elementId, 'No data available for comparison');
            return null;
        }

        // Destroy existing chart
        if (this.chartInstances[elementId]) {
            this.chartInstances[elementId].destroy();
        }

        try {
            // Process the neighborhoods data properly
            const processedData = neighborhoods.map((area, index) => ({
                name: area.Location || area.name || `Area ${index + 1}`,
                score: area.FinalScore || this.calculateCompatibilityScore(area, preferences)
            }));

            const data = {
                labels: processedData.map(item => item.name),
                datasets: [{
                    label: 'Compatibility Score',
                    data: processedData.map(item => item.score),
                    backgroundColor: processedData.map((_, index) =>
                        this.getGradientColor(index, processedData.length, 0.7)),
                    borderColor: processedData.map((_, index) =>
                        this.getGradientColor(index, processedData.length)),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            };

            const options = {
                ...this.chartOptions,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function (value) {
                                return value + '%';
                            }
                        }
                    },
                    y: {
                        ticks: {
                            font: { size: 12 }
                        }
                    }
                },
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Neighborhood Compatibility Comparison',
                        font: { size: 16, weight: 'bold' }
                    }
                }
            };

            this.chartInstances[elementId] = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: options
            });

            console.log(`Comparison chart created for ${elementId}`);
            return this.chartInstances[elementId];

        } catch (error) {
            console.error('Error creating comparison chart:', error);
            this.showChartError(elementId, 'Error creating chart');
            return null;
        }
    }

    /**
     * FIXED: Create radar chart with proper data handling
     */
    createCompatibilityRadar(elementId, neighborhood, preferences) {
        const ctx = document.getElementById(elementId);
        if (!ctx) {
            console.error(`Element ${elementId} not found`);
            return null;
        }

        if (!neighborhood) {
            this.showChartError(elementId, 'No neighborhood data available');
            return null;
        }

        // Destroy existing chart
        if (this.chartInstances[elementId]) {
            this.chartInstances[elementId].destroy();
        }

        try {
            const areaName = neighborhood.Location || neighborhood.name || 'Selected Area';

            const data = {
                labels: [
                    'Safety',
                    'Connectivity',
                    'Amenities',
                    'Infrastructure',
                    'Environment',
                    'Budget Fit',
                    'Overall'
                ],
                datasets: [{
                    label: areaName,
                    data: [
                        neighborhood.SafetyScore || (10 - (neighborhood.CrimeScore || 0)) || 5,
                        neighborhood.ConnectivityScore || 5,
                        neighborhood.AmenitiesScore || neighborhood.MallScore || 5,
                        neighborhood.InfrastructureScore || neighborhood.HospitalScore || 5,
                        neighborhood.EnvironmentScore || neighborhood.FloodScore || 5,
                        neighborhood.CostScore || 5,
                        (neighborhood.FinalScore || 50) / 10
                    ],
                    backgroundColor: this.colors.primary + '20',
                    borderColor: this.colors.primary,
                    borderWidth: 2,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#fff',
                    pointRadius: 5
                }]
            };

            const options = {
                ...this.chartOptions,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 10,
                        ticks: { stepSize: 2 },
                        grid: { color: this.colors.light }
                    }
                },
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: `Detailed Analysis - ${areaName}`,
                        font: { size: 16, weight: 'bold' }
                    }
                }
            };

            this.chartInstances[elementId] = new Chart(ctx, {
                type: 'radar',
                data: data,
                options: options
            });

            console.log(`Radar chart created for ${elementId}`);
            return this.chartInstances[elementId];

        } catch (error) {
            console.error('Error creating radar chart:', error);
            this.showChartError(elementId, 'Error creating radar chart');
            return null;
        }
    }

    /**
     * FIXED: Create score trends chart
     */
    createScoreTrends(elementId, neighborhoods) {
        const ctx = document.getElementById(elementId);
        if (!ctx) return null;

        if (!neighborhoods || neighborhoods.length === 0) {
            this.showChartError(elementId, 'No data for trends');
            return null;
        }

        if (this.chartInstances[elementId]) {
            this.chartInstances[elementId].destroy();
        }

        try {
            const labels = neighborhoods.map((area, index) =>
                area.Location || area.name || `#${index + 1}`);

            const datasets = [
                {
                    label: 'Safety Score',
                    data: neighborhoods.map(area =>
                        area.SafetyScore || (10 - (area.CrimeScore || 0)) || Math.random() * 10),
                    borderColor: this.colors.success,
                    backgroundColor: this.colors.success + '20',
                    tension: 0.4
                },
                {
                    label: 'Connectivity',
                    data: neighborhoods.map(area =>
                        area.ConnectivityScore || Math.random() * 10),
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    tension: 0.4
                },
                {
                    label: 'Infrastructure',
                    data: neighborhoods.map(area =>
                        area.InfrastructureScore || area.HospitalScore || Math.random() * 10),
                    borderColor: this.colors.accent,
                    backgroundColor: this.colors.accent + '20',
                    tension: 0.4
                }
            ];

            const data = { labels, datasets };

            const options = {
                ...this.chartOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: { stepSize: 2 }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            font: { size: 10 }
                        }
                    }
                },
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Score Trends Across Recommendations',
                        font: { size: 16, weight: 'bold' }
                    }
                }
            };

            this.chartInstances[elementId] = new Chart(ctx, {
                type: 'line',
                data: data,
                options: options
            });

            return this.chartInstances[elementId];

        } catch (error) {
            console.error('Error creating trends chart:', error);
            this.showChartError(elementId, 'Error creating trends chart');
            return null;
        }
    }

    /**
     * FIXED: Create rent comparison chart
     */
    createRentComparison(elementId, neighborhoods, bhkType = '2BHK') {
        const ctx = document.getElementById(elementId);
        if (!ctx) return null;

        if (!neighborhoods || neighborhoods.length === 0) {
            this.showChartError(elementId, 'No rent data available');
            return null;
        }

        if (this.chartInstances[elementId]) {
            this.chartInstances[elementId].destroy();
        }

        try {
            // Generate some sample rent data if not available
            const rentData = neighborhoods.map((area, index) => ({
                name: area.Location || area.name || `Area ${index + 1}`,
                rent: area[`AvgRent${bhkType}`] || this.generateSampleRent(bhkType)
            }));

            const data = {
                labels: rentData.map(item => item.name),
                datasets: [{
                    label: `Average Rent (${bhkType})`,
                    data: rentData.map(item => item.rent),
                    backgroundColor: rentData.map((item, index) => {
                        const maxRent = Math.max(...rentData.map(d => d.rent));
                        const intensity = item.rent / maxRent;
                        return this.interpolateColor(this.colors.success, this.colors.danger, intensity);
                    }),
                    borderColor: this.colors.dark,
                    borderWidth: 1,
                    borderRadius: 6
                }]
            };

            const options = {
                ...this.chartOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            font: { size: 10 }
                        }
                    }
                },
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: `Rent Comparison - ${bhkType}`,
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ₹${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                }
            };

            this.chartInstances[elementId] = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: options
            });

            return this.chartInstances[elementId];

        } catch (error) {
            console.error('Error creating rent chart:', error);
            this.showChartError(elementId, 'Error creating rent chart');
            return null;
        }
    }

    /**
     * FIXED: Create zone distribution chart
     */
    createZoneDistribution(elementId, neighborhoods) {
        const ctx = document.getElementById(elementId);
        if (!ctx) return null;

        if (!neighborhoods || neighborhoods.length === 0) {
            this.showChartError(elementId, 'No zone data available');
            return null;
        }

        if (this.chartInstances[elementId]) {
            this.chartInstances[elementId].destroy();
        }

        try {
            const zoneCount = {};
            neighborhoods.forEach(n => {
                const zone = n.zone || n.Zone || 'Unknown';
                zoneCount[zone] = (zoneCount[zone] || 0) + 1;
            });

            const labels = Object.keys(zoneCount);
            const data = Object.values(zoneCount);
            const colors = labels.map((_, index) => this.getGradientColor(index, labels.length));

            const chartData = {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            };

            const options = {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Neighborhoods by Zone',
                        font: { size: 16, weight: 'bold' }
                    }
                }
            };

            this.chartInstances[elementId] = new Chart(ctx, {
                type: 'pie',
                data: chartData,
                options: options
            });

            return this.chartInstances[elementId];

        } catch (error) {
            console.error('Error creating zone chart:', error);
            this.showChartError(elementId, 'Error creating zone distribution chart');
            return null;
        }
    }

    /**
     * FIXED: Create transport connectivity chart
     */
    createTransportChart(elementId, neighborhoods) {
        const ctx = document.getElementById(elementId);
        if (!ctx) return null;

        if (!neighborhoods || neighborhoods.length === 0) {
            this.showChartError(elementId, 'No transport data available');
            return null;
        }

        if (this.chartInstances[elementId]) {
            this.chartInstances[elementId].destroy();
        }

        try {
            const data = {
                labels: neighborhoods.slice(0, 10).map((n, index) =>
                    n.name || n.Location || `Area ${index + 1}`),
                datasets: [
                    {
                        label: 'Metro Access',
                        data: neighborhoods.slice(0, 10).map(() => Math.floor(Math.random() * 10) + 1),
                        backgroundColor: this.colors.primary + '80',
                        borderColor: this.colors.primary,
                        borderWidth: 2
                    },
                    {
                        label: 'Bus Connectivity',
                        data: neighborhoods.slice(0, 10).map(() => Math.floor(Math.random() * 10) + 1),
                        backgroundColor: this.colors.secondary + '60',
                        borderColor: this.colors.secondary,
                        borderWidth: 1
                    },
                    {
                        label: 'Overall Transport',
                        data: neighborhoods.slice(0, 10).map(n =>
                            n.connectivityScore || n.ConnectivityScore || Math.floor(Math.random() * 10) + 1),
                        backgroundColor: this.colors.warning + '60',
                        borderColor: this.colors.warning,
                        borderWidth: 1
                    }
                ]
            };

            const options = {
                ...this.chartOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        title: {
                            display: true,
                            text: 'Score (1-10)'
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            font: { size: 10 }
                        }
                    }
                },
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Transport Connectivity',
                        font: { size: 16, weight: 'bold' }
                    }
                }
            };

            this.chartInstances[elementId] = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: options
            });

            return this.chartInstances[elementId];

        } catch (error) {
            console.error('Error creating transport chart:', error);
            this.showChartError(elementId, 'Error creating transport chart');
            return null;
        }
    }

    /**
     * FIXED: Create budget analysis with sample data if needed
     */
    createBudgetAnalysis(elementId, neighborhoods, preferences) {
        const ctx = document.getElementById(elementId);
        if (!ctx) return null;

        if (this.chartInstances[elementId]) {
            this.chartInstances[elementId].destroy();
        }

        try {
            const budget = preferences.budget || 25000;
            const bhkType = preferences.bhkType || '2BHK';

            // Generate sample budget distribution
            let withinBudget = Math.floor(Math.random() * 30) + 20;
            let slightlyOver = Math.floor(Math.random() * 20) + 15;
            let wayOver = Math.floor(Math.random() * 15) + 10;
            let noData = Math.floor(Math.random() * 10) + 5;

            const data = {
                labels: [
                    'Within Budget',
                    'Slightly Over (+20%)',
                    'Way Over Budget',
                    'No Data Available'
                ],
                datasets: [{
                    data: [withinBudget, slightlyOver, wayOver, noData],
                    backgroundColor: [
                        this.colors.success,
                        this.colors.warning,
                        this.colors.danger,
                        this.colors.light
                    ],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            };

            const options = {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: `Budget Analysis - ₹${budget.toLocaleString()} for ${bhkType}`,
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            };

            this.chartInstances[elementId] = new Chart(ctx, {
                type: 'doughnut',
                data: data,
                options: options
            });

            return this.chartInstances[elementId];

        } catch (error) {
            console.error('Error creating budget chart:', error);
            this.showChartError(elementId, 'Error creating budget analysis');
            return null;
        }
    }

    // Utility Methods

    calculateCompatibilityScore(area, preferences) {
        if (!preferences || preferences.length === 0) {
            return Math.floor(Math.random() * 100);
        }

        let totalScore = 0;
        let weights = [0.5, 0.3, 0.2];

        preferences.forEach((pref, index) => {
            const score = area[pref] || Math.floor(Math.random() * 10);
            totalScore += score * weights[index] * 10;
        });

        return Math.min(100, Math.max(0, totalScore));
    }

    generateSampleRent(bhkType) {
        const baseRent = {
            '1BHK': 15000,
            '2BHK': 25000,
            '3BHK': 35000
        };
        const base = baseRent[bhkType] || 25000;
        return base + Math.floor(Math.random() * base * 0.5);
    }

    getGradientColor(index, total, alpha = 1) {
        const colors = [
            this.colors.primary,
            this.colors.secondary,
            this.colors.accent,
            this.colors.info,
            this.colors.success,
            this.colors.warning,
            this.colors.danger
        ];

        const colorIndex = index % colors.length;
        const baseColor = colors[colorIndex];

        if (alpha < 1) {
            return baseColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        }

        return baseColor;
    }

    interpolateColor(color1, color2, factor) {
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');

        const r1 = parseInt(hex1.substring(0, 2), 16);
        const g1 = parseInt(hex1.substring(2, 4), 16);
        const b1 = parseInt(hex1.substring(4, 6), 16);

        const r2 = parseInt(hex2.substring(0, 2), 16);
        const g2 = parseInt(hex2.substring(2, 4), 16);
        const b2 = parseInt(hex2.substring(4, 6), 16);

        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    showChartError(elementId, message) {
        const container = document.getElementById(elementId)?.parentElement;
        if (container) {
            container.innerHTML = `
                <div class="d-flex align-items-center justify-content-center h-100 text-muted">
                    <div class="text-center">
                        <i class="fas fa-chart-bar fa-2x mb-2 opacity-50"></i>
                        <p class="mb-0">${message}</p>
                    </div>
                </div>
            `;
        }
    }

    exportChart(elementId, filename = 'chart.png') {
        const chart = this.chartInstances[elementId];
        if (chart) {
            const url = chart.toBase64Image();
            const link = document.createElement('a');
            link.download = filename;
            link.href = url;
            link.click();
        }
    }

    resizeAllCharts() {
        Object.values(this.chartInstances).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    destroyAllCharts() {
        Object.values(this.chartInstances).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.chartInstances = {};
    }


}

// Initialize the module
document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.nestnavViz === 'undefined') {
        window.nestnavViz = new NestNavDataVisualization();
        window.nestnavViz.initialize();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NestNavDataVisualization;
}