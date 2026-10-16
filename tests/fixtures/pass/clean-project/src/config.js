import 'dotenv/config';

const DEFAULT_DEV_URL = 'http://localhost:3000';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`missing env var: ${name}`);
  return value;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  publicUrl: process.env.PUBLIC_URL || DEFAULT_DEV_URL,
  database: {
    host: process.env.DB_HOST || 'localhost',
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: required('DB_PASSWORD'),
  },
  redisUrl: process.env.REDIS_URL,
  jwtSecret: required('JWT_SECRET'),
};
