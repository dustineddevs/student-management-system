
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const pool = require('./config/db');
const studentRoutes = require('./routes/studentRoutes');

app.use(cors());
app.use(express.json());

// API home
app.get('/', (req, res) => {
    res.json({
        message: 'Student Management API is running!'
    });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');

        res.json({
            success: true,
            message: 'Connected to Supabase PostgreSQL!',
            time: result.rows[0].now
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Database connection failed.'
        });
    }
});

// Student CRUD routes
app.use('/api/students', studentRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
