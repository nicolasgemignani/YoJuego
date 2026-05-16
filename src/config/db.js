import mongoose from 'mongoose';
import { variables } from './env.js';

const conectarDB = async () => {
  try {
    // Nos conectamos usando la URL validada de nuestro objeto variables
    const conn = await mongoose.connect(variables.MONGO_URI);
    
    console.log(`MongoDB Atlas Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error al conectar a la base de datos: ${error.message}`);
    // Si no hay base de datos, cortamos el proceso de inmediato
    process.exit(1);
  }
};

export default conectarDB;