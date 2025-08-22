import { Router } from 'express';
import pool from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const users: any[] = rows as any[];
  if (users.length === 0) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const user = users[0];
  console.log("Login attempt:", { email, plainPassword: password, storedHash: user.password });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (rows.length > 0) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const [result]: any = await pool.query(
    'INSERT INTO users (email, password) VALUES (?, ?)',
    [email, hashedPassword]
  );

  const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});



export default router;
