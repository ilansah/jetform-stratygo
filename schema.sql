CREATE TABLE IF NOT EXISTS accreditations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('En Cours', 'Approuvé') DEFAULT 'En Cours',
    
    -- Personal Info
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    
    -- Operational Info
    start_date DATE NOT NULL,
    manager_name VARCHAR(255) NOT NULL,
    team_code VARCHAR(50) NOT NULL,
    manager_email VARCHAR(255) NOT NULL,
    hr_email VARCHAR(255) NOT NULL,
    tshirt_size ENUM('S', 'M', 'L', 'XL', 'XXL') NOT NULL,
    
    -- Files (Store paths)
    id_card_front_path VARCHAR(255),
    id_card_back_path VARCHAR(255),
    photo_path VARCHAR(255),
    
    -- Compliance & Signature
    fiber_test_done BOOLEAN NOT NULL DEFAULT 0,
    proxy_name VARCHAR(255),
    terms_accepted BOOLEAN NOT NULL DEFAULT 0,
    signature_path VARCHAR(255)
);
