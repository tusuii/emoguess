-- Database initialization script for inventory management
-- Simple schema with only 4 fields (focus on DevOps, not data modeling)

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data
INSERT INTO items (name, quantity, price) VALUES
('Laptop', 10, 999.99),
('Mouse', 50, 29.99),
('Keyboard', 30, 79.99)
ON DUPLICATE KEY UPDATE quantity=quantity;
