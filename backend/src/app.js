const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const routes = require('./routes');
const cors = require('cors');
const app = express();
require('dotenv').config();
// Use CORS middleware
app.use(cors());
const PORT = process.env.PORT || 8008;
const MONGODB_URI = process.env.URL;
// Middleware
app.use(bodyParser.json());

// Database connection
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Routes
app.use('/api', routes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
