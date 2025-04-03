const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Frontend service is running');
});

app.listen(3000, () => {
    console.log('Frontend service running on port 3000');
});
