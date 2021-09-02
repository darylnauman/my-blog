const express = require('express')
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const PORT = 8000;

app.use(express.static(path.join(__dirname, '/build/')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const withDB = async (operations, res) => {
  try { 
    const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true});
    const db = client.db('my-blog');
    
    await operations(db);

    client.close();
  } catch (error) {
      res.status(500).json({message: 'Error connecting to db', error});
  }
};

app.get('/api/articles/:name', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db.collection('articles').findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res) ;
});

app.post('/api/articles/:name/upvote', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db.collection('articles').findOne({ name: articleName });
    
    await db.collection('articles').updateOne({ name: articleName }, {
      '$set': {
        upvotes: articleInfo.upvotes + 1,
      },
    });
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.post('/api/articles/:name/add-comment', async (req,res) => {  
  const articleName = req.params.name;
  const { username, text } = req.body;

  withDB(async (db) => {  
    await db.collection('articles').updateOne({ name: articleName }, {
      '$push': {
        comments: {username, text},
      },
    });
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));