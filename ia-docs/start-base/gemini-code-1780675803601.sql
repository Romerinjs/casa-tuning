-- TABLAS DE CATÁLOGO (Lookups)
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE order_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- Ej: 'RECIBIDO', 'EN_PROCESO'
    description VARCHAR(255)
);

CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE service_catalog (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- TABLAS PRINCIPALES
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    plate VARCHAR(10) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    color VARCHAR(50) NOT NULL,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    brand_id INT NOT NULL REFERENCES brands(id)
);

-- NÚCLEO OPERATIVO
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    status_id INT NOT NULL REFERENCES order_statuses(id),
    mileage VARCHAR(50),
    signature_url VARCHAR(255), -- Aquí se almacena la URL de la firma en R2
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    client_id INT NOT NULL REFERENCES clients(id),
    car_id INT NOT NULL REFERENCES cars(id),
    creator_id INT NOT NULL REFERENCES users(id)
);

-- TABLAS INTERMEDIAS Y DETALLES
CREATE TABLE order_services (
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    service_id INT NOT NULL REFERENCES service_catalog(id),
    PRIMARY KEY (order_id, service_id)
);

CREATE TABLE visual_inspections (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    part_name VARCHAR(100) NOT NULL 
);

CREATE TABLE order_photos (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    r2_url VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- REGISTROS Y NOTIFICACIONES
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id), 
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE order_notifications (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- Ej: 'WHATSAPP', 'EMAIL'
    notification_type VARCHAR(50) NOT NULL, -- Ej: 'RECEPCION', 'LISTO_PARA_ENTREGA'
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ÍNDICES PARA OPTIMIZAR JOINs
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_cars_client_id ON cars(client_id);
CREATE INDEX idx_cars_brand_id ON cars(brand_id);
CREATE INDEX idx_orders_status_id ON orders(status_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_car_id ON orders(car_id);
CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_order_notifications_order_id ON order_notifications(order_id);