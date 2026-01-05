# Crime Data Visualization Project
A full-stack web application for visualizing crime data on an interactive map.

### Prerequisites
- Node.js (v16 or higher)
- Git

### Setup Instructions
#### Environment Setup / Database config
1. Copy `.env.example` to `.env`
2. Get the actual DATABASE_URL from Alan `DATABASE_URL=postgresql://postgres.vctwkckypyipfvifkfxy:nqfJXPW83GOdT89l@aws-1-ca-central-1.pooler.supabase.com:6543/postgres`
3. Add Resend API Key: Get RESEND_API_KEY from Alan for email functionality `RESEND_API_KEY=re_Lwz2h5dT_4qmXEGPA5XsER5pZwgzvMbg2`
4. Replace the placeholder in your `.env` file with the real connection string

#### Install Dependencies
```bash
# Backend dependencies
cd server
npm install
npm install resend

# Frontend dependencies
cd ../client
npm install
```

#### Start the Application:
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
##### View the Application:
- Open your browser to: http://localhost:5000
- The full application will be served from the backend port

## Project Structure
```bash
CMPT370_Group12/
├── client/                 # Frontend application
│   ├── src/
│   └── package.json
├── css/                    # css stylesheet
├── js/                     # Scripts (Most individual features are here)
├── server/                 # Backend API server
│   ├── src/
│   │   ├── routes/
│   │   │   └── newsletter.js # API endpoints for newsletter calls
│   │   ├── services/
│   │   │   └── emailService.js # Handles sending emails via Resend API key
│   │   ├── app.js          # database API endpoints
│   │   └── database.js     # database connection
│   └── package.json
├── .env.example           # Environment variables template
├── map_with_pin_leaflet.html # Map page
├── subscribe.html         # Subscription page
├── unsubscribe.html       # Unsubscribe page
└── README.md
```

## Email Subscription System
- Subscribe/Unsubscribe: Users can subscribe to weekly crime statistics newsletters
- Email Delivery: Integrated with Resend API for email sending
- Dynamic Content: Newsletters include crime trends and statistics
- ***Note: Currently sends to a single test email address. Domain integration pending for production.***

## Newsletter Features
- Weekly crime statistics summaries
- Biggest crime increases/decreases by area
- Dynamic date ranges based on latest crime data
- Both HTML and plain text email formats


## API Endpoints
#### Base URL: https://cmpt370-crimemaps-forked.onrender.com/
| Endpoint | Method | Description | Example |
|---|---|---|---|
| `/api/data/latest-date`   | GET | Get most recent crime date from database | `GET /api/data/latest-date` |
| `/api/data`               | GET | Get sample data from Supabase table (10 records) | `GET /api/data` |
| `/api/map-data`           | GET | Get optimized map data (UUID, Lat, Lng, Type only) | `GET /api/map-data?limit=2000` |
| `/api/crime/:id`          | GET | Get single crime details by UUID | `GET /api/crime/fb363318-e145-494e-b7fb-a4185bb8ac48` |
| `/api/crimes`             | GET | Filter crimes by type, neighbourhood, date range | `GET /api/crimes?type=Theft&neighbourhood=Nutana&startDate=2024-06-01&limit=100` |
| `/api/filters`            | GET | Get available filter options (types & neighbourhoods) | `GET /api/filters` |
| `/api/map-data/location`  | GET | Get map data filtered by location proximity | `GET /api/map-data/location?lat=52.13&lng=-106.67&radius=500` |
| `/api/crimes/nearby`      | GET | Get nearby crimes using Haversine formula | `GET /api/crimes/nearby?lat=52.13&lng=-106.67&radius=500&since=2024-01-01&limit=200` |
| `/api/crimes/bounds`      | GET | Get crimes within map bounds and time range | `GET /api/crimes/bounds?neLat=52.14&neLng=-106.65&swLat=52.12&swLng=-106.69&since=2024-01-01&limit=500` |
| `/api/personal_incidents` | GET | Get user-reported personal incidents | `GET /api/personal_incidents` |
| `/api/personal_incidents` | POST | Submit new personal incident report | `POST /api/personal_incidents` with JSON body |
| `/api/subscribe`	        | POST | Subscribe to crime statistics newsletter	| `POST /api/subscribe` with email and area |
| `/api/unsubscribe`	    | POST | Unsubscribe from newsletter	            | `POST /api/unsubscribe` with email |
| `/api/newsletter`	        | GET | Send weekly newsletter (admin)	            | `GET /api/newsletter` |

## Data Structure
### Crime Record Fields:
- `Uuid`: Unique identifier (use for detail lookups)
- `ReportedDate`: When crime was reported
- `Type`: Crime category (Theft, Assault, Fraud, etc.)
- `Location`: Street address
- `Neighbourhood`: Area of city
- `Latitude`, `Longitude`: Map coordinates

### Subscription Fields:
- `email`: Subscriber's email address
- `area`: Preferred neighborhood for crime updates
- `subscribed`: Subscription status

## Notes for TAs
- *Database*: Hosted on Supabase
- *Environment*: Only DATABASE_URL environment variable needed
- *Email System*: Currently configured for testing with a single email address. Production domain setup pending.
- *Integration*: Newsletter features fully integrated with main codebase using team's PostgreSQL/Supabase stack
