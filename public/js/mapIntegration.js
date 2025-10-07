/**
 * NestNav Map Integration Module
 * Google Maps integration for neighborhood visualization
 */

class NestNavMapIntegration {
    constructor() {
        this.map = null;
        this.markers = [];
        this.infoWindows = [];
        this.directionsService = null;
        this.directionsRenderer = null;
        this.geocoder = null;
        this.heatmap = null;
        this.userLocation = null;
        this.workLocation = null;

        // Chennai center coordinates
        this.chennaiCenter = { lat: 13.0827, lng: 80.2707 };

        // Map styles
        this.mapStyles = {
            default: [],
            silver: [
                {
                    elementType: "geometry",
                    stylers: [{ color: "#f5f5f5" }]
                },
                {
                    elementType: "labels.icon",
                    stylers: [{ visibility: "off" }]
                },
                {
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#616161" }]
                }
            ]
        };

        // Marker icons
        this.markerIcons = {
            recommended: {
                url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="%2322C55E" stroke="white" stroke-width="3"/><text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">★</text></svg>',
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16)
            },
            alternative: {
                url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" fill="%23F59E0B" stroke="white" stroke-width="2"/><text x="14" y="18" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">○</text></svg>',
                scaledSize: new google.maps.Size(28, 28),
                anchor: new google.maps.Point(14, 14)
            },
            user: {
                url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="%233B82F6" stroke="white" stroke-width="3"/></svg>',
                scaledSize: new google.maps.Size(24, 24),
                anchor: new google.maps.Point(12, 12)
            },
            work: {
                url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><rect x="5" y="8" width="20" height="14" rx="2" fill="%23EF4444" stroke="white" stroke-width="2"/><rect x="8" y="11" width="4" height="3" fill="white"/><rect x="13" y="11" width="4" height="3" fill="white"/><rect x="18" y="11" width="4" height="3" fill="white"/></svg>',
                scaledSize: new google.maps.Size(30, 30),
                anchor: new google.maps.Point(15, 15)
            }
        };
    }

    /**
     * Initialize Google Maps
     */
    async initializeMap(containerId, options = {}) {
        const defaultOptions = {
            center: this.chennaiCenter,
            zoom: 11,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            styles: this.mapStyles.default
        };

        const mapOptions = { ...defaultOptions, ...options };
        const mapContainer = document.getElementById(containerId);

        if (!mapContainer) {
            throw new Error(`Map container with ID '${containerId}' not found`);
        }

        try {
            this.map = new google.maps.Map(mapContainer, mapOptions);
            this.directionsService = new google.maps.DirectionsService();
            this.directionsRenderer = new google.maps.DirectionsRenderer({
                suppressMarkers: true,
                polylineOptions: {
                    strokeColor: '#3B82F6',
                    strokeWeight: 4,
                    strokeOpacity: 0.8
                }
            });
            this.directionsRenderer.setMap(this.map);
            this.geocoder = new google.maps.Geocoder();

            // Add map event listeners
            this.addMapEventListeners();

            console.log('Google Maps initialized successfully');
            return this.map;
        } catch (error) {
            console.error('Failed to initialize Google Maps:', error);
            throw error;
        }
    }

    /**
     * Add event listeners to the map
     */
    addMapEventListeners() {
        // Map click handler
        this.map.addListener('click', (event) => {
            this.handleMapClick(event);
        });

        // Zoom change handler
        this.map.addListener('zoom_changed', () => {
            this.handleZoomChange();
        });

        // Bounds change handler
        this.map.addListener('bounds_changed', () => {
            this.handleBoundsChange();
        });
    }

    /**
     * Display neighborhoods on the map
     */
    displayNeighborhoods(neighborhoods, preferences = {}) {
        this.clearMarkers();

        neighborhoods.forEach((neighborhood, index) => {
            this.addNeighborhoodMarker(neighborhood, index < 5 ? 'recommended' : 'alternative');
        });

        // Fit map to show all markers
        if (neighborhoods.length > 0) {
            this.fitMapToMarkers();
        }

        // Add legend
        this.addLegend();
    }

    /**
     * Add a neighborhood marker
     */
    addNeighborhoodMarker(neighborhood, type = 'recommended') {
        const position = { lat: neighborhood.lat, lng: neighborhood.lng };
        const icon = this.markerIcons[type];

        const marker = new google.maps.Marker({
            position: position,
            map: this.map,
            title: neighborhood.name,
            icon: icon,
            zIndex: type === 'recommended' ? 1000 : 500,
            animation: google.maps.Animation.DROP
        });

        // Create info window
        const infoWindow = new google.maps.InfoWindow({
            content: this.createInfoWindowContent(neighborhood)
        });

        // Add click listener
        marker.addListener('click', () => {
            this.closeAllInfoWindows();
            infoWindow.open(this.map, marker);

            // Trigger custom event
            window.dispatchEvent(new CustomEvent('neighborhoodMarkerClick', {
                detail: { neighborhood, marker }
            }));
        });

        // Store references
        this.markers.push(marker);
        this.infoWindows.push(infoWindow);

        return marker;
    }

    /**
     * Create info window content
     */
    createInfoWindowContent(neighborhood) {
        const compatibilityScore = neighborhood.compatibilityScore || 0;
        const scoreColor = compatibilityScore >= 80 ? 'success' :
            compatibilityScore >= 60 ? 'warning' : 'danger';

        return `
            <div class="info-window" style="max-width: 300px; font-family: Inter, sans-serif;">
                <div class="info-header mb-2">
                    <h6 class="mb-1 font-weight-bold">${neighborhood.name}</h6>
                    <small class="text-muted">${neighborhood.zone} Chennai</small>
                </div>
                
                <div class="compatibility-score mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="small">Compatibility</span>
                        <span class="badge badge-${scoreColor}">${compatibilityScore}%</span>
                    </div>
                </div>

                <div class="quick-stats row no-gutters mb-2">
                    <div class="col-6">
                        <div class="text-center p-1">
                            <small class="text-muted d-block">Safety</small>
                            <strong>${neighborhood.safetyScore}/10</strong>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="text-center p-1">
                            <small class="text-muted d-block">Connectivity</small>
                            <strong>${neighborhood.connectivityScore}/10</strong>
                        </div>
                    </div>
                </div>

                <div class="rent-info mb-2">
                    <small class="text-muted">Average Rent:</small><br>
                    ${neighborhood.avgRent1BHK ? `<small>1BHK: ₹${neighborhood.avgRent1BHK.toLocaleString()}</small><br>` : ''}
                    ${neighborhood.avgRent2BHK ? `<small>2BHK: ₹${neighborhood.avgRent2BHK.toLocaleString()}</small><br>` : ''}
                    ${neighborhood.avgRent3BHK ? `<small>3BHK: ₹${neighborhood.avgRent3BHK.toLocaleString()}</small>` : ''}
                </div>

                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="showNeighborhoodDetails('${neighborhood.id}')">
                        View Details
                    </button>
                    <button class="btn btn-sm btn-outline-primary ml-1" onclick="showDirections('${neighborhood.lat}', '${neighborhood.lng}')">
                        Directions
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Add user location marker
     */
    addUserLocationMarker(lat, lng, title = 'Your Location') {
        const position = { lat, lng };
        this.userLocation = position;

        const marker = new google.maps.Marker({
            position: position,
            map: this.map,
            title: title,
            icon: this.markerIcons.user,
            zIndex: 1500
        });

        this.markers.push(marker);
        return marker;
    }

    /**
     * Add work location marker
     */
    addWorkLocationMarker(lat, lng, title = 'Work Location') {
        const position = { lat, lng };
        this.workLocation = position;

        const marker = new google.maps.Marker({
            position: position,
            map: this.map,
            title: title,
            icon: this.markerIcons.work,
            zIndex: 1500
        });

        this.markers.push(marker);
        return marker;
    }

    /**
     * Show directions between two points
     */
    async showDirections(fromLat, fromLng, toLat, toLng, travelMode = 'DRIVING') {
        if (!this.directionsService || !this.directionsRenderer) return;

        const origin = { lat: parseFloat(fromLat), lng: parseFloat(fromLng) };
        const destination = { lat: parseFloat(toLat), lng: parseFloat(toLng) };

        const request = {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode[travelMode],
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false
        };

        try {
            const result = await new Promise((resolve, reject) => {
                this.directionsService.route(request, (response, status) => {
                    if (status === 'OK') {
                        resolve(response);
                    } else {
                        reject(new Error(`Directions request failed: ${status}`));
                    }
                });
            });

            this.directionsRenderer.setDirections(result);

            // Extract route info
            const route = result.routes[0];
            const leg = route.legs[0];

            return {
                distance: leg.distance.text,
                duration: leg.duration.text,
                steps: leg.steps
            };
        } catch (error) {
            console.error('Error getting directions:', error);
            throw error;
        }
    }

    /**
     * Geocode address to coordinates
     */
    async geocodeAddress(address) {
        if (!this.geocoder) return null;

        try {
            const result = await new Promise((resolve, reject) => {
                this.geocoder.geocode({ address: address }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        resolve(results[0]);
                    } else {
                        reject(new Error(`Geocoding failed: ${status}`));
                    }
                });
            });

            const location = result.geometry.location;
            return {
                lat: location.lat(),
                lng: location.lng(),
                formattedAddress: result.formatted_address
            };
        } catch (error) {
            console.error('Error geocoding address:', error);
            return null;
        }
    }

    /**
     * Create heatmap for neighborhood scores
     */
    createScoreHeatmap(neighborhoods, scoreType = 'compatibilityScore') {
        if (this.heatmap) {
            this.heatmap.setMap(null);
        }

        const heatmapData = neighborhoods
            .filter(n => n[scoreType] && n.lat && n.lng)
            .map(n => ({
                location: new google.maps.LatLng(n.lat, n.lng),
                weight: n[scoreType] / 100
            }));

        this.heatmap = new google.maps.visualization.HeatmapLayer({
            data: heatmapData,
            map: this.map,
            radius: 50,
            opacity: 0.6
        });

        // Configure heatmap gradient
        const gradient = [
            'rgba(0, 255, 255, 0)',
            'rgba(0, 255, 255, 1)',
            'rgba(0, 191, 255, 1)',
            'rgba(0, 127, 255, 1)',
            'rgba(0, 63, 255, 1)',
            'rgba(0, 0, 255, 1)',
            'rgba(0, 0, 223, 1)',
            'rgba(0, 0, 191, 1)',
            'rgba(0, 0, 159, 1)',
            'rgba(0, 0, 127, 1)',
            'rgba(63, 0, 91, 1)',
            'rgba(127, 0, 63, 1)',
            'rgba(191, 0, 31, 1)',
            'rgba(255, 0, 0, 1)'
        ];

        this.heatmap.set('gradient', gradient);
        return this.heatmap;
    }

    /**
     * Toggle heatmap visibility
     */
    toggleHeatmap(visible = null) {
        if (!this.heatmap) return;

        const currentlyVisible = this.heatmap.getMap() !== null;
        const shouldShow = visible !== null ? visible : !currentlyVisible;

        this.heatmap.setMap(shouldShow ? this.map : null);
        return shouldShow;
    }

    /**
     * Add map controls
     */
    addCustomControls() {
        // Heatmap toggle control
        const heatmapControlDiv = document.createElement('div');
        const heatmapControl = this.createHeatmapControl();
        heatmapControlDiv.appendChild(heatmapControl);

        // Layer control
        const layerControlDiv = document.createElement('div');
        const layerControl = this.createLayerControl();
        layerControlDiv.appendChild(layerControl);

        this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(heatmapControlDiv);
        this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(layerControlDiv);
    }

    /**
     * Create heatmap toggle control
     */
    createHeatmapControl() {
        const controlButton = document.createElement('button');
        controlButton.className = 'btn btn-light btn-sm m-2';
        controlButton.innerHTML = '🔥 Heatmap';
        controlButton.title = 'Toggle compatibility heatmap';

        controlButton.addEventListener('click', () => {
            const isVisible = this.toggleHeatmap();
            controlButton.style.backgroundColor = isVisible ? '#3B82F6' : '#ffffff';
            controlButton.style.color = isVisible ? '#ffffff' : '#000000';
        });

        return controlButton;
    }

    /**
     * Create layer control
     */
    createLayerControl() {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'bg-white p-2 m-2 rounded shadow';
        controlDiv.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="showRecommended" checked>
                <label class="form-check-label small" for="showRecommended">
                    Top Recommendations
                </label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="showAlternative" checked>
                <label class="form-check-label small" for="showAlternative">
                    Alternative Options
                </label>
            </div>
        `;

        // Add event listeners
        controlDiv.querySelector('#showRecommended').addEventListener('change', (e) => {
            this.toggleMarkersByType('recommended', e.target.checked);
        });

        controlDiv.querySelector('#showAlternative').addEventListener('change', (e) => {
            this.toggleMarkersByType('alternative', e.target.checked);
        });

        return controlDiv;
    }

    /**
     * Toggle markers by type
     */
    toggleMarkersByType(type, visible) {
        // Implementation would require tracking marker types
        // This is a placeholder for the functionality
        console.log(`Toggle ${type} markers: ${visible}`);
    }

    /**
     * Add legend to the map
     */
    addLegend() {
        const legend = document.createElement('div');
        legend.className = 'map-legend bg-white p-3 m-2 rounded shadow';
        legend.innerHTML = `
            <h6 class="mb-2">Legend</h6>
            <div class="legend-item d-flex align-items-center mb-1">
                <span class="legend-icon mr-2">★</span>
                <small>Top Recommendations</small>
            </div>
            <div class="legend-item d-flex align-items-center mb-1">
                <span class="legend-icon mr-2">○</span>
                <small>Alternative Options</small>
            </div>
            <div class="legend-item d-flex align-items-center mb-1">
                <span class="legend-icon mr-2">●</span>
                <small>Your Location</small>
            </div>
            <div class="legend-item d-flex align-items-center">
                <span class="legend-icon mr-2">■</span>
                <small>Work Location</small>
            </div>
        `;

        this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);
    }

    /**
     * Utility methods
     */
    clearMarkers() {
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
        this.closeAllInfoWindows();
        this.infoWindows = [];
    }

    closeAllInfoWindows() {
        this.infoWindows.forEach(infoWindow => infoWindow.close());
    }

    fitMapToMarkers() {
        if (this.markers.length === 0) return;

        const bounds = new google.maps.LatLngBounds();
        this.markers.forEach(marker => {
            bounds.extend(marker.getPosition());
        });

        this.map.fitBounds(bounds);

        // Ensure minimum zoom level
        const listener = google.maps.event.addListener(this.map, 'idle', () => {
            if (this.map.getZoom() > 15) {
                this.map.setZoom(15);
            }
            google.maps.event.removeListener(listener);
        });
    }

    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    resolve(location);
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 600000
                }
            );
        });
    }

    centerMapOn(lat, lng, zoom = 13) {
        const position = { lat, lng };
        this.map.setCenter(position);
        this.map.setZoom(zoom);
    }

    /**
     * Event handlers
     */
    handleMapClick(event) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('mapClick', {
            detail: { lat, lng, event }
        }));
    }

    handleZoomChange() {
        const zoom = this.map.getZoom();
        // Adjust marker visibility based on zoom level
        if (zoom < 10) {
            // Hide some markers for better performance
            this.optimizeMarkerDisplay();
        }
    }

    handleBoundsChange() {
        // Lazy load markers in viewport
        this.loadMarkersInBounds();
    }

    optimizeMarkerDisplay() {
        // Implementation for performance optimization
        console.log('Optimizing marker display for current zoom level');
    }

    loadMarkersInBounds() {
        // Implementation for lazy loading markers
        console.log('Loading markers in current bounds');
    }

    /**
     * Advanced features
     */

    /**
     * Create distance matrix for commute analysis
     */
    async calculateDistanceMatrix(origins, destinations, travelMode = 'DRIVING') {
        const service = new google.maps.DistanceMatrixService();

        return new Promise((resolve, reject) => {
            service.getDistanceMatrix({
                origins: origins,
                destinations: destinations,
                travelMode: google.maps.TravelMode[travelMode],
                unitSystem: google.maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false
            }, (response, status) => {
                if (status === 'OK') {
                    resolve(response);
                } else {
                    reject(new Error(`Distance matrix request failed: ${status}`));
                }
            });
        });
    }

    /**
     * Add traffic layer
     */
    addTrafficLayer() {
        const trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(this.map);
        return trafficLayer;
    }

    /**
     * Add transit layer
     */
    addTransitLayer() {
        const transitLayer = new google.maps.TransitLayer();
        transitLayer.setMap(this.map);
        return transitLayer;
    }

    /**
     * Create custom marker cluster
     */
    createMarkerCluster(markers) {
        // Would require MarkerClusterer library
        // This is a placeholder for the functionality
        console.log('Creating marker cluster for', markers.length, 'markers');
    }

    /**
     * Add drawing tools
     */
    addDrawingTools() {
        const drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: google.maps.drawing.OverlayType.MARKER,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [
                    google.maps.drawing.OverlayType.MARKER,
                    google.maps.drawing.OverlayType.CIRCLE,
                    google.maps.drawing.OverlayType.POLYGON
                ]
            }
        });

        drawingManager.setMap(this.map);
        return drawingManager;
    }

    /**
     * Search nearby places
     */
    async searchNearbyPlaces(location, radius = 1000, type = 'restaurant') {
        const service = new google.maps.places.PlacesService(this.map);

        const request = {
            location: location,
            radius: radius,
            type: type
        };

        return new Promise((resolve, reject) => {
            service.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve(results);
                } else {
                    reject(new Error(`Places search failed: ${status}`));
                }
            });
        });
    }

    /**
     * Get place details
     */
    async getPlaceDetails(placeId) {
        const service = new google.maps.places.PlacesService(this.map);

        const request = {
            placeId: placeId,
            fields: ['name', 'rating', 'formatted_phone_number', 'geometry', 'photos']
        };

        return new Promise((resolve, reject) => {
            service.getDetails(request, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve(place);
                } else {
                    reject(new Error(`Place details failed: ${status}`));
                }
            });
        });
    }

    /**
     * Create custom overlay
     */
    createCustomOverlay(position, content, className = 'custom-overlay') {
        const overlay = new google.maps.OverlayView();

        overlay.onAdd = function () {
            const div = document.createElement('div');
            div.className = className;
            div.innerHTML = content;

            const panes = this.getPanes();
            panes.overlayLayer.appendChild(div);

            this.div = div;
        };

        overlay.draw = function () {
            const overlayProjection = this.getProjection();
            const pos = overlayProjection.fromLatLngToDivPixel(position);

            const div = this.div;
            div.style.left = pos.x + 'px';
            div.style.top = pos.y + 'px';
        };

        overlay.onRemove = function () {
            if (this.div) {
                this.div.parentNode.removeChild(this.div);
                this.div = null;
            }
        };

        overlay.setMap(this.map);
        return overlay;
    }

    /**
     * Export map as image
     */
    exportMapAsImage() {
        // This would require a server-side implementation
        // or use of the Static Maps API
        console.log('Export map functionality would be implemented here');
    }

    /**
     * Update map style
     */
    updateMapStyle(styleType = 'default') {
        if (this.mapStyles[styleType]) {
            this.map.setOptions({ styles: this.mapStyles[styleType] });
        }
    }

    /**
     * Cleanup methods
     */
    destroy() {
        this.clearMarkers();

        if (this.heatmap) {
            this.heatmap.setMap(null);
        }

        if (this.directionsRenderer) {
            this.directionsRenderer.setMap(null);
        }

        // Clear all map controls
        for (let i = 0; i < 12; i++) {
            this.map.controls[i].clear();
        }

        this.map = null;
        this.markers = [];
        this.infoWindows = [];
    }
}

// Global functions for info window buttons
window.showNeighborhoodDetails = function (neighborhoodId) {
    window.dispatchEvent(new CustomEvent('showNeighborhoodDetails', {
        detail: { neighborhoodId }
    }));
};

window.showDirections = function (lat, lng) {
    const mapIntegration = window.NestNavMap;
    if (mapIntegration && mapIntegration.userLocation) {
        mapIntegration.showDirections(
            mapIntegration.userLocation.lat,
            mapIntegration.userLocation.lng,
            parseFloat(lat),
            parseFloat(lng)
        ).then(result => {
            console.log('Directions:', result);
            // Update UI with directions info
            window.dispatchEvent(new CustomEvent('directionsCalculated', {
                detail: { directions: result, destination: { lat, lng } }
            }));
        }).catch(error => {
            console.error('Error calculating directions:', error);
        });
    }
};

// Initialize map integration
const nestNavMap = new NestNavMapIntegration();

// Auto-initialize when Google Maps API is loaded
window.initNestNavMap = function () {
    console.log('Google Maps API loaded, NestNav Map Integration ready!');

    // Dispatch custom event to notify other modules
    window.dispatchEvent(new CustomEvent('nestNavMapReady', {
        detail: { mapIntegration: nestNavMap }
    }));
};

// Export for global use
window.NestNavMap = nestNavMap;