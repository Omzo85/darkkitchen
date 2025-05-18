/*
  # Création des tables utilisateurs et commandes

  1. Nouvelles Tables
    - `users`: Stocke les informations des utilisateurs (clients et admins)
      - `id` (uuid, clé primaire)
      - `email` (text, unique)
      - `role` (enum: client, admin)
      - `created_at` (timestamp)
    
    - `orders`: Stocke les commandes des utilisateurs
      - `id` (uuid, clé primaire)
      - `user_id` (référence users.id)
      - `status` (enum: en_attente, en_preparation, en_livraison, livre, annule)
      - `total_amount` (decimal)
      - `created_at` (timestamp)
    
    - `order_items`: Stocke les éléments de chaque commande
      - `id` (uuid, clé primaire)
      - `order_id` (référence orders.id)
      - `dish_id` (référence dishes.id)
      - `quantity` (integer)
      - `price_at_time` (decimal)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques pour les utilisateurs et les commandes
*/

-- Création de l'enum pour les rôles utilisateur
CREATE TYPE user_role AS ENUM ('client', 'admin');

-- Création de l'enum pour les statuts de commande
CREATE TYPE order_status AS ENUM ('en_attente', 'en_preparation', 'en_livraison', 'livre', 'annule');

-- Table des utilisateurs
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role user_role DEFAULT 'client',
  created_at timestamptz DEFAULT now()
);

-- Table des commandes
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status order_status DEFAULT 'en_attente',
  total_amount decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table des éléments de commande
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  dish_id uuid REFERENCES dishes(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_time decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activation de RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Politiques pour les utilisateurs
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (role = 'admin');

-- Politiques pour les commandes
CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Politiques pour les éléments de commande
CREATE POLICY "Users can read own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

-- Insertion d'un administrateur par défaut
INSERT INTO users (email, role) VALUES ('admin@chezkhadija.com', 'admin');