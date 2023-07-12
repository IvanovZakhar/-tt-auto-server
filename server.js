const express = require('express');
const { MongoClient } = require('mongodb');

require('dotenv').config();
// Строка подключения к MongoDB
const url = process.env.MONGODB_URI;

// Имя базы данных и коллекции
const dbName = 'hrTest';
const collectionName = 'stock';

// Создание экземпляра сервера Express
const app = express();
const port = process.env.PORT || 3005;


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

  next();
});
 
// Подключение к MongoDB и установка коллекции
async function connectToMongoDB() {
  const client = new MongoClient(url, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    console.log("Connected to MongoDB collection:", collectionName);
    return collection;
  } catch (error) {
    console.log("Failed to connect to MongoDB collection:", collectionName);
    console.error(error);
    throw error;
  }
}



// Маршрут для получения всех документов
app.get('/api/stock', async (req, res) => {
  try {
    const collection = await connectToMongoDB();
    const documents = await collection.find({}).toArray();
    res.json(documents);
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).send('Произошла ошибка сервера');
  }
});

// Маршрут для получения всех брендов и количество объектов в каждом
app.get('/api/brands', async (req, res) => {
  try {
    const collection = await connectToMongoDB();

    // Агрегация для получения списка марок, моделей и количества автомобилей
    const pipeline = [
      {
        $group: {
          _id: { mark: "$mark", model: "$model" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.mark",
          models: {
            $push: { model: "$_id.model", count: "$count" }
          },
          totalCount: { $sum: "$count" }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const result = await collection.aggregate(pipeline).toArray();

    res.json(result);
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).send('Произошла ошибка сервера');
  }
});


  // Маршрут для получения объектов с определенным брендом
  app.get('/api/brands/:brand', async (req, res) => {
    try {
      const { brand } = req.params;
      const collection = await connectToMongoDB();

      // Поиск объектов с указанным брендом
      const objects = await collection.find({ mark: brand }).toArray();

      res.json(objects);
    } catch (error) {
      console.error('Ошибка:', error);
      res.status(500).send('Произошла ошибка сервера');
    }
  });

 
  

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
