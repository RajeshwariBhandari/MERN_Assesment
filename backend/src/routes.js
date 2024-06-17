const express = require('express');
const { fetchAndSeedData } = require('./utils');
const router = express.Router();
const { Transaction } = require('./models');
const { default: axios } = require('axios');

router.get('/initialize', async (req, res) => {
    await fetchAndSeedData();
    res.send('Database initialized with seed data');
});

router.get('/transactions', async (req, res) => {
    const { page = 1, perPage = 10, search = '',month='03' } = req.query;
    const query = {};

    if (search) {

        const numericSearch = parseFloat(search);
        const isNumeric = !isNaN(numericSearch) && isFinite(search);

        query.$or = [
            // Case-insensitive search on title and description
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];

        // Numeric search on price if search query is numeric
        if (isNumeric) {
            query.$or.push({ price: numericSearch });
        }
    }
    if (month) {
        const monthNumber = parseInt(month); // Convert month to integer

        query.$expr = {
            $eq: [{ $month: "$dateOfSale" }, monthNumber]
        };
    }

    try {
        const transactions = await Transaction.find(query)
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));

        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
   
router.get('/statistics', async (req, res) => {
    const { month } = req.query;

    try {
        // Validate month format (MM format)
        if (!/^(0[1-9]|1[0-2])$/.test(month)) {
            throw new Error('Invalid month format. Use MM format (01-12).');
        }

        // Convert month to number (1-based index)
        const monthNumber = parseInt(month, 10);

        // Query transactions for the specified month
        const transactions = await Transaction.find({
         $expr: {
                $eq: [{ $month: "$dateOfSale" }, monthNumber]
            }
        });

        const totalSaleAmount = transactions.reduce((total, transaction) => total + transaction.price, 0);
        const totalSoldItems = transactions.filter(transaction => transaction.sold).length;
        const totalNotSoldItems = transactions.filter(transaction => !transaction.sold).length;

        res.json({
            totalSaleAmount,
            totalSoldItems,
            totalNotSoldItems
        });

    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ message: 'Error fetching transactions. Please try again later.' });
    }
});

router.get('/bar-chart', async (req, res) => {
    const { month } = req.query;

    try {
        // Validate month format (MM format)
        if (!/^(0[1-9]|1[0-2])$/.test(month)) {
            throw new Error('Invalid month format. Use MM format (01-12).');
        }

        // Convert month to number (1-based index)
        const monthNumber = parseInt(month, 10);

        // Define price ranges
        const priceRanges = [
            { min: 0, max: 100 },
            { min: 101, max: 200 },
            { min: 201, max: 300 },
            { min: 301, max: 400 },
            { min: 401, max: 500 },
            { min: 501, max: 600 },
            { min: 601, max: 700 },
            { min: 701, max: 800 },
            { min: 801, max: 900 },
            { min: 901, max: Infinity }
        ];

        // Construct aggregation pipeline to calculate counts for each price range
        const aggregationPipeline = [
            {
                $match: {
                    $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] }
                }
            },
            {
                $project: {
                    price: 1,
                    range: {
                        $switch: {
                            branches: priceRanges.map(({ min, max }, index) => ({
                                case: {
                                    $and: [
                                        { $gte: ["$price", min] },
                                        { $lt: ["$price", max] }
                                    ]
                                },
                                then: `${min}-${max}`
                            })),
                            default: "Unknown"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$range",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ];

        // Execute aggregation pipeline
        const result = await Transaction.aggregate(aggregationPipeline);

        res.json(result);
    } catch (err) {
        console.error('Error fetching bar chart data:', err);
        res.status(500).json({ message: 'Error fetching bar chart data. Please try again later.',err });
    }
});
router.get('/pie-chart', async (req, res) => {
    const { month } = req.query;

    try {
        // Validate month format (MM format)
        if (!/^(0[1-9]|1[0-2])$/.test(month)) {
            throw new Error('Invalid month format. Use MM format (01-12).');
        }

        // Convert month to number (1-based index)
        const monthNumber = parseInt(month, 10);

        // Construct aggregation pipeline to calculate counts for each category
        const aggregationPipeline = [
            {
                $match: {
                    $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] }
                }
            },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ];

        // Execute aggregation pipeline
        const result = await Transaction.aggregate(aggregationPipeline);

        // Format result for pie chart data
        const pieChartData = result.map(item => ({
            category: item._id,
            count: item.count
        }));

        res.json(pieChartData);
    } catch (err) {
        console.error('Error fetching pie chart data:', err);
        res.status(500).json({ message: 'Error fetching pie chart data. Please try again later.' });
    }
});


router.get('/combined-data', async (req, res) => {
    try {
        const transactionsAPI = 'http://localhost:8008/api/transactions?month=MM';
        const statisticsAPI = 'http://localhost:8008/api/statistics?month=MM';
        const barChartAPI = 'http://localhost:8008/api/bar-chart?month=MM';

        // Fetch data from all three APIs concurrently
        const [transactionsResponse, statisticsResponse, barChartResponse] = await Promise.all([
            axios.get(transactionsAPI.replace('MM', req.query.month)),
            axios.get(statisticsAPI.replace('MM', req.query.month)),
            axios.get(barChartAPI.replace('MM', req.query.month))
        ]);

        // Extract data from responses
        const transactions = transactionsResponse.data;
        const statistics = statisticsResponse.data;
        const barChartData = barChartResponse.data;

        // Combine data into a single object
        const combinedData = {
            transactions,
            statistics,
            barChartData
        };

        res.json(combinedData);
    } catch (error) {
        console.error('Error fetching combined data:', error);
        res.status(500).json({ message: 'Error fetching combined data. Please try again later.',error });
    }
});

module.exports = router;
