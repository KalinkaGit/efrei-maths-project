const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, 'assets')));
app.use('/Data', express.static(path.join(__dirname, 'Data')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(8080, () => {
    console.log('Server is running on http://localhost:8080');
});