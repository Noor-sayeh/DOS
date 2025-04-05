import express from 'express';
import axios from 'axios';
const app = express();
app.use(express.json());

app.listen(2000, () => {
    console.log(`Frontend is running on port 2000`);
});

// Search books by topic
app.get('/Bazarcom/Search/:topic', async (req, res) => {
    try {
        const topicParam = req.params.topic;
        const searchBy = "topic";
        const operation = "search";
        const response = await axios.get('http://localhost:2001/CatalogServer/query', {
            params: { topicParam, searchBy, operation }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(404).json({ error: 'Item not found' });
    }
});

// Search books by id
app.get('/Bazarcom/info/:id', async (req, res) => {
    try {
        const idParam = req.params.id;
        const searchBy = "id";
        const operation = "info";
        const response = await axios.get('http://localhost:2001/CatalogServer/query', {
            params: { idParam, searchBy, operation }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(404).json({ error: 'Item not found' });
    }
});

// Make purchase 
app.post('/Bazarcom/purchase/:id', async (req, res) => {
    try {
        const idParam = req.params.id;
        const response = await axios.post(`http://localhost:2002/OrderServer/purchase/${idParam}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error purchasing book:', error);
        res.status(404).json({ error: 'Failed to purchase item' });
    }
});