const express = require('express');
const { MongoClient } = require('mongodb');

// Строка подключения к MongoDB
const url = process.env.MONGO_URL ;  
// Имя базы данных и коллекции
const dbName = 'hrTest';
const collectionName = 'stock';

// Создание экземпляра сервера Express
const app = express();
const port = 3005;


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

  next();
});


// Подключение к MongoDB и установка коллекции
// Подключение к MongoDB и установка коллекции
async function connectToMongoDB() {
  const client = new MongoClient(url, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection(collectionName);
  return collection;
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

  app.get('/api/brands/:brand/models', async (req, res) => {
    try {
      const { brand } = req.params;
      const { models } = req.query; // Получаем массив моделей из параметров запроса
      console.log(models)
      console.log(brand)
      // Преобразуем строку с моделями в массив
      const modelsArray = models.split(',');
      console.log(modelsArray)
      const collection = await connectToMongoDB();
  
      // Поиск объектов с указанным брендом и моделями
      const objects = await collection.find({
        mark: brand,
        model: { $in: modelsArray } // Используем оператор $in для поиска по нескольким значениям
      }).toArray();
      console.log(objects)
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
