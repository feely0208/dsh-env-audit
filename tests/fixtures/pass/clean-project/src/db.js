import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({
  host: config.database.host,
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
