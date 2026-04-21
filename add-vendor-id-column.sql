-- Add vendor_id column to products table
ALTER TABLE products 
ADD COLUMN vendor_id UUID;

-- Add foreign key constraint linking products.vendor_id to vendors.id
ALTER TABLE products 
ADD CONSTRAINT fk_vendor 
FOREIGN KEY (vendor_id) 
REFERENCES vendors(id) 
ON DELETE SET NULL;
