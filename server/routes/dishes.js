import express from 'express';
import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Créer le dossier uploads s'il n'existe pas
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration de multer pour les uploads d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, webp)'));
  }
});

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
router.post('/', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, description, price, category_id, stock } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Vérifier que les champs requis sont présents
    if (!name || !description || !price || !category_id) {
      throw new Error('Tous les champs requis doivent être remplis');
    }

    const [result] = await connection.query(
      'INSERT INTO dishes (name, description, price, image_url, category_id, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, parseFloat(price), image_url, parseInt(category_id), parseInt(stock) || 0]
    );

    await connection.commit();

    res.status(201).json({
      id: result.insertId,
      name,
      description,
      price: parseFloat(price),
      image_url,
      category_id: parseInt(category_id),
      stock: parseInt(stock) || 0
    });
  } catch (error) {
    await connection.rollback();
    // Si une erreur survient et qu'une image a été uploadée, la supprimer
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Erreur lors de la suppression du fichier:', err);
      });
    }
    res.status(500).json({ message: 'Erreur lors de la création du plat', error: error.message });
  } finally {
    connection.release();
  }
});

// Mettre à jour un plat
router.put('/:id', upload.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, description, price, category_id, stock } = req.body;
    let image_url = req.file ? `/uploads/${req.file.filename}` : undefined;

    // Récupérer l'ancienne image si une nouvelle est fournie
    if (image_url) {
      const [oldImage] = await connection.query(
        'SELECT image_url FROM dishes WHERE id = ?',
        [req.params.id]
      );
      if (oldImage[0]?.image_url) {
        const oldPath = path.join('public', oldImage[0].image_url);
        if (fs.existsSync(oldPath)) {
          fs.unlink(oldPath, (err) => {
            if (err) console.error('Erreur lors de la suppression de l\'ancienne image:', err);
          });
        }
      }
    }

    let query = 'UPDATE dishes SET name = ?, description = ?, price = ?, category_id = ?, stock = ?';
    let params = [name, description, parseFloat(price), parseInt(category_id), parseInt(stock)];

    if (image_url) {
      query += ', image_url = ?';
      params.push(image_url);
    }

    query += ' WHERE id = ?';
    params.push(req.params.id);

    const [result] = await connection.query(query, params);

    if (result.affectedRows === 0) {
      throw new Error('Plat non trouvé');
    }

    await connection.commit();

    res.json({
      id: parseInt(req.params.id),
      name,
      description,
      price: parseFloat(price),
      category_id: parseInt(category_id),
      stock: parseInt(stock),
      ...(image_url && { image_url })
    });
  } catch (error) {
    await connection.rollback();
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Erreur lors de la suppression du fichier:', err);
      });
    }
    res.status(500).json({ message: 'Erreur lors de la mise à jour du plat', error: error.message });
  } finally {
    connection.release();
  }
});

// Mettre à jour le stock d'un plat
router.patch('/:id/stock', async (req, res) => {
  try {
    const { stock } = req.body;
    const [result] = await pool.query(
      'UPDATE dishes SET stock = ? WHERE id = ?',
      [parseInt(stock), req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Plat non trouvé' });
    }

    res.json({ id: parseInt(req.params.id), stock: parseInt(stock) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du stock', error: error.message });
  }
});

// Supprimer un plat
router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Récupérer l'image avant la suppression
    const [dish] = await connection.query(
      'SELECT image_url FROM dishes WHERE id = ?',
      [req.params.id]
    );

    const [result] = await connection.query(
      'DELETE FROM dishes WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Plat non trouvé');
    }

    // Supprimer l'image si elle existe
    if (dish[0]?.image_url) {
      const imagePath = path.join('public', dish[0].image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Erreur lors de la suppression de l\'image:', err);
        });
      }
    }

    await connection.commit();
    res.json({ message: 'Plat supprimé avec succès' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Erreur lors de la suppression du plat', error: error.message });
  } finally {
    connection.release();
  }
});

export default router;