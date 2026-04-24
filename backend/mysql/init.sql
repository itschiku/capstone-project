-- Create database if not exists
CREATE DATABASE IF NOT EXISTS capstone_db;
USE capstone_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT IGNORE INTO users (name, email) VALUES 
('Demo User 1', 'demo1@example.com'),
('Demo User 2', 'demo2@example.com');
