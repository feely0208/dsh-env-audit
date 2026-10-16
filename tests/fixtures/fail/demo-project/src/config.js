import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`missing env var: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT || 8080),
  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: required('DB_PASSWORD'),
  },
  redisUrl: process.env.REDIS_URL,
  payments: { key: required('STRIPE_SECRET_KEY') },
  jwtSecret: required('JWT_SECRET'),
};
