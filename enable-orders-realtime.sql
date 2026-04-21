-- Enable real-time for orders table to support live order tracking
-- Run this in Supabase SQL Editor

ALTER PUBLICATION supabase_realtime ADD TABLE orders;
