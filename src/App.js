// This will be the main app file for the budget tracker with OAuth.
// Assumes Google Sign-In is used for authentication.

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'https://script.google.com/macros/s/AKfycby6i66V7n_ivCwEsQcUEzKzmGCvWoigOeVXfYG3t-_cq1MbFSis-PbKIEMiMJ1UyqdZ/exec';
const CLIENT_ID = '1006715696745-27c37r1h3ukee0e3opkbio086l8vfgja.apps.googleusercontent.com';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    Date: '',
    Description: '',
    Category: '',
    Amount: '',
    Type: 'Expense',
  });
  const [user, setUser] = useState(null);

  const handleCredentialResponse = useCallback((response) => {
    const decoded = JSON.parse(atob(response.credential.split('.')[1]));
    setUser({
      email: decoded.email,
      name: decoded.name,
      token: response.credential,
    });
  }, []);

  useEffect(() => {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("signInDiv"),
        { theme: "outline", size: "large" }
      );
    }
  }, [handleCredentialResponse]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, form, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchTransactions();
      setForm({ Date: '', Description: '', Category: '', Amount: '', Type: 'Expense' });
    } catch (error) {
      console.error('Error posting data:', error);
    }
  };

  const calculateSummary = () => {
    let income = 0, expense = 0;
    transactions.forEach((t) => {
      if (t.Type === 'Income') income += parseFloat(t.Amount);
      else expense += parseFloat(t.Amount);
    });
    return { income, expense, savings: income - expense };
  };

  const summary = calculateSummary();

  return (
    <div>
      <h1>Budget Tracker</h1>
      {!user ? (
        <div id="signInDiv"></div>
      ) : (
        <div>
          <p>Welcome, {user.name}</p>
          <form onSubmit={handleSubmit}>
            <input type="date" name="Date" value={form.Date} onChange={handleChange} required />
            <input type="text" name="Description" placeholder="Description" value={form.Description} onChange={handleChange} required />
            <input type="text" name="Category" placeholder="Category" value={form.Category} onChange={handleChange} required />
            <input type="number" name="Amount" placeholder="Amount" value={form.Amount} onChange={handleChange} required />
            <select name="Type" value={form.Type} onChange={handleChange}>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
            <button type="submit">Add Transaction</button>
          </form>
          <h2>Summary</h2>
          <p>Income: {summary.income}</p>
          <p>Expenses: {summary.expense}</p>
          <p>Savings: {summary.savings}</p>
          <h2>Transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i}>
                  <td>{t.Date}</td>
                  <td>{t.Description}</td>
                  <td>{t.Category}</td>
                  <td>{t.Amount}</td>
                  <td>{t.Type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
