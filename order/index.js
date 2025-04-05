
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');
const axios = require("axios")
const cors = require("cors");
const app = express();
const port = 3006;
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended:true}))

app.post("/purch", async (req, res) => {
    try {
      const { id } = req.body;
      
      // 1. Verify book exists
      const bookInfo = await axios.get(`http://localhost:3005/info/${id}`)
        .catch(err => {
          console.error("Catalog service error:", err.message);
          throw new Error("Cannot connect to catalog service");
        });
  
      if (!bookInfo.data?.item) {
        return res.status(404).json({ error: "Book not found" });
      }
  
      // 2. Process purchase
      const updateResponse = await axios.post(`http://localhost:3005/update`, {
        id: id,
        quantity: bookInfo.data.item.numberOfItems - 1
      }).catch(err => {
        console.error("Update failed:", err.message);
        throw new Error("Stock update failed");
      });
  
      res.json({ 
        success: true,
        message: `Purchased: ${bookInfo.data.item.bookTitle}`
      });
      
    } catch (error) {
      console.error("Purchase error:", error.message);
      res.status(500).json({ 
        error: error.message || "Purchase failed",
        details: error.response?.data
      });
    }
  });
app.get("/test",(req,res)=>{
  res.send({Message:"Arrive"})
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


