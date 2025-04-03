const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Catalog service is running');
});

app.listen(3001, () => {
    console.log('Catalog service running on port 3001');
});
