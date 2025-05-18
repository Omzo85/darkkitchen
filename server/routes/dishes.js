import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Récupérer tous les plats
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, c.name as category_name 
      FROM dishes d 
      LEFT JOIN categories c ON d.category_id = c.id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des plats', error: error.message });
  }
});

// Récupérer un plat par son ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM dishes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Plat non trouvé' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du plat', error: error.message });
  }
});

// Créer un nouveau plat
router.post('/', async (req, res) => {
  const { name, description, price, image_url, category_id } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO dishes (name, description, price, image_url, category_id) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, image_url, category_id]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du plat', error: error.message });
  }
});

// Mettre à jour un plat
router.put('/:id', async (req, res) => {
  const { name, description, price, image_url, category_id, is_available } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE dishes SET name = ?, description = ?, price = ?, image_url = ?, category_id = ?, is_available = ? WHERE id = ?',
      [name, description, price, image_url, category_id, is_available, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Plat non trouvé' });
    }
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du plat', error: error.message });
  }
});

// Supprimer un plat
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM dishes WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Plat non trouvé' });
    }
    res.json({ message: 'Plat supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du plat', error: error.message });
  }
});

export default router;