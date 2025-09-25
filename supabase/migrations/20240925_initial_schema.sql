-- GarmentFlow Database Schema
-- Based on PRD requirements

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles table
CREATE TABLE roles (
  role_id INT PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert default roles
INSERT INTO roles (role_id, role_name) VALUES
(1, 'Admin'),
(2, 'Sales'),
(3, 'PPIC'),
(4, 'Warehouse'),
(5, 'Production'),
(6, 'QC'),
(7, 'Delivery'),
(8, 'Management');

-- Create customers table
CREATE TABLE customers (
  customer_id INT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create production_stages table
CREATE TABLE production_stages (
  stage_id INT PRIMARY KEY,
  stage_name VARCHAR(50) UNIQUE NOT NULL,
  sequence_order INT NOT NULL
);

-- Insert default production stages
INSERT INTO production_stages (stage_id, stage_name, sequence_order) VALUES
(1, 'PPIC', 1),
(2, 'Material Prep', 2),
(3, 'Cutting', 3),
(4, 'Sewing', 4),
(5, 'Finishing', 5),
(6, 'QC', 6),
(7, 'Ready for Delivery', 7),
(8, 'Delivered', 8);

-- Create sales_orders table
CREATE TABLE sales_orders (
  so_id INT PRIMARY KEY,
  so_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT REFERENCES customers(customer_id),
  order_date DATE NOT NULL,
  target_delivery_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Draft',
  created_by_user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create so_items table
CREATE TABLE so_items (
  so_item_id INT PRIMARY KEY,
  so_id INT REFERENCES sales_orders(so_id) ON DELETE CASCADE,
  product_name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  size VARCHAR(10),
  color VARCHAR(50),
  design_file_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create work_orders table
CREATE TABLE work_orders (
  wo_id INT PRIMARY KEY,
  wo_number VARCHAR(50) UNIQUE NOT NULL,
  so_id INT REFERENCES sales_orders(so_id),
  production_start_date DATE,
  production_end_date DATE,
  current_stage_id INT REFERENCES production_stages(stage_id),
  created_by_user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create production_logs table
CREATE TABLE production_logs (
  log_id INT PRIMARY KEY,
  wo_id INT REFERENCES work_orders(wo_id) ON DELETE CASCADE,
  stage_id INT REFERENCES production_stages(stage_id),
  user_id INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Create quality_control table
CREATE TABLE quality_control (
  qc_id INT PRIMARY KEY,
  wo_id INT REFERENCES work_orders(wo_id) ON DELETE CASCADE,
  quantity_passed INT DEFAULT 0,
  quantity_repaired INT DEFAULT 0,
  quantity_rejected INT DEFAULT 0,
  qc_notes TEXT,
  checked_by_user_id INT,
  check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create deliveries table
CREATE TABLE deliveries (
  delivery_id INT PRIMARY KEY,
  wo_id INT REFERENCES work_orders(wo_id) ON DELETE CASCADE,
  delivery_order_number VARCHAR(50),
  shipping_date DATE,
  status VARCHAR(50) DEFAULT 'Pending',
  handled_by_user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_work_orders_so ON work_orders(so_id);
CREATE INDEX idx_work_orders_stage ON work_orders(current_stage_id);
CREATE INDEX idx_production_logs_wo ON production_logs(wo_id);
CREATE INDEX idx_quality_control_wo ON quality_control(wo_id);
CREATE INDEX idx_deliveries_wo ON deliveries(wo_id);

-- Enable Row Level Security (Note: row_security is enabled by default in Supabase)

-- Add RLS policies
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;