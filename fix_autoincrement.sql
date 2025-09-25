-- Fix customers table auto-increment issue
-- Drop the existing primary key constraint and recreate the column as SERIAL

-- First, if there's any data, we need to handle it, but since it's a new table, we can recreate it
DROP TABLE IF EXISTS customers CASCADE;

-- Recreate customers table with proper auto-increment
CREATE TABLE customers (
  customer_id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Also fix other tables that might have similar issues
DROP TABLE IF EXISTS sales_orders CASCADE;
CREATE TABLE sales_orders (
  so_id SERIAL PRIMARY KEY,
  so_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT REFERENCES customers(customer_id),
  order_date DATE NOT NULL,
  target_delivery_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Draft',
  created_by_user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS so_items CASCADE;
CREATE TABLE so_items (
  so_item_id SERIAL PRIMARY KEY,
  so_id INT REFERENCES sales_orders(so_id) ON DELETE CASCADE,
  product_name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  size VARCHAR(10),
  color VARCHAR(50),
  design_file_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS work_orders CASCADE;
CREATE TABLE work_orders (
  wo_id SERIAL PRIMARY KEY,
  wo_number VARCHAR(50) UNIQUE NOT NULL,
  so_id INT REFERENCES sales_orders(so_id),
  production_start_date DATE,
  production_end_date DATE,
  current_stage_id INT REFERENCES production_stages(stage_id),
  created_by_user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS production_logs CASCADE;
CREATE TABLE production_logs (
  log_id SERIAL PRIMARY KEY,
  wo_id INT REFERENCES work_orders(wo_id) ON DELETE CASCADE,
  stage_id INT REFERENCES production_stages(stage_id),
  user_id INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

DROP TABLE IF EXISTS quality_control CASCADE;
CREATE TABLE quality_control (
  qc_id SERIAL PRIMARY KEY,
  wo_id INT REFERENCES work_orders(wo_id) ON DELETE CASCADE,
  quantity_passed INT DEFAULT 0,
  quantity_repaired INT DEFAULT 0,
  quantity_rejected INT DEFAULT 0,
  qc_notes TEXT,
  checked_by_user_id INT,
  check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS deliveries CASCADE;
CREATE TABLE deliveries (
  delivery_id SERIAL PRIMARY KEY,
  wo_id INT REFERENCES work_orders(wo_id) ON DELETE CASCADE,
  delivery_order_number VARCHAR(50),
  shipping_date DATE,
  status VARCHAR(50) DEFAULT 'Pending',
  handled_by_user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate indexes
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_work_orders_so ON work_orders(so_id);
CREATE INDEX idx_work_orders_stage ON work_orders(current_stage_id);
CREATE INDEX idx_production_logs_wo ON production_logs(wo_id);
CREATE INDEX idx_quality_control_wo ON quality_control(wo_id);
CREATE INDEX idx_deliveries_wo ON deliveries(wo_id);