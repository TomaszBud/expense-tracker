// This will be the main app file for the budget tracker with OAuth.
// Assumes Google Sign-In is used for authentication.

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'https://script.google.com/macros/s/AKfycbyumSRomLV6wuwrzw4oMRLlh8dpv4bKg5rP82EFwVeNnxGbgdTalDN2ZQchRJBuufM/exec';
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
    <div className="container py-4">
      <h1 className="mb-4 text-center">💸 Budget Tracker</h1>
  
      {!user ? (
        <div className="d-flex justify-content-center" id="signInDiv"></div>
      ) : (
        <>
          <div className="mb-4 text-end">
            <strong>Welcome, {user.name}</strong>
          </div>
  
          {/* Form */}
          <div className="mb-4">
            <div className="card">
              <div className="card-header">Add Transaction</div>
              <div className="card-body">
                <form onSubmit={handleSubmit} className="row g-3">
                  <div className="col-md-3">
                    <input type="date" name="Date" value={form.Date} onChange={handleChange} className="form-control" required />
                  </div>
                  <div className="col-md-3">
                    <input type="text" name="Description" placeholder="Description" value={form.Description} onChange={handleChange} className="form-control" required />
                  </div>
                  <div className="col-md-2">
                    <input type="text" name="Category" placeholder="Category" value={form.Category} onChange={handleChange} className="form-control" required />
                  </div>
                  <div className="col-md-2">
                    <input type="number" name="Amount" placeholder="Amount" value={form.Amount} onChange={handleChange} className="form-control" required />
                  </div>
                  <div className="col-md-2 d-flex">
                    <select name="Type" value={form.Type} onChange={handleChange} className="form-select me-2">
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                    </select>
                    <button type="submit" className="btn btn-primary">Add</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
  
          {/* Summary */}
          <div className="mb-4 row text-center">
            <div className="col-md-4">
              <div className="alert alert-success">
                <strong>Income:</strong> ${summary.income.toFixed(2)}
              </div>
            </div>
            <div className="col-md-4">
              <div className="alert alert-danger">
                <strong>Expenses:</strong> ${summary.expense.toFixed(2)}
              </div>
            </div>
            <div className="col-md-4">
              <div className={`alert ${summary.savings >= 0 ? 'alert-primary' : 'alert-warning'}`}>
                <strong>Savings:</strong> ${summary.savings.toFixed(2)}
              </div>
            </div>
          </div>
  
          {/* Table */}
          <div className="card">
            <div className="card-header">Transactions</div>
            <div className="card-body table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-light">
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
                      <td>${parseFloat(t.Amount).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${t.Type === 'Income' ? 'bg-success' : 'bg-danger'}`}>
                          {t.Type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && <p className="text-muted text-center">No transactions yet.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
  
}
export default App;
