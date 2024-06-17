
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TransactionsTable from './components/TransactionsTable';
import Statistics from './components/Statistics';
import BarChart from './components/BarChart';
import './App.css';

const App = () => {
  const [month, setMonth] = useState('03');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [barChartData, setBarChartData] = useState({});

  useEffect(() => {
    fetchTransactions();
    fetchStatistics();
    fetchBarChartData();
  }, [month, search, page]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`http://localhost:8008/api/transactions`, {
        params: { month, search, page, perPage: 10 }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`http://localhost:8008/api/statistics`, { params: { month } });
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchBarChartData = async () => {
    try {
      const response = await axios.get(`http://localhost:8008/api/bar-chart`, { params: { month: month } });
      const chartData = response.data;
      
      const labels = chartData.map(item => item._id);
      const values = chartData.map(item => item.count);
      
      setBarChartData({ labels, values });
    } catch (error) {
      console.error('Error fetching bar chart data:', error);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions" />
      </div>
      <TransactionsTable transactions={transactions} />
      <Statistics statistics={statistics} />
     
      <div className="pagination">
        <button onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>Previous</button>
        <span>Page {page}</span>
        <button onClick={() => setPage((prev) => prev + 1)}>Next</button>
      </div>
      <BarChart data={barChartData} />
    </div>
  );
};

export default App;

