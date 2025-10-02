# Crime Data Visualization Project
A full-stack web application for visualizing crime data on an interactive map.

### Prerequisites
- Node.js (v16 or higher)
- Git

### Setup Instructions
#### Environment Setup / Database config
1. Copy `.env.example` to `.env`
2. Get the actual DATABASE_URL from Alan
3. Replace the placeholder in your `.env` file with the real connection string

#### Install Dependencies
```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

#### Start Development Servers:
##### Terminal 1 - Backend:
```bash
cd server
npm run dev
```
##### Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

## API Endpoints
#### Base URL: http://localhost:5000/api

### 1. Map Data (Optimized for Markers)
#### GET `/map-data`
- Returns minimal data for map markers
- Fast loading - use for initial map display
#### Query Parameters:
- `limit` (optional): Number of records (default: 5000)
#### Example:
```js
const response = await fetch('/api/map-data?limit=2000');
const data = await response.json();
// Returns: { Uuid, Latitude, Longitude, Type }
```
or in browser visit:
```
http://localhost:5000/api/map-data?limit=2000
```

### 2. Single Crime Details
#### GET `/crime/:id`
- Returns complete details for a specific crime
- Use when user clicks on a map marker
#### Example:
```js
const response = await fetch('/api/crime/fb363318-e145-494e-b7fb-a4185bb8ac48');
const data = await response.json();
// Returns: Full crime record with all columns
```
or in browser visit:
```
http://localhost:5000/api/crime/fb363318-e145-494e-b7fb-a4185bb8ac48
```

### 3. Filtered Crimes
#### GET `/crimes`
- Returns filtered crime data
- Supports multiple filter combinations
#### Query Parameters:
- `type`: Crime type (e.g., "Fraud", "Assault")
- `neighbourhood`: Specific area
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `limit`: Maximum Number of records (default: 100)
#### Example:
```js
// The 500 most recent assaults
fetch('/api/crimes?type=Assault&limit=500')

// Crimes in Nutana neighbourhood
fetch('/api/crimes?neighbourhood=Nutana')

// Cases of Fraud in Nutana from June 1st till.
fetch('/api/crimes?type=Fraud&neighbourhood=Nutana&startDate=2024-06-01')
```
or in browser visit:
```
http://localhost:5000/api/crimes?type=Fraud&neighbourhood=Nutana&startDate=2024-06-01
```

### 4. Available Filters
#### GET `/filters`
- Returns lists of available filter options
- Use to populate dropdown menus
#### Example:
```js
const response = await fetch('/api/filters');
const data = await response.json();
// Returns: { types: ["Fraud", "Assault", ...], neighbourhoods: ["Nutana", ...] }
```
or in browser visit:
```
http://localhost:5000/api/filters
```

## Data Structure
### Crime Record Fields:
- `Uuid`: Unique identifier (use for detail lookups)
- `Reported Date`: When crime was reported
- `Type`: Crime category (Theft, Assault, Fraud, etc.)
- `Location`: Street address
- `Neighbourhood`: Area of city
- `Latitude`, `Longitude`: Map coordinates


## Development Tips
### Error Handling:
All endpoints return:
```js
{
  success: boolean,
  data: array | object,
  error: string (if success: false)
}
```