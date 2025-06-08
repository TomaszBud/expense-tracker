import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Modal, 
  Form, 
  Table, 
  ProgressBar, 
  Alert,
  Badge
} from 'react-bootstrap';

const ExpenseTracker = () => {
  const [transactions, setTransactions] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    amount: '',
    type: 'EXPENSE'
  });

  // Enums as you mentioned
  const TRANSACTION_TYPES = {
    INCOME: 'INCOME',
    EXPENSE: 'EXPENSE'
  };

  // 2-level categories based on 50-30-20 rule
  const CATEGORIES = {
    // Needs (50%) - Essential expenses
    NEEDS: {
      'Housing': ['Rent/Mortgage', 'Utilities', 'Home Insurance', 'Property Tax'],
      'Transportation': ['Car Payment', 'Gas', 'Public Transport', 'Car Insurance', 'Maintenance'],
      'Food': ['Groceries', 'Essential Dining'],
      'Healthcare': ['Medical Bills', 'Insurance Premiums', 'Prescriptions'],
      'Minimum Debt': ['Credit Card Minimums', 'Loan Payments']
    },
    
    // Wants (30%) - Lifestyle expenses
    WANTS: {
      'Entertainment': ['Movies', 'Concerts', 'Games', 'Hobbies'],
      'Dining': ['Restaurants', 'Takeout', 'Coffee Shops'],
      'Shopping': ['Clothes', 'Electronics', 'Personal Items'],
      'Travel': ['Vacations', 'Weekend Trips'],
      'Subscriptions': ['Netflix', 'Spotify', 'Gym', 'Other Services']
    },
    
    // Savings & Investments (20%)
    SAVINGS: {
      'Emergency Fund': ['Emergency Savings'],
      'Retirement': ['401k', 'IRA', 'Pension'],
      'Investments': ['Stocks', 'Bonds', 'Crypto', 'Real Estate'],
      'Debt Payoff': ['Extra Debt Payments'],
      'Goals': ['Vacation Fund', 'House Down Payment', 'Education']
    },
    
    // Income categories
    INCOME: {
      'Primary': ['Salary', 'Wages', 'Tips'],
      'Secondary': ['Side Hustle', 'Freelance', 'Part-time'],
      'Passive': ['Dividends', 'Interest', 'Rental Income'],
      'Other': ['Gifts', 'Tax Refund', 'Bonus', 'Cashback']
    }
  };

  const BUDGET_TYPES = ['NEEDS', 'WANTS', 'SAVINGS'];

  // Load data from localStorage
  useEffect(() => {
    const savedTransactions = localStorage.getItem('budgetTransactions');
    const savedIncome = localStorage.getItem('budgetMonthlyIncome');
    
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
    if (savedIncome) {
      setMonthlyIncome(parseFloat(savedIncome));
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('budgetTransactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('budgetMonthlyIncome', monthlyIncome.toString());
  }, [monthlyIncome]);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: '',
      amount: '',
      type: 'EXPENSE'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    const newTransaction = {
      id: Date.now(),
      date: formData.date,
      description: formData.description,
      category: formData.category,
      amount: parseFloat(formData.amount),
      type: formData.type
    };

    setTransactions(prev => [newTransaction, ...prev]);
    handleCloseModal();
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // Calculate totals
  const totalExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0) + monthlyIncome;

  const netBalance = totalIncome - totalExpenses;

  // Calculate expenses by budget category
  const expensesByBudgetType = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      // Find which budget type this category belongs to
      const budgetType = getBudgetTypeForCategory(t.category);
      if (budgetType) {
        acc[budgetType] = (acc[budgetType] || 0) + t.amount;
      }
      return acc;
    }, {});

  function getBudgetTypeForCategory(category) {
    for (const budgetType of BUDGET_TYPES) {
      const categories = CATEGORIES[budgetType];
      for (const mainCat in categories) {
        if (categories[mainCat].includes(category)) {
          return budgetType;
        }
      }
    }
    return null;
  }

  function getCategoryOptions() {
    const type = formData.type;
    const categoryGroup = type === 'INCOME' ? CATEGORIES.INCOME : 
                         type === 'EXPENSE' ? {...CATEGORIES.NEEDS, ...CATEGORIES.WANTS, ...CATEGORIES.SAVINGS} : {};
    
    const options = [];
    for (const mainCategory in categoryGroup) {
      categoryGroup[mainCategory].forEach(subCategory => {
        options.push(
          <option key={`${mainCategory}-${subCategory}`} value={subCategory}>
            {mainCategory} - {subCategory}
          </option>
        );
      });
    }
    return options;
  }

  // 50-30-20 Budget calculations
  const budgetNeeds = totalIncome * 0.5;
  const budgetWants = totalIncome * 0.3;
  const budgetSavings = totalIncome * 0.2;

  const budgetData = {
    NEEDS: {
      label: 'Needs (50%)',
      budget: budgetNeeds,
      spent: expensesByBudgetType.NEEDS || 0,
      variant: 'danger'
    },
    WANTS: {
      label: 'Wants (30%)',
      budget: budgetWants,
      spent: expensesByBudgetType.WANTS || 0,
      variant: 'warning'
    },
    SAVINGS: {
      label: 'Savings (20%)',
      budget: budgetSavings,
      spent: expensesByBudgetType.SAVINGS || 0,
      variant: 'success'
    }
  };

  const exportData = () => {
    const data = {
      transactions,
      monthlyIncome,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.transactions) setTransactions(data.transactions);
        if (data.monthlyIncome) setMonthlyIncome(data.monthlyIncome);
        alert('Data imported successfully!');
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="display-4 mb-0">Personal Finance Dashboard</h1>
          <p className="lead text-muted">Track your budget using the 50-30-20 rule</p>
        </Col>
      </Row>

      {/* Monthly Income & Controls */}
      <Row className="mb-4">
        <Col md={8}>
          <Card>
            <Card.Body>
              <Card.Title>Monthly Income</Card.Title>
              <Form.Group>
                <Form.Control
                  type="number"
                  step="0.01"
                  placeholder="Enter your monthly income"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body className="d-flex flex-column gap-2">
              <Button variant="primary" onClick={handleShowModal}>
                ➕ Add Transaction
              </Button>
              <Button variant="success" onClick={exportData} size="sm">
                ⬇️ Export Data
              </Button>
              <Form.Group>
                <Form.Control
                  type="file"
                  accept=".json"
                  onChange={importData}
                  size="sm"
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Overview Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h2 className="text-success">📈</h2>
              <Card.Title>Total Income</Card.Title>
              <h3 className="text-success">${totalIncome.toFixed(2)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h2 className="text-danger">📉</h2>
              <Card.Title>Total Expenses</Card.Title>
              <h3 className="text-danger">${totalExpenses.toFixed(2)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h2>💰</h2>
              <Card.Title>Net Balance</Card.Title>
              <h3 className={netBalance >= 0 ? 'text-success' : 'text-danger'}>
                ${netBalance.toFixed(2)}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h2>📊</h2>
              <Card.Title>Transactions</Card.Title>
              <h3>{transactions.length}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 50-30-20 Budget Breakdown */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h4 className="mb-0">📊 50-30-20 Budget Breakdown</h4>
            </Card.Header>
            <Card.Body>
              <Row>
                {Object.entries(budgetData).map(([key, data]) => {
                  const percentage = data.budget > 0 ? (data.spent / data.budget) * 100 : 0;
                  const remaining = data.budget - data.spent;
                  
                  return (
                    <Col md={4} key={key} className="mb-3">
                      <h5>{data.label}</h5>
                      <div className="d-flex justify-content-between mb-1">
                        <small>${data.spent.toFixed(2)} / ${data.budget.toFixed(2)}</small>
                        <small>{percentage.toFixed(1)}%</small>
                      </div>
                      <ProgressBar 
                        variant={data.variant}
                        now={Math.min(percentage, 100)}
                        style={{ height: '20px' }}
                      />
                      <div className="d-flex justify-content-between mt-1">
                        <small className={remaining >= 0 ? 'text-success' : 'text-danger'}>
                          ${remaining.toFixed(2)} remaining
                        </small>
                        <small className={percentage > 100 ? 'text-danger fw-bold' : 'text-muted'}>
                          {percentage > 100 ? 'Over budget!' : 'On track'}
                        </small>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Transactions */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h4 className="mb-0">Recent Transactions</h4>
            </Card.Header>
            <Card.Body>
              {transactions.length === 0 ? (
                <Alert variant="info" className="text-center">
                  No transactions yet. Add your first transaction above!
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 15).map(transaction => (
                      <tr key={transaction.id}>
                        <td>{transaction.date}</td>
                        <td>{transaction.description}</td>
                        <td>
                          <small className="text-muted">{transaction.category}</small>
                        </td>
                        <td className={transaction.type === 'INCOME' ? 'text-success' : 'text-danger'}>
                          {transaction.type === 'INCOME' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </td>
                        <td>
                          <Badge bg={transaction.type === 'INCOME' ? 'success' : 'danger'}>
                            {transaction.type}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Transaction Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Transaction</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type *</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="What was this transaction for?"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category *</Form.Label>
              <Form.Select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a category...</option>
                {getCategoryOptions()}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Amount *</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add Transaction
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ExpenseTracker;