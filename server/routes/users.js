import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Récupérer tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, role, created_at, last_login FROM users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs', error: error.message });
  }
});

// Récupérer un utilisateur par son ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, role, created_at, last_login FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur', error: error.message });
  }
});

// Mettre à jour un utilisateur
router.put('/:id', async (req, res) => {
  const { email, role } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE users SET email = ?, role = ? WHERE id = ?',
      [email, role, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ id: req.params.id, email, role });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur', error: error.message });
  }
});

// Supprimer un utilisateur
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur', error: error.message });
  }
});

export default router;