import { Router, Request, Response } from 'express';
import pool from '../db';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// POST /survey - save survey response
router.post('/', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const userId = decoded.id;

    const { question, description, answer } = req.body;
    await pool.query(
      'INSERT INTO survey_responses (user_id, question, description, answer) VALUES (?, ?, ?, ?)',
      [userId, question, description, answer]
    );

    res.json({ message: 'Response saved' });
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
});

router.get('/', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const userId = decoded.id;

    const [rows] = await pool.query(
      'SELECT id, question, description, answer FROM survey_responses WHERE user_id = ?',
      [userId]
    );
    res.json(rows);

  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
});


export default router;
