import { MongoClient } from 'mongodb'

// Vive fuera del handler para reutilizar la conexion entre invocaciones "calientes"
let cachedClient = null

export const getDb = async () => {
  if (!cachedClient) {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('Falta la variable de entorno MONGODB_URI')

    cachedClient = new MongoClient(uri)
    await cachedClient.connect()
  }

  // El nombre de la base ya viene incluido en el MONGODB_URI
  return cachedClient.db()
}
