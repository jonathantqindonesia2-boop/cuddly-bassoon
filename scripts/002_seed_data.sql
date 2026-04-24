-- Insert sample products for grocery store
INSERT INTO products (name, cost_price, selling_price, stock) VALUES
  ('Beras Premium 5kg', 65000, 75000, 50),
  ('Minyak Goreng 2L', 28000, 35000, 30),
  ('Gula Pasir 1kg', 12000, 15000, 45),
  ('Kopi Bubuk 100g', 8000, 12000, 60),
  ('Teh Celup 25pcs', 5000, 8000, 40),
  ('Mie Instan', 2500, 3500, 100),
  ('Susu UHT 1L', 15000, 19000, 25),
  ('Telur Ayam 1kg', 25000, 30000, 20),
  ('Sabun Mandi', 3500, 5000, 35),
  ('Shampo Sachet', 1000, 1500, 80),
  ('Deterjen Bubuk 1kg', 18000, 24000, 15),
  ('Air Mineral 600ml', 2000, 3000, 120),
  ('Roti Tawar', 12000, 15000, 10),
  ('Mentega 200g', 8000, 11000, 18),
  ('Kecap Manis 135ml', 6000, 9000, 30),
  ('Sambal Botol 140ml', 7000, 10000, 25),
  ('Garam 250g', 2000, 3000, 50),
  ('Lada Bubuk 50g', 5000, 8000, 20),
  ('Sardine Kaleng', 12000, 16000, 22),
  ('Kornet Sapi', 22000, 28000, 15)
ON CONFLICT DO NOTHING;
