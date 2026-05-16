// src/config/env.js
import nodeProcess from 'node:process';

// Carga nativa del archivo .env (Node.js 20+)
try {
  nodeProcess.loadEnvFile();
} catch (error) {
  // En producción (como Render), las variables se cargan directo al entorno, 
  // así que si no encuentra el archivo físico .env, que no rompa la app.
  if (nodeProcess.env.NODE_ENV === 'development') {
    console.warn('⚠️ No se encontró el archivo .env físico.');
  }
}

const getEnvVariable = (key, defaultValue) => {
  const value = nodeProcess.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const variables = {
  ENVIRONMENT: getEnvVariable('NODE_ENV', 'development'),
  PORT: getEnvVariable('PORT', '3000'),
  MONGO_URI: getEnvVariable('MONGO_URI'),
  PRIVATE_KEY: getEnvVariable('PRIVATE_KEY')
};