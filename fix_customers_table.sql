-- Fix for customers table - add auto-increment to customer_id
-- This approach preserves existing data if any

-- First, create a sequence for customer_id
CREATE SEQUENCE IF NOT EXISTS customers_customer_id_seq
    AS INTEGER
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Alter the column to use the sequence as default
ALTER TABLE customers
ALTER COLUMN customer_id
SET DEFAULT nextval('customers_customer_id_seq');

-- Also set the column to be NOT NULL if it's not already
ALTER TABLE customers
ALTER COLUMN customer_id
SET NOT NULL;

-- Make sure the sequence is owned by the table column
ALTER SEQUENCE customers_customer_id_seq
OWNED BY customers.customer_id;