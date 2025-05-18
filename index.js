import Database from 'better-sqlite3';
import 'dotenv/config'

import express from 'express';
import bodyParser from 'body-parser';

 import cors from 'cors'




const app = express()
const port = 3000

app.use(bodyParser.urlencoded())

app.use(bodyParser.json())
app.use(express.static("public"))
app.use(cors(
  {
    origin: "*"
  }
))
const database = new Database("mySecondDB.db")


const command = database.prepare(`
    CREATE TABLE IF NOT EXISTS stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL
    );
   
`);

const createStoriesTable = database.prepare(`
   CREATE TABLE IF NOT EXISTS stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL
    )
`) 

createStoriesTable.run();

const insertStoryCommand = database.prepare(`
  INSERT INTO stories (title, content) VALUES (?, ?)
  `);

 
command.run();


const apikey = process.env.API_KEY

console.log(apikey);

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function main(ins) {
  const chatCompletion = await getGroqChatCompletion("tell me a story based on the topic "+ins );
  // Print the completion returned by the LLM.
  const response = chatCompletion.choices[0]?.message?.content
  return response

 

}

export async function getGroqChatCompletion(instruction) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: instruction,
      },
    ],
    model: "llama-3.3-70b-versatile",
  });
}


// function getUyiAFruit(fruit, juice) {
//     console.log(fruit);
//     console.log(juice);
//     return "love"
    
    
// }


// let done = getUyiAFruit("banana", "strawberry juice");

// console.log(done);




export async function deleteStory(id){
  
  const deleteCommand = database.prepare(`
    DELETE FROM stories WHERE id = ?
`);

deleteCommand.run(id);

}

export async function updateStory(title, story, id){
  const updateCommand = database.prepare(`
    UPDATE stories SET title = ?, content = ? WHERE id = ?
`);

updateCommand.run(title, story, id);

}

const fetchStoryCommand = database.prepare(`
  SELECT * FROM stories
`);

const story = () => {
  return fetchStoryCommand.all();
}

// UPDATE table_name
// SET column1 = value1, column2 = value2, ...
// WHERE condition;


app.post('/create-story', async (req, res) => {
  if (!req.body){
    return res.status(400).send('No body found');
  }
  const { title } = req.body;

  if (!title || title.lenght < 5){
    return res.status(400).send('Title is required and must be at least 5 characters long');
  }
  const story = await main(title)
  insertStoryCommand.run(title, story);
  // res.send(story)
  res.redirect('/')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
}) 

app.get('/stories', (req, res) => {
  try {
    const stories = story();
    res.json(stories);
  } catch (err) {
    console.log(err);
    
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});  



app.delete('/delete-story/:id', (req, res) => {
  const { id } = req.params;
  console.log(id)
  deleteStory(id);
  res.redirect('/');
});

app.post('/update-story/:id', (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  console.log(id)
  updateStory(title, content, id);
  res.redirect('/');
});
