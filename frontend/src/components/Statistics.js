import React from 'react';

const Statistics = ({ statistics }) => {
  return (
    <div className="statistics">
      <h3>Statistics</h3>
      <div>Total Sale Amount: {statistics.totalSaleAmount}</div>
      <div>Total Sold Items: {statistics.totalSoldItems}</div>
      <div>Total Not Sold Items: {statistics.totalNotSoldItems}</div>
    </div>
  );
};

export default Statistics;
