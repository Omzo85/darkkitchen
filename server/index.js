import express from 'express';
import cors from 'cors';
import pool from './config/db.js';
import dishesRoutes from './routes/dishes.js';
import usersRoutes from './routes/users.js';
import ordersRoutes from './routes/orders.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/dishes', dishesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/orders', ordersRoutes);

// Route de test pour vérifier la connexion à la base de données
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    res.json({ message: 'Connexion à la base de données réussie!', data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Erreur de connexion à la base de données', error: error.message });
  }
});

// Port d'écoute du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});