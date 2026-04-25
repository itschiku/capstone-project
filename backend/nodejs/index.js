const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.NODEJS_PORT || 5000;

app.use(cors({
    origin: process.env.FRONTEND_URL || '*'
}));
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'capstone_user',
    password: process.env.DB_PASSWORD || 'capstone123',
    database: process.env.DB_NAME || 'capstone_db',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10
};

let pool;

async function initDB() {
    pool = mysql.createPool(dbConfig);
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error.message);
    }
}

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        backend: 'Node.js',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

app.get('/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, email, created_at FROM users ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    try {
        const [result] = await pool.query('INSERT INTO users (name, email, created_at) VALUES (?, ?, NOW())', [name, email]);
        res.status(201).json({ id: result.insertId, name, email, created_at: new Date().toISOString() });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'Email already exists' });
        } else {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

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

app.listen(PORT, async () => {
    await initDB();
    console.log(`Node.js server running on port ${PORT}`);
});
