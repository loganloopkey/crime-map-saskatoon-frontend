import express from 'express';
import { pool } from './database.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      message: 'Backend is working!', 
      databaseTime: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get data from your Supabase table
app.get('/api/data', async (req, res) => {
  try {
    // Replace 'your_table_name' with your actual table name
    const result = await pool.query('SELECT * FROM SPS_2024 LIMIT 10');
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get map-data (Only UUID, Latitude, Longitude, Type)
app.get('/api/map-data', async(req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5000;

    // "Uuid",      For looking up details on click
    // "Latitude",  For marker position
    // "Longitude", For marker position  
    // "Type"       For marker color/category
    const result = await pool.query(`
      SELECT 
        "Uuid",
        "Latitude",
        "Longitude",
        "Type"
      FROM public.sps_2024 
      WHERE "Latitude" IS NOT NULL 
        AND "Longitude" IS NOT NULL
      ORDER BY "Reported Date" DESC 
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message});
  }
});

// Get single crime details
app.get('/api/crime/:id', async(req, res) => {
  try {
    const {id} = req.params; // Extract UUID from URL

    // Returns entire row for specific crime
    const result = await pool.query(
      'SELECT * FROM public.sps_2024 WHERE "Uuid" = $1',
      [id]
    );

    res.json({
      success: true,
      data: result.rows[0] || null // Return the crime record or null
    });
  } catch (error) {
    res.status(500).json({success: false, error: error.message});
  }
});

// Filter crumes by multiple criteria
app.get('/api/crimes', async (req, res) => {
  try {
    // Extraact Query Params
    // example URL: /api/crimes?type=Theft&neighbourhood=Nutana&limit=100
    const {type, neighbourhood, startDate, endDate, limit = 100} = req.query;

    // Build Query Dynamically
    let query = 'SELECT * FROM public.sps_2024 WHERE 1=1';
    const params = []; // holds params 
    let paramCount = 0; // trach param positions

    // Edd Filters Conditionally
    // If 'type' param exisits, add to query
    if (type) {
      paramCount++; // Move to next param position
      query += ` AND "Type" = $${paramCount}`;
      params.push(type); // Add actual value to params array
    }

    if (neighbourhood) {
      paramCount++; // Move to next param position
      query += ` AND "Neighbourhood" = $${paramCount}`;
      params.push(neighbourhood); // Add actual value to params array
    }

    if (startDate) {
      paramCount++; // Move to next param position
      query += ` AND "Reported Date" >= $${paramCount}`;
      params.push(startDate); // Add actual value to params array
    }

    if (endDate) {
      paramCount++; // Move to next param position
      query += ` AND "Reported Date" <= $${paramCount}`;
      params.push(endDate); // Add actual value to params array
    }

    // Add Sorting and Limit
    query += ` ORDER BY "Reported Date" DESC LIMIT $${paramCount + 1}`;
    params.push(parseInt(limit)); // Add limit as last parameter

    // Execute Query

    // Example: If type="Theft", neighbourhood="Nutana", limit=50
    // Query becomes: SELECT * FROM table WHERE 1=1 AND "Type" = $1 AND "Neighbourhood" = $2 ORDER BY "Reported Date" DESC LIMIT $3
    // Params become: ['Theft', 'Nutana', 50]
    const result = await pool.query(query, params);

    // Return Results
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      filters: { type, neighbourhood, startDate, endDate } // Echo back applied filters
    });

  } catch (error) {
    res.status(500).json({sucess: false, error: error.message});
  }
});

// Get available filter options
app.get('/api/filters', async (req, res) => {
  try {
    const [types, neighbourhoods] = await Promise.all([
      pool.query('SELECT DISTINCT "Type" FROM public.sps_2024 ORDER BY "Type"'),
      pool.query('SELECT DISTINCT "Neighbourhood" FROM public.sps_2024 ORDER BY "Neighbourhood"')
    ]);
    res.json({
      success: true,
      types: types.rows.map(row => row.Type),
      neighbourhoods: neighbourhoods.rows.map(row => row.Neighbourhood)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});