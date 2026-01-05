/* Author: Logan Loopkey */
//allows for personal incident markers and sps reported crimes to have different options such as colour and size but stil; use the same logic to add markers for both

/* Author: Logan Loopkey */
function addMarker(lat, lng, options, popupContent){
    //adds circle at desired lat and long and sets its colour options you can change when calling it then adds to window and its popup 
    const marker = L.circle([lat, lng], {
        color: options.color || 'blue',
        fillColor: options.fillColor || options.color || 'blue',
        fillOpacity: options.fillOpacity || 0.5,
        radius: options.radius || 50 
    }).addTo(window.map);

    if(popupContent) marker.bindPopup(popupContent);

    return marker;

}

/* Author: Logan Loopkey */
// gets neighbouthood, creates a turf point when clicked that verifies if the point is within a neighbourhood polygon then it confirms it is within the neighbourhood
function getNeighbourhood(lat, lng) {
    console.log('Checking neighbourhood for lat:', lat, 'lng:', lng);
    console.log('window.neighbourhoods:', window.neighbourhoods);  // Check if this is defined and an array



    // check if neighbourhoods are loading properly
    if(!window.neighbourhoods || !Array.isArray(window.neighbourhoods)){
        console.warn('neighbourhoods data not loaded');
        return 'unknown'
    }

    //creates turf point for checking if lat and long are within the polygon
    const point = turf.point([lng, lat]);
    console.log('Created Turf point:', point);


    // checks if turf point is within the polygon and returns the name of the area which is called text here.
    for(const n of window.neighbourhoods){
        if(turf.booleanPointInPolygon(point, n)){
            return n.properties.text;
        }
    }

    console.log('No match found, returning unknown');

    return 'unknown'
}

/* Author: Logan Loopkey */
// sets up for filtering sps and personal incidents
let filters = {
    personal: true,  // default: show Personal Incidents
    sps: true        // default: show SPS Crime Data
};

/* Author: Logan Loopkey */
// empty list for storing personal markers separate from spsMarkers
window.personalMarkers = [];
window.spsMarkers = [];
window.spsMarkersRadius = [];
window.personalMarkersRadius = [];

/* Author: Logan Loopkey */
// function that takes in the crime data and adds a circle marker to the map for each crime in the data.
function addMarkersToMap(crimeData){
    // makes a circle for each crime in the data and adds it to the map at the latitude and longitude of the crime
    crimeData.forEach(crime => {
        const circle = L.circle([crime.Latitude, crime.Longitude], {color: 'red', radius: 50}).addTo(window.map);

        window.spsMarkers.push(circle);

                
    // adds a click event to each circle that fetches the details of the crime from the api using the crime's uuid
    // if the details are successfully loaded then it binds a popup to the circle with the details
        circle.on('click', () => {
        // fetches the details of the crime from the database using its uuid
            fetch(`https://cmpt370-crimemaps-forked.onrender.com/api/crime/${crime.Uuid}`)
            // if the response is successful then it converts it to json
                .then(response => response.json())
                .then(result => {
                // if the details are successfully loaded then it binds a popup to the circle with the details
                    if(result.success){
                    // gets the data from the response
                        const crimeDetails = result.data;
                    /// binds a popup to the circle with the details of the crime. Matches time reported, type of crime, location, neighbourhood, and description to crime details
                        circle.bindPopup(`
                            <b>Time Reported:</b> ${crimeDetails.ReportedDate ? new Date(crimeDetails.ReportedDate).toLocaleString() : 'Unknown'}<br>
                            <b>Type:</b> ${crimeDetails.Type}<br>
                            <b>Location:</b> ${crimeDetails.Location || 'Unknown'}<br>
                            <b>Neighbourhood:</b> ${crimeDetails.Neighbourhood || 'Unknown'}<br>
                            <b>Description:</b> ${crimeDetails.Description || 'No description available'}<br>

                        `).openPopup();

                    } else {
                    // prints error message to console if details fail to load
                        circle.bindPopup('failed to load crime details').openPopup();                     
                }
            })
            // if there is an error fetching the details then it logs the error to the console and sets the popup content to an error message
                .catch(error => {
                    console.error('Error fetching crime details:', error);
                    circle.setPopupContent('Error loading crime details').openPopup();
                });
        });
    });
}

// fetches the data from the api (url found on git repo readme) if gets a response then converts it to json then if the data was 
// successfully loaded then it calls the addMarkersToMap function with the data otherwise it logs an error to the console
// Have to open up a terminal to run the client server and open another terminal to run the server for the api to work
// fetch('https://cmpt370-crimemaps-forked.onrender.com/api/map-data?limit=2000')
//     .then(response => response.json())
//     .then(data => {
//         // if data is successfully loaded then it calls the addMarkersToMap function with the data
//         if(data.success){
//             addMarkersToMap(data.data);
//         } else {
//             // prints error message to console if data fails to load
//             console.error('Failed to load crime data');
//         }
//     })


// Global var to track date range
window.currentDateRange = 14;
/* Author: Alan Fogel */
async function loadCrimesWithDateRange(days = 14) {
    window.currentDateRange = days;

    window.spsMarkers.forEach(marker => {
        window.map.removeLayer(marker);
    });
    window.spsMarkers = [];

    let apiURL;
    if (days === "all") {
        // Load all crimes without date filter
        apiURL = "/api/map-data?limit=2000";
    } else {
        const daysNum = parseInt(days);
        
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
            startDate.setDate(startDate.getDate() - daysNum);

            const startDateString = startDate.toISOString().split("T")[0];
            const endDateString = endDate.toISOString().split("T")[0];
            console.log(`Date range: ${days} days ago (${startDateString}) to today (${endDateString})`);
            // Use the crimes endpoint with date fitler
            apiURL = `/api/crimes?startDate=${startDateString}&endDate=${endDateString}&limit=2000`;
        } catch (error) {
            console.error('Error getting latest date:', error);
            return;
        }
    }
    
    console.log("Fetching from:", apiURL);

    fetch(apiURL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if(data.success) {
                addMarkersToMap(data.data);
                console.log(`Loaded ${data.data.length} crimes from last ${days} days`);
                if (window.updateModeIndicator) {
                    window.updateModeIndicator();
                }
            } else {
                console.error("Failed to load crime data");
            }
        })
        .catch(error => {
            console.error("Error loading crime data:", error);
        });
    
}
// Make loadCrimeWithDateRange global
window.loadCrimesWithDateRange = loadCrimesWithDateRange;
// Load initial crimes with 14-day filter
loadCrimesWithDateRange(14);

/* Author: Logan Loopkey */
// function to fetch and load personal incidents from api
function loadPersonalIncidents(){
    fetch('https://cmpt370-crimemaps-forked.onrender.com/api/personal_incidents')
    //sets response to json and iterates through each incident if it was successfully fetched and data is in correct array form
    .then((res) => res.json())
    .then((data) => {
        if (data.success && Array.isArray(data.data)){
            data.data.forEach(incident => {
                // creates marker using addMarker method and creates its popup and displays its associated data for when the user clicks the personal incident.
                const marker = addMarker(incident.Latitude, incident.Longitude, {color: 'blue', radius: 125}, `
                    <div class="popup-title"><b>Personal Incident</b></div><br>
                    <b>Reported: </b> ${new Date(incident.ReportedDate).toLocaleString()}<br>
                    <b>Type:</b> ${incident.Type}<br>
                    <b>Neighbourhood:</b> ${incident.Neighbourhood}<br>
                    <b>Description: </b> ${incident.Description}
                    `
                );
                //adds persona markers to window
                window.personalMarkers.push(marker);

                
            });
            //updates markers and logs status and amount of personal incidents and catches if there is an error
            console.log(`Loaded ${data.data.length} personal incidents`);
            updateMarkers();
        } else {
            console.warn("no personal incidents found")
        }
    })
    .catch(err => console.error("erro fetching personal incidents:", err));
}


/* Author: Logan Loopkey */
// initiates status of page to not be in click mode until the user clicks the drop pin button
let isDropPinMode = false;

/* Author: Logan Loopkey */
// function for adding personal incident markers to the map
    function addPersonalMarker(e){
        console.log("Map clicked at ", e.latlng);

        // adds marker using addMarker method with its own parameters to distinguish it between the sps crime. 
        const marker = addMarker(e.latlng.lat, e.latlng.lng, {color: 'blue', radius: 125}, "Personal Marker");

        // form popup that pops up when the user drops the pin. asks user for type of incident and description and then a save button for the user to save
        const formHTML = `
            <form id="incidentForm" style="display: flex; flex-direction: column; gap: 6px; width: 200px;">
            <label><b>Type:</b><br><input type="text" id="incidentType" required></label>
            <label><b>Description:</b><br><textarea id="incidentDesc" rows="5" required></textarea></label>
            <button type="button" id="submitBtn">Save</button>
            </form>
        `;

        //binds the html form to the popup associated with the marker dropped 
        marker.bindPopup(formHTML).openPopup();

        // set a pause in refreshing until users input is submited
        setTimeout(() => {

            const submitBtn = document.getElementById('submitBtn');
            if(!submitBtn) {
                console.error('submit button not found');
                return;
        
            } 
            
            console.log('submit button found');

            // adds event listener for when user clicks button by saving users incident type and description
            submitBtn.addEventListener('click', async (event) => {

                event.preventDefault();
                console.log('submit button clicked');

                submitBtn.disabled = true;
                submitBtn.textContent = 'saving..';

                // users incident type and description held here. can add more here if wanting user to fill out more
                const type = document.getElementById('incidentType').value.trim();
                const desc = document.getElementById('incidentDesc').value.trim();

                //alerts if user is missing a type or description
                if(!type || !desc){
                    alert('please fill in all fields');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'save';
                    return;
                }


                //gets neighbourhood when clicking within a neighbourhood and catches its coordinates
                try {
                    const neighbourhood = getNeighbourhood(e.latlng.lat, e.latlng.lng);

                    //posts personal incident that is placed and saves its lat, long which is hidden to user
                    // saves type of incident, reported date, description, unique id and neighbourhood which is saved
                    // automatically when user clicks within the polygon
                    const res = await fetch('https://cmpt370-crimemaps-forked.onrender.com/api/personal_incidents', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            Latitude: e.latlng.lat,
                            Longitude: e.latlng.lng,
                            Type: type, 
                            ReportedDate: new Date().toISOString(),
                            Description: desc,
                            Uuid: crypto.randomUUID(),
                            Neighbourhood: neighbourhood
                    }),

                });



                // shows saved result to log for testing
                const data = await res.json();
                console.log('save response: ', data);
                
                // adds popup binded to marker and adds its associated information along with it so user can view.
                //pops up when user saves and adds marker to persona lmarkers and updates the markers
                if(data.success){
                    marker.bindPopup(`
                        <b> Personal Incident</b><br>
                        <b>Reported:</b> ${new Date().toLocaleString()}<br>
                        <b> Type:</b> ${type}<br>
                        <b>Neighbourhood:</b> ${neighbourhood}<br>
                        <b> Description:</b> ${desc}
                    `).openPopup();
                    window.personalMarkers.push(marker);
                    updateMarkers();
            
                // handle if failed to save and something was done wrong
                }else{
                    marker.bindPopup('<b> failed to save</b>').openPopup();
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'save';
                }
            //catches error when it is not saved or not saved properly
            } catch(err) {
                console.error('error saving', err);
                marker.bindPopup('failed to save').openPopup();
                submitBtn.disabled = false;
                submitBtn.textContent = 'save';
            }
        });

    }, 100);
}

/* Author: Logan Loopkey */
// sets drop pin button to drop pin when user wants to log a personal incident
const dropPinBtn = document.getElementById('DropPinBtn');
/* Author: Logan Loopkey */
//adds listener and enables click function to drop a pin when clicking drop pin button
if(dropPinBtn) {
    dropPinBtn.addEventListener('click', function () {
        isDropPinMode = !isDropPinMode;
        // changes colour of pin drop button depending on what mode it is in to let the user know
        this.style.backgroundColor = isDropPinMode ? 'lightblue' : '';

        // drops pin when clicked if user clicks drop pin button and is in drop pin mode and adds to personal markers
        if(isDropPinMode){
            window.map.on('click', addPersonalMarker);
            console.log("Drop Pin Mode Enabled");
        } else {
            //disables drop pin mode if not in mode
            window.map.off('click', addPersonalMarker);
            console.log("Drop Pin Mode Disabled");
        }
});

} else { 
    console.error("Drop Pin Button not found!");
}

/* Author: Logan Loopkey */
// adds function to personal checkbox button to update the markers to personal incident or sps crime
// filters between personal incidents and updates markers. 
document.getElementById('personalChkBx').addEventListener('change', function() {
    filters.personal = this.checked;
    updateMarkers();
});

/* Author: Logan Loopkey */
//filters between markers and updates sps markers to be with sps data and updates markers
document.getElementById('spsChkBx').addEventListener('change', function() {
    filters.sps = this.checked;
    updateMarkers();
});


// update marker method for updating markers whether they are personal markers or sps crime markers
function updateMarkers() {
    // Don't update markers if we're in safety check mode | Mode check | Author: Alan Fogel
    if (window.currentMode === "safety-check") {
        window.personalMarkersRadius.forEach(marker => {
            if (filters.personal) {
                if (!window.map.hasLayer(marker)) {
                    window.map.addLayer(marker);
                }
            } else {
                if (window.map.hasLayer(marker)) {
                    window.map.removeLayer(marker);
                }
            }
        });
        window.spsMarkersRadius.forEach(marker => {
            if (filters.sps) {
                if (!window.map.hasLayer(marker)) {
                    window.map.addLayer(marker);
                }
            } else {
                if (window.map.hasLayer(marker)) {
                    window.map.removeLayer(marker);
                }
            }
        });
        return;
    }

    /* Author: Logan Loopkey */
    // Handles personal markers
    window.personalMarkers.forEach(marker => {
        if (filters.personal) {
            if (!window.map.hasLayer(marker)) {
                window.map.addLayer(marker);
            }
        } else {
            if (window.map.hasLayer(marker)) {
                window.map.removeLayer(marker);
            }
        }
    });

    /* Author: Logan Loopkey */
    // handles sps crime markers
    window.spsMarkers.forEach(marker => {
        if (filters.sps) {
            if (!window.map.hasLayer(marker)) {
                window.map.addLayer(marker);
            }
        } else {
            if (window.map.hasLayer(marker)) {
                window.map.removeLayer(marker);
            }
        }
    });
}


// call to load personal incidents
loadPersonalIncidents();


//Test cases for markers.js functions| Author: Logan Loopkey

//Test cases for getNeighbourhood function
console.log(getNeighbourhood(49.2827, -123.1207)); // Expected: "Downtown"
console.log(getNeighbourhood(49.25, -123.1));       // Expected: "Mount Pleasant"
console.log(getNeighbourhood(49.3, -123.2));        // Expected: "unknown"

//Test case for addMarker function
const testMarker = addMarker(49.2827, -123.1207, {color: 'green', radius: 100}, "Test Marker Popup");
testMarker.openPopup();

//Test case for filtering markers
filters.personal = false;
updateMarkers(); // Expected: Personal markers hidden
filters.personal = true;
updateMarkers(); // Expected: Personal markers shown again

//Test case for adding personal marker (manual test required)
isDropPinMode = true;
window.map.on('click', addPersonalMarker); // Click on map to test adding personal marker

//Test case for loading crimes with date range
loadCrimesWithDateRange(7); // Expected: Load crimes from the last 7 days
loadCrimesWithDateRange("all"); // Expected: Load all crimes without date filter 

//Test case for loading personal incidents
loadPersonalIncidents(); // Expected: Load and display personal incidents on the map

//Test case for updating markers based on filters
filters.sps = false;
updateMarkers(); // Expected: SPS crime markers hidden
filters.sps = true;
updateMarkers(); // Expected: SPS crime markers shown again

//Test case for drop pin mode (manual test required)
isDropPinMode = true;
window.map.on('click', addPersonalMarker); // Click on map to test adding personal marker    
isDropPinMode = false;
window.map.off('click', addPersonalMarker); // Expected: Drop pin mode disabled, clicking on map should not add markers  

//Test case for button event listeners (manual test required)
document.getElementById('personalChkBx').click(); // Expected: Toggle personal markers visibility
document.getElementById('spsChkBx').click(); // Expected: Toggle SPS crime markers visibility    

//Test case for updateMarkers function
filters.personal = true;
filters.sps = false;
updateMarkers(); // Expected: Show personal markers, hide SPS crime markers
filters.personal = false;
filters.sps = true;
updateMarkers(); // Expected: Hide personal markers, show SPS crime markers  
filters.personal = true;
filters.sps = true;
updateMarkers(); // Expected: Show both personal and SPS crime markers       

//Test case for loadCrimesWithDateRange function
loadCrimesWithDateRange(30); // Expected: Load crimes from the last 30 days
loadCrimesWithDateRange("all"); // Expected: Load all crimes without date filter 

//Test case for loadPersonalIncidents function
loadPersonalIncidents(); // Expected: Load and display personal incidents on the map 

