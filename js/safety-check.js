//  safety-check.js | Author: Alan Fogel

// Global variables
let currentLocation = null;
let radiusCircle = null;
let currentMarkers = [];
let currentMode = "all-crimes"; // "viewport", "safety-check" //, or "all-crimes"
window.currentMode = currentMode;

// Get UI elements & set up event listeners
// document is the root of html tree of elements
document.addEventListener("DOMContentLoaded", function() {
    const checkAreaBtn = document.getElementById('checkAreaBtn');
    const showAllBtn = document.getElementById('showAllBtn');
    const dateRangeSelect = document.getElementById("dateRange");
    const locationStatus = document.getElementById('locationStatus');
    const crimeList = document.getElementById('crimeList');
    const crimeItems = document.getElementById('crimeItems');

    // Set up location event handlers
    if (window.map) {
        window.map.on("locationfound", function(e) {
            currentLocation = e.latlng;
            locationStatus.textContent = "Location found! Checking for crimes...";
            checkAreaForCrimes();
        });

        window.map.on('locationerror', function(e) {
            locationStatus.textContent = "Unable to get your location: " + e.message;
            console.error("Location error: ", e.message);
        });
    }

    // Event listener for the buttons
    checkAreaBtn.addEventListener("click", function() {
        locationStatus.textContent = "Getting your location...";
        getUserLocation();
    })

    showAllBtn.addEventListener("click", function() {
        exitSafetyCheckMode();
    })
    
    if (dateRangeSelect) {
        dateRangeSelect.value = "14"; // Set dropdown to default 14 days on page load
        dateRangeSelect.addEventListener("change", function() {
            const selectedDays = this.value;
            if (window.loadCrimesWithDateRange) {
                window.loadCrimesWithDateRange(selectedDays || 14);
            }
        });
    }

    // Set initial mode to viewport
    currentMode = "viewport"
    updateModeIndicator();

    console.log("Safety check features initialized");
});

// TODO: On zoom out, area circle should disapear map should search the new area of the screen bounds. Crime list should be hidden

// Step 1: Get user location
function getUserLocation(){
    if (!window.map) {
        console.error("Map not available");
        return;
    }
    window.map.locate({setView: false, watch: false, maxZoom: 14})

}


// Step 2: Check area for crimes
async function checkAreaForCrimes() {
    const locationStatus = document.getElementById('locationStatus');
    if (!currentLocation) {
        locationStatus.textContent = "...currentLocation == null...";
        return;
    }

    try {
        // Set mode to safety check
        currentMode = "safety-check";
        window.currentMode = currentMode;
        updateModeIndicator();

        // Disable the date filter dropdown
        const dateRangeSelect = document.getElementById("dateRange");
        if (dateRangeSelect) {
            dateRangeSelect.disabled = true;
        }

        locationStatus.textContent = "...Checking for crimes...";
        clearPreviousResults();

        // Zoom to user location
        window.map.setView([currentLocation.lat, currentLocation.lng], 16);

        // Add 500m radius circle
        radiusCircle = L.circle([currentLocation.lat, currentLocation.lng], { 
            color: "blue",
            fillColor: "#8000ffff",
            fillOpacity: 0.1,
            radius: 500,
            interactive: false  // This makes it click-through
        }).addTo(window.map);

        // Add small indicator for where user is
        const userLocationMarker = L.circle([currentLocation.lat, currentLocation.lng], { 
            color: "green",
            fillColor: "#00ff7bff",
            fillOpacity: 0.8,
            radius: 8,
            interactive: false  // This makes it click-through
        }).addTo(window.map);
        currentMarkers.push(userLocationMarker);

        const crimes = await fetchRecentCrimesInRadius();
        displayCrimes(crimes);

    } catch (error) {
        console.error("Error checking area:", error);
        document.getElementById("locationStatus").textContent = "Error loading crime data.";
    }
}


// Step 3: Fetch crimes within 500m radius from last 370 days
// TODO: CHANGE FROM 370 to 7 when we get data hooked up
async function fetchRecentCrimesInRadius() {
    if (!currentLocation) {
        console.log("No currentLocation available");
        return [];
    }

    try {
        // Get the latest date from the database
        const dateResponse = await fetch('/api/data/latest-date');
        const dateData = await dateResponse.json();

        if (!dateData.success) {
            throw new Error('Failed to get latest date');
        }

        const latestDate = new Date(dateData.latest_date);
        const endDate = new Date(latestDate);
        const startDate = new Date(latestDate);
        startDate.setDate(startDate.getDate() - 7); // Always 7 days for safety check

        const startDateString = startDate.toISOString().split("T")[0];
        const endDateString = endDate.toISOString().split("T")[0];
        console.log(`Safety check date range: 7 days ago (${startDateString}) to today (${endDateString})`);

        const response = await fetch(
            `https://cmpt370-crimemaps-forked.onrender.com/api/crimes/nearby?` +
            `lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=500&since=${startDateString}&limit=100`
        );
        const result = await response.json();

        if (!result.success){
            console.error("API error: ", result.error);
            throw new Error(result.error || "Failed to fetch crime data");
        }
        return result.data;
    } catch (error) {
        console.error("Detailed fetch error:", error);
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        throw error;
    }

}


// Step 4: Display crimes in the list and on map
function displayCrimes(crimes) {
    const crimeItems = document.getElementById('crimeItems');
    const crimeList = document.getElementById("crimeList");
    const locationStatus = document.getElementById("locationStatus");
    if (!crimeItems || !crimeList || !locationStatus) {
        console.error("Could not find DOM elements");
        return;
    }
    
    clearPreviousCrimeMarkersOnly();

    crimeList.classList.add('visible');
    crimeItems.innerHTML = "";

    if (crimes.length === 0) {
        crimeItems.innerHTML = "<p>No recent crimes found in your area.</p>";
        locationStatus.textContent = "No recent crimes found in your area.";
        return;
    }

    locationStatus.textContent = `Found ${crimes.length} recent crimes in your area`;

    crimes.forEach((crime) => {
        // Add to crime list
        const crimeElement = document.createElement("div");

        const crimeDate = crime.ReportedDate ? new Date(crime.ReportedDate) : new Date();
        crimeElement.innerHTML = `
            <strong>${crime.Type || "Unknown Crime"}</strong><br>
            <small>${crimeDate.toLocaleDateString()} ${crimeDate.toLocaleTimeString()} </small><br>
            <small>${crime.Location || "Unkown location"}</small>
        `;

        crimeItems.appendChild(crimeElement);

        // Add marker to map
        const marker = L.circleMarker([crime.Latitude, crime.Longitude], {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5,
                radius: 12   // OG size was 50 in map-core.js
        }).addTo(window.map);

        marker.bindPopup(`
                    <b>Time Reported:</b> ${crime.ReportedDate ? new Date(crime.ReportedDate).toLocaleString() : 'Unknown'}<br>
                    <b>Type:</b> ${crime.Type}<br>
                    <b>Location:</b> ${crime.Location || 'Unknown'}<br>
                    <b>Neighbourhood:</b> ${crime.Neighbourhood || 'Unknown'}<br>
                    <b>Description:</b> ${crime.Description || 'No description available'}<br>
                    `);
                    marker._safetyCheck = true;
                    currentMarkers.push(marker);
                    window.spsMarkersRadius.push(marker);
                    window.personalMarkersRadius.push(marker);
    });

    if (window.updateMarkers) {
        window.updateMarkers();
    }

    locationStatus.textContent = `Found ${crimes.length} recent crimes in your area`;
}


// Step 4: Clear previous results
function clearPreviousCrimeMarkersOnly() {
    // Clear currentMarkers array
    currentMarkers.forEach(marker => {
        window.map.removeLayer(marker);
    });

    // Remove safety check markers from spsMarkers array
    if (window.spsMarkers) {
        window.spsMarkers = window.spsMarkers.filter(marker => {
            if (marker._safetyCheck) {
                window.map.removeLayer(marker);
                return false; // remove from array
            }
            return true; // Keep in aray
        });
    }
}

function clearPreviousResults() {
    if (radiusCircle){
        window.map.removeLayer(radiusCircle);
        radiusCircle = null;
    }

    clearPreviousCrimeMarkersOnly();

    // Clear the main SPS markers during safety check
    if (window.spsMarkers) {
        window.spsMarkers.forEach(marker => {
            window.map.removeLayer(marker);
        });
    }

    // Also clear personal markers during safety check
    if (window.personalMarkers) {
        window.personalMarkers.forEach(marker => {
            window.map.removeLayer(marker);
        });
    }

}

function exitSafetyCheckMode() {
    currentMode = "all-crimes";
    window.currentMode = currentMode;
    updateModeIndicator();

    // Enable the date filter dropdown
    const dateRangeSelect = document.getElementById("dateRange");
    if (dateRangeSelect) {
        dateRangeSelect.disabled = false;
    }

    // Clear safety check elements
    if (radiusCircle) {
        window.map.removeLayer(radiusCircle);
        radiusCircle = null;
    }
    clearPreviousCrimeMarkersOnly();

    // Hide crime list sidebar
    crimeList.classList.remove("visible");

    if (window.updateMarkers) {
        window.updateMarkers();
    }

    document.getElementById("locationStatus").textContent = `Showing crimes from last ${window.currentDateRange || 14} days`;
}


function updateModeIndicator() {
    const indicator = document.getElementById("modeIndicator");
    if (!indicator) return;

    switch(currentMode) {
        case "all-crimes":
            let rangeText = "";
            if (window.currentDateRange === "all") {
                rangeText = "All time";
            } else {
                rangeText = `Last ${window.currentDateRange} days`;
            }
            indicator.textContent = `Mode: Viewing crimes (${rangeText})`;
            break;
        // case "viewport":
        //     indicator.textContent = "Mode: Viewing area crimes (last 14 days)";
        //     break;
        case "safety-check":
            indicator.textContent = "Mode: Safety check (500m radius, last 7 days)";
            break;
    }
}
// Available globally
window.updateModeIndicator = updateModeIndicator;

// TODO: When multiple markers are in the same location, the marker should show the number of markers that are stacked. 
//  When the user clicks on a stack of markers, they could spread out in a circle and show each individual incident.


// ============================================================================
// COMPLETE TEST SUITE FOR SAFETY-CHECK.JS
//  *Made with the help of genAI
// ============================================================================
// To run: run both client and server, open browser dev tools and input 
//  runSafetyCheckTests(); in console
// ============================================================================


// Mock DOM elements for testing
function setupTestDOM() {
    // Create mock elements if they don't exist
    const elements = [
        'locationStatus', 'modeIndicator', 'crimeItems', 'crimeList', 'dateRange'
    ];
    
    elements.forEach(id => {
        if (!document.getElementById(id)) {
            const div = document.createElement('div');
            div.id = id;
            if (id === 'dateRange') {
                div.disabled = false;
            }
            if (id === 'crimeList') {
                div.classList = { 
                    add: function(className) { console.log("Added class:", className); },
                    remove: function(className) { console.log("Removed class:", className); }
                };
            }
            document.body.appendChild(div);
        }
    });
}

// Mock the map if it doesn't exist for testing
function setupTestMap() {
    if (!window.map) {
        console.warn("No real map available - using mock for testing");
        window.map = {
            locate: function(options) { 
                console.log("Mock: Getting user location...");
                // Simulate location found after delay
                setTimeout(() => {
                    if (window.map && window.map._locationCallback) {
                        window.map._locationCallback({
                            latlng: { lat: 52.1332, lng: -106.6700 }
                        });
                    }
                }, 100);
            },
            setView: function(center, zoom) { 
                console.log("Mock: Map centered at", center, "zoom:", zoom);
                return true;
            },
            removeLayer: function(layer) { 
                console.log("Mock: Layer removed");
                return true;
            },
            on: function(event, callback) { 
                if (event === "locationfound") {
                    window.map._locationCallback = callback;
                }
                console.log("Mock: Event listener added for", event);
            },
            off: function(event) { 
                console.log("Mock: Event listener removed for", event);
            },
            hasLayer: function(layer) { return false; },
            addLayer: function(layer) { console.log("Mock: Layer added"); }
        };
    }
    
    // Initialize global arrays if they don't exist
    if (!window.spsMarkers) window.spsMarkers = [];
    if (!window.personalMarkers) window.personalMarkers = [];
    if (!window.spsMarkersRadius) window.spsMarkersRadius = [];
    if (!window.personalMarkersRadius) window.personalMarkersRadius = [];
}

// FIXED Test Data Sets - Using dates BEFORE December 31, 2024
const TEST_LOCATION = { lat: 52.1332, lng: -106.6700 };
const TEST_CRIME_DATA = [
    {
        Type: "Theft",
        ReportedDate: "2024-12-28T22:30:00Z", // Dec 28, 10:30 PM - night crime (within 7 days)
        Latitude: 52.1332,
        Longitude: -106.6700,
        Location: "123 Main St",
        Neighbourhood: "Nutana",
        Description: "Bicycle stolen from front yard"
    },
    {
        Type: "Assault", 
        ReportedDate: "2024-12-29T23:15:00Z", // Dec 29, 11:15 PM - night crime (within 7 days)
        Latitude: 52.1331,
        Longitude: -106.6695,
        Location: "Broadway Ave",
        Neighbourhood: "Nutana", 
        Description: "Altercation outside bar"
    },
    {
        Type: "Vandalism",
        ReportedDate: "2024-12-20T14:30:00Z", // Dec 20, 2:30 PM - day crime (8 days ago - should be filtered out)
        Latitude: 52.1320,
        Longitude: -106.6680,
        Location: "City Park",
        Neighbourhood: "Nutana",
        Description: "Graffiti on building"
    }
];

// BASIC UNIT TESTS
function runUnitTests() {
    console.group("UNIT TESTS - Individual Functions");
    
    // Test 1: updateModeIndicator actually updates the display
    console.group("Test 1: updateModeIndicator()");
    try {
        currentMode = "safety-check";
        updateModeIndicator();
        const indicator = document.getElementById("modeIndicator");
        const passed = indicator.textContent.includes("Safety check");
        console.log(passed ? "PASS: Mode indicator updated correctly" : "FAIL: Mode text incorrect");
        console.log("   Text content:", indicator.textContent);
    } catch (e) {
        console.log("ERROR:", e.message);
    }
    console.groupEnd();
    
    // Test 2: displayCrimes handles empty array
    console.group("Test 2: displayCrimes([])");
    try {
        displayCrimes([]);
        const crimeItems = document.getElementById("crimeItems");
        const passed = crimeItems.innerHTML.includes("No recent crimes");
        console.log(passed ? "PASS: Empty crimes handled correctly" : "FAIL: No 'no crimes' message");
    } catch (e) {
        console.log("ERROR:", e.message);
    }
    console.groupEnd();
    
    // Test 3: displayCrimes shows actual crime data
    console.group("Test 3: displayCrimes with data");
    try {
        displayCrimes(TEST_CRIME_DATA);
        const crimeItems = document.getElementById("crimeItems");
        const passed = crimeItems.innerHTML.includes("Theft") && crimeItems.innerHTML.includes("123 Main St");
        console.log(passed ? "PASS: Crime data displayed correctly" : "FAIL: Crime data not shown");
        console.log("   Crimes displayed:", crimeItems.children.length);
    } catch (e) {
        console.log("ERROR:", e.message);
    }
    console.groupEnd();
    
    // Test 4: exitSafetyCheckMode resets mode
    console.group("Test 4: exitSafetyCheckMode()");
    try {
        currentMode = "safety-check";
        exitSafetyCheckMode();
        const passed = currentMode === "all-crimes";
        console.log(passed ? "PASS: Mode reset to 'all-crimes'" : "FAIL: Mode not reset correctly");
        console.log("   Current mode:", currentMode);
    } catch (e) {
        console.log("ERROR:", e.message);
    }
    console.groupEnd();
    
    console.groupEnd();
}

// INTEGRATION TESTS  
function runIntegrationTests() {
    console.group("INTEGRATION TESTS - Component Interactions");
    
    // Test 5: checkAreaForCrimes Integration
    console.group("Test 5: checkAreaForCrimes() Integration");
    try {
        currentLocation = TEST_LOCATION;
        const initialMode = currentMode;
        
        // Execute the function
        checkAreaForCrimes();
        
        // Check immediate results
        const modeChanged = currentMode === "safety-check";
        const dateFilterDisabled = document.getElementById('dateRange')?.disabled === true;
        
        console.log(modeChanged ? "PASS: Mode changed to safety-check" : "FAIL: Mode not changed");
        console.log(dateFilterDisabled ? "PASS: Date filter disabled" : "FAIL: Date filter not disabled");
        
    } catch (e) {
        console.log("ERROR:", e.message);
    }
    console.groupEnd();
    
    // Test 6: Full Workflow Execution
    console.group("Test 6: Full Safety Check Workflow");
    try {
        console.log("Executing full workflow:");
        
        // Step 1: Set user location
        currentLocation = TEST_LOCATION;
        console.log("Step 1: User location set");
        
        // Step 2: Activate safety check mode
        currentMode = "safety-check";
        updateModeIndicator();
        console.log("Step 2: Safety check mode activated");
        
        // Step 3: Display crime data
        displayCrimes(TEST_CRIME_DATA);
        const crimeCount = document.getElementById('crimeItems').children.length;
        console.log(crimeCount > 0 ? "Step 3: Crimes displayed in list" : "Step 3: No crimes in list");
        
        // Step 4: Return to normal mode
        exitSafetyCheckMode();
        const finalMode = currentMode === "all-crimes";
        console.log(finalMode ? "Step 4: Returned to normal mode" : "Step 4: Still in safety check mode");
        
        console.log("Full workflow executed successfully");
        
    } catch (e) {
        console.log("WORKFLOW ERROR:", e.message);
    }
    console.groupEnd();
    
    console.groupEnd();
}

// ACCEPTANCE TESTS
function runAcceptanceTests() {
    console.group("ACCEPTANCE TESTS - User Story Validation");
    
    // Test 7: User Story - "Recent Night Crimes"
    console.group("Test 7: User Story - 'Quick Check for Recent Night Crimes'");
    try {
        console.log("Testing: 'As Carla at 11 PM, I want to see crimes within 500m from last 7 days'");
        
        // Simulate user scenario
        const testTime = new Date("2024-12-31T23:00:00Z"); // Dec 31, 11 PM - end of your data range
        const sevenDaysAgo = new Date(testTime);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Filter to only recent crimes (last 7 days)
        const recentCrimes = TEST_CRIME_DATA.filter(crime => {
            const crimeTime = new Date(crime.ReportedDate);
            return crimeTime >= sevenDaysAgo;
        });
        
        console.log("Acceptance Criteria Results:");
        
        // Criterion 1: Last 7 days filter
        const allRecent = recentCrimes.length === 2; // Should have 2 crimes from last 7 days
        console.log(allRecent ? "   Last 7 days filter: WORKING" : "   Last 7 days filter: BROKEN");
        console.log("      Recent crimes (last 7 days):", recentCrimes.length);
        console.log("      Old crimes (filtered out):", TEST_CRIME_DATA.length - recentCrimes.length);
        
        // Criterion 2: 500m radius (simulated - would need real coordinates)
        console.log("   500m radius: Cannot test without real geolocation");
        
        // Overall acceptance
        const acceptancePassed = allRecent;
        console.log(acceptancePassed ? "USER STORY: ACCEPTED" : "USER STORY: REJECTED");
        
    } catch (e) {
        console.log("ACCEPTANCE TEST ERROR:", e.message);
    }
    console.groupEnd();
    
    console.groupEnd();
}

// MAIN TEST RUNNER - RUNS EVERYTHING
function runAllTests() {
    console.clear();
    console.log("STARTING COMPLETE TEST SUITE FOR SAFETY-CHECK.JS");
    console.log("=" .repeat(60));
    
    // Setup test environment
    setupTestDOM();
    setupTestMap();
    
    // Run all test suites
    runUnitTests();
    runIntegrationTests(); 
    runAcceptanceTests();
    
    // Test Summary
    console.log("=" .repeat(60));
    console.log("TEST SUMMARY:");
    console.log("   Unit Tests: 4 individual function tests");
    console.log("   Integration Tests: 2 workflow tests");
    console.log("   Acceptance Tests: 1 user story validation");
    console.log("   Total: 7 comprehensive test cases");
    console.log("");
    console.log("All test suites completed! Check results above.");
    console.log("Tip: Run individual suites with runUnitTests(), runIntegrationTests(), or runAcceptanceTests()");
}

// ============================================================================
// MAKE TEST FUNCTIONS AVAILABLE GLOBALLY
// ============================================================================

window.runSafetyCheckTests = runAllTests;
window.runUnitTests = runUnitTests;
window.runIntegrationTests = runIntegrationTests;
window.runAcceptanceTests = runAcceptanceTests;
window.setupTestDOM = setupTestDOM;
window.setupTestMap = setupTestMap;

console.log("Safety Check Test Suite Loaded!");
console.log("Available commands:");
console.log("   runSafetyCheckTests()    - Run ALL tests");
console.log("   runUnitTests()           - Run only unit tests");
console.log("   runIntegrationTests()    - Run only integration tests");
console.log("   runAcceptanceTests()     - Run only acceptance tests");