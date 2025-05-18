import express from 'express';
import pool from '../config/db.js';
import { sendOrderConfirmation } from '../utils/emailService.js';

const router = express.Router();

// Récupérer toutes les commandes
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    
    // Récupérer les détails des articles pour chaque commande
    const ordersWithItems = await Promise.all(rows.map(async (order) => {
      const [items] = await pool.query(`
        SELECT oi.*, d.name as dish_name
        FROM order_items oi
        LEFT JOIN dishes d ON oi.dish_id = d.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      return { ...order, items };
    }));
    
    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes', error: error.message });
  }
});

// Récupérer une commande par son ID
router.get('/:id', async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [req.params.id]);

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    const [items] = await pool.query(`
      SELECT oi.*, d.name as dish_name
      FROM order_items oi
      LEFT JOIN dishes d ON oi.dish_id = d.id
      WHERE oi.order_id = ?
    `, [req.params.id]);

    const order = { ...orders[0], items };
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la commande', error: error.message });
  }
});

// Créer une nouvelle commande
router.post('/', async (req, res) => {
  const { user_id, items, total_amount } = req.body;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Créer la commande
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount) VALUES (?, ?)',
      [user_id, total_amount]
    );

    // Ajouter les articles de la commande
    await Promise.all(items.map(item => 
      connection.query(
        'INSERT INTO order_items (order_id, dish_id, quantity, price_at_time) VALUES (?, ?, ?, ?)',
        [orderResult.insertId, item.dish_id, item.quantity, item.price]
      )
    ));

    // Récupérer l'email de l'utilisateur
    const [userRows] = await connection.query(
      'SELECT email FROM users WHERE id = ?',
      [user_id]
    );

    await connection.commit();

    // Récupérer les détails complets de la commande pour l'email
    const [orderDetails] = await connection.query(`
      SELECT o.*, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderResult.insertId]);

    const [orderItems] = await connection.query(`
      SELECT oi.*, d.name as dish_name
      FROM order_items oi
      LEFT JOIN dishes d ON oi.dish_id = d.id
      WHERE oi.order_id = ?
    `, [orderResult.insertId]);

    // Envoyer l'email de confirmation
    await sendOrderConfirmation(userRows[0].email, orderDetails[0], orderItems);

    res.status(201).json({ 
      id: orderResult.insertId,
      user_id,
      total_amount,
      items,
      status: 'en attente'
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Erreur lors de la création de la commande', error: error.message });
  } finally {
    connection.release();
  }
});

// Mettre à jour le statut d'une commande
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    res.json({ id: req.params.id, status });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut', error: error.message });
  }
});

export default router;