-- Création des tables
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dishes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  long_description TEXT,
  ingredients TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(255),
  category_id INT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Insertion des catégories
INSERT INTO categories (name) VALUES 
  ('entrees'),
  ('plats'),
  ('desserts');

-- Insertion des plats
INSERT INTO dishes (name, description, long_description, ingredients, price, image_url, category_id) VALUES
  ('Pastels au thon', 'Beignets farcis au thon', 'Délicieux beignets croustillants farcis au thon frais, aux herbes et épices.', 'Pâte à beignet, thon, oignons, persil, épices', 6.90, '/pastel_poisson.jpg', 1),
  ('Yassa poulet', 'Poulet mariné au citron et aux oignons', 'Une spécialité sénégalaise à base de poulet mariné dans une sauce aux oignons caramélisés et au citron.', 'Poulet, oignons, citron, moutarde, ail, épices', 14.90, '/yassa.jpeg', 2),
  ('Thiep poisson', 'Riz rouge au poisson avec légumes du jour', 'Un plat traditionnel sénégalais composé de riz cuit dans une sauce tomate riche.', 'Riz, poisson, tomates, oignons, ail, poivrons, épices', 15.90, '/tpoisson.jpg', 2);