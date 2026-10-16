import pg from 'pg';
import { config } from './config.js';

const FALLBACK_HOST = '10.0.3.12';
const FALLBACK_PORT = 5432;

export const pool = new pg.Pool({
  host: config.database.host || FALLBACK_HOST,
  port: config.database.port || FALLBACK_PORT,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 10,
  idleTimeoutMillis: 30000,
});

export async function findOrder(id) {
  const { rows } = await pool.query(
    'select id, total, status from orders where id = $1',
    [id],
  );
  return rows[0];
}

export async function closePool() {
  await pool.end();
}
