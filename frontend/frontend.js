const express = require('express');
const axios = require('axios');
const readline = require('readline');

const app = express();
const PORT = 3000;
const CATALOG_SERVICE_URL = 'http://localhost:3001';
const ORDER_SERVICE_URL = 'http://localhost:3002';

app.use(express.json());

// REST API Endpoints (same as before)
app.get('/search/:topic', async (req, res) => {
    try {
        const response = await axios.get(`${CATALOG_SERVICE_URL}/search/${req.params.topic}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search catalog' });
    }
});

app.get('/info/:item_number', async (req, res) => {
    try {
        const response = await axios.get(`${CATALOG_SERVICE_URL}/info/${req.params.item_number}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get book info' });
    }
});

app.post('/purchase/:item_number', async (req, res) => {
    try {
        const response = await axios.post(`${ORDER_SERVICE_URL}/purchase/${req.params.item_number}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to process purchase' });
    }
});

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Frontend service running on port ${PORT}`);
    startCLI(); // Start the command line interface
});

// Command Line Interface
function startCLI() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    async function searchBooks() {
        const topic = await askQuestion('Enter topic to search (distributed systems/undergraduate school): ');
        try {
            const response = await axios.get(`http://localhost:${PORT}/search/${encodeURIComponent(topic)}`);
            console.log('\nSearch Results:');
            response.data.forEach(book => {
                console.log(`ID: ${book.id}, Title: ${book.title}`);
            });
        } catch (error) {
            console.error('Error searching books:', error.response?.data?.error || error.message);
        }
    }

    async function getBookInfo() {
        const itemNumber = await askQuestion('Enter book ID to get info: ');
        try {
            const response = await axios.get(`http://localhost:${PORT}/info/${itemNumber}`);
            console.log('\nBook Info:');
            console.log(`Title: ${response.data.title}`);
            console.log(`Price: $${response.data.price}`);
            console.log(`Quantity in stock: ${response.data.quantity}`);
        } catch (error) {
            console.error('Error getting book info:', error.response?.data?.error || error.message);
        }
    }

    async function purchaseBook() {
        const itemNumber = await askQuestion('Enter book ID to purchase: ');
        try {
            const response = await axios.post(`http://localhost:${PORT}/purchase/${itemNumber}`);
            console.log('\nPurchase Result:');
            console.log(response.data.message);
            console.log(`Order ID: ${response.data.order.id}`);
            console.log(`Price: $${response.data.order.price}`);
        } catch (error) {
            console.error('Error purchasing book:', error.response?.data?.error || error.message);
        }
    }

    function askQuestion(question) {
        return new Promise(resolve => {
            rl.question(question, answer => {
                resolve(answer);
            });
        });
    }

    async function mainMenu() {
        while (true) {
            console.log('\n=== Bazar.com Book Store ===');
            console.log('1. Search books by topic');
            console.log('2. Get book info by ID');
            console.log('3. Purchase a book');
            console.log('4. Exit');
            
            const choice = await askQuestion('Enter your choice: ');
            
            switch (choice) {
                case '1':
                    await searchBooks();
                    break;
                case '2':
                    await getBookInfo();
                    break;
                case '3':
                    await purchaseBook();
                    break;
                case '4':
                    rl.close();
                    server.close();
                    process.exit(0);
                default:
                    console.log('Invalid choice. Please try again.');
            }
        }
    }

    mainMenu().catch(console.error);
}