const axios = require('axios');
const { Transaction } = require('./models');

const fetchAndSeedData = async () => {
    try {
        const url = 'https://s3.amazonaws.com/roxiler.com/product_transaction.json';
        const response = await axios.get(url);
        const data = response.data;

        await Transaction.deleteMany({}); // Clear existing data
        await Transaction.insertMany(data); // Seed new data

        console.log('Database initialized with seed data');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

module.exports = { fetchAndSeedData };
