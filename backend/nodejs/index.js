const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'capstone_user',
    password: process.env.DB_PASSWORD || 'capstone123',
    database: process.env.DB_NAME || 'capstone_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

// Initialize database pool
async function initDB() {
    pool = mysql.createPool(dbConfig);
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        backend: 'Node.js',
        timestamp: new Date().toISOString()
    });
});

// Get all users
app.get('/users', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, name, email, created_at FROM users ORDER BY id DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create user
app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    
    try {
        const [result] = await pool.query(
            'INSERT INTO users (name, email, created_at) VALUES (?, ?, NOW())',
            [name, email]
        );
        
        res.status(201).json({
            id: result.insertId,
            name,
            email,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'Email already exists' });
        } else {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Delete user
app.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, async () => {
    await initDB();
    console.log(`Node.js server running on port ${PORT}`);
});
