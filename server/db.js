const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'certverify';

let client;
let db;

async function connectDB() {
  if (db) return db;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  console.log(`✅ Connected to MongoDB: ${uri}/${dbName}`);
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    db = null;
    client = null;
  }
}

module.exports = { connectDB, closeDB };
