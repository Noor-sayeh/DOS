const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');
const axios = require("axios")
const path = require('path');
const cors = require("cors")
const redis = require('redis');
const util = require("util")

const client = {
    set: async () => true,
    get: async () => null,
    del: async () => true,
    on: () => {} // Add event handler stub
  };
// Handle Redis client errors
client.on("error", (err) => {
  console.error(`Redis Error: ${err}`);
});


const app = express();
const port = 3005;

app.use(express.json());
app.use(cors())

let orderPrice =0;
let numberIt ;
let test;
let lastResult;
let lastText;
app.post("/order",(req,res)=>{
  const order = req.body
  const searchId = req.body.id
  const orderCost = req.body.orderCost
  
db.all(`SELECT * FROM items WHERE id = ?`, [searchId], (err, row) => {
    if (err) {
      console.error(err.message);
      return;
    }
    
    if (!!row[0]) {
      numberIt = row[0].numberOfItems;
      orderPrice = row[0].bookCost;
      let numberOfItems = row[0].numberOfItems-1;
      console.log(orderPrice)
      console.log(orderCost)
      
      if (orderCost >= orderPrice) {
        
        const remainingAmount = orderCost - orderPrice;
        db.run(
          `UPDATE items SET numberOfItems = ? WHERE id = ?`,
          [numberOfItems, searchId],
          function (err) {
            if (err) {
              console.error('Error updating record:', err.message);
              return;
            }
            
          }
          
        );
      }
      
      
    } 
    db.all(`SELECT * FROM items WHERE id = ?`, [searchId], (err, updatedRow) => {
      if (err) {
          console.error(err.message);
          return;
        }
      if(updatedRow){
        // console.log({ numberOfItemsBeforeUpdate:numberIt,data: updatedRow[0]})
        
        if(updatedRow.length != 0){
          // console.log(updatedRow[0],"eeee")
          test = { numberOfItemsBeforeUpdate:numberIt,data: updatedRow}
          if(numberIt === updatedRow[0].numberOfItems){
            lastResult = false
          }
          else{
            lastResult = true
          
          }
          lastText = `Bought book ${updatedRow[0].bookTitle}`
        }
        // console.log(test)
        if(lastResult)
          res.send({result:{status:"success",message:lastText}});
        else
          res.send({result:{status:"fail",message:"Failed to buy The book!!"}})
      }  
      
    })
    
  });
 

});



db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY ,  
    bookTopic TEXT,
    numberOfItems INTEGER ,
    bookCost INTEGER,  
    bookTitle TEXT
  )`
  );
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY,  
      bookTopic TEXT,
      numberOfItems INTEGER,
      bookCost INTEGER,  
      bookTitle TEXT
    )`
    );
    
    // Insert initial data
    const stmt = db.prepare("INSERT OR REPLACE INTO items VALUES (?, ?, ?, ?, ?)");
    stmt.run(1, "Distributed System", 1000, 3000, 'How to get a good grade in DOS in 40 minutes a day');
    stmt.run(2, "Distributed System", 1000, 2000, 'RPCs for Noobs');
    stmt.run(3, "Undergraduate School", 1200, 1000, 'Xen and the Art of Surviving Undergraduate School');
    stmt.run(4, "Undergraduate School", 2100, 900, 'Cooking for the Impatient Undergrad');
    stmt.finalize();
  });
});

app.get('/search/:bookTopic', async (req, res) => {
    try {
      const bookTopic = req.params.bookTopic.trim();
      console.log("Searching for topic:", bookTopic);
  
      // Check cache
      const cached = await client.get(bookTopic);
      if (cached) {
        console.log("Returning cached results");
        return res.json({ items: JSON.parse(cached) });
      }
  
      // Query database
      db.all(`SELECT id, bookTitle, bookCost FROM items WHERE bookTopic = ?`, 
        [bookTopic],
        async (err, rows) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
          }
  
          if (!rows || rows.length === 0) {
            return res.json({ items: [] });
          }
  
          // Cache results
          await client.set(bookTopic, JSON.stringify(rows));
          
          // Return formatted response
          res.json({ 
            items: rows.map(row => ({
              id: row.id,
              title: row.bookTitle,
              price: row.bookCost
            }))
          });
        }
      );
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

app.get('/info/:id',async (req, res) => {
  let id = req.params.id;
  console.log(id);
  const cachedPost = await client.get(`${id}`)
  // console.log(cachedPost)
  /////////////////////////////
  db.serialize(() => {
    // i used serialize to solve of close data base for data displayed completely
    db.all(`SELECT id,numberOfItems,bookCost FROM items WHERE id=${id}`,async (err, row) => {
      if (err) {
        console.log(err);
        return;
      }
      if(cachedPost){
        let temp = JSON.parse(cachedPost)
        console.log(row[0].numberOfItems,"--")
        console.log(temp.numberOfItems,"--")
        if(row[0].numberOfItems == temp.numberOfItems)
          return res.json(JSON.parse(cachedPost))
        else{
          client.del(`${id}`)
          return res.json({Message:"Invalidate"})
        }
      }
      client.set(`${id}`,JSON.stringify(row[0]))
      console.log(row);
      res.json({item:row});
    });
  });
});

// app.get("/posts/:id",async (req,res)=>{
//   const id = req.params.id;
//   console.log(id)
//   const cachedPost = await client.get(`post-${id}`)
//   if(cachedPost){
//     return res.json(JSON.parse(cachedPost))
//   }
//   const response = await axios.get(`https://jsonplaceholder.typicode.com/posts/${id}`);
//   client.set(`post-${id}`,JSON.stringify(response.data), "EX", 360) // EX --> refer to Expire ,  5 --> refer to 5 seconds

//   res.json(response.data)
// })

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

