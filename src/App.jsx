import React, { useState } from 'react';
import { Upload, Download, PieChart, TrendingUp, Settings, Plus, X, Edit2, Check } from 'lucide-react';
import Papa from 'papaparse';

const ExpenseCategorizer = () => {
  const defaultCategories = [
    'Office Supplies', 'Travel', 'Meals & Entertainment', 'Professional Services',
    'Marketing & Advertising', 'Utilities', 'Rent/Lease', 'Insurance',
    'Software & Subscriptions', 'Equipment', 'Bank Fees', 'Other'
  ];

  // Smart categorization rules
  const categorizationRules = {
    'Meals & Entertainment': [
      'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'subway', 'pizza',
      'burger', 'food', 'dining', 'bar', 'pub', 'grill', 'kitchen', 'bistro',
      'tim hortons', 'wendy', 'kfc', 'taco bell', 'chipotle', 'panera'
    ],
    'Travel': [
      'airline', 'hotel', 'uber', 'lyft', 'taxi', 'parking', 'rental car',
      'airbnb', 'flight', 'airport', 'gas station', 'shell', 'esso', 'petro',
      'transit', 'train', 'bus'
    ],
    'Office Supplies': [
      'staples', 'office depot', 'amazon', 'paper', 'supply', 'pen', 'printer'
    ],
    'Equipment': [
      'home depot', 'lowes', 'hardware', 'tools', 'equipment', 'best buy',
      'electronics', 'computer', 'laptop'
    ],
    'Software & Subscriptions': [
      'microsoft', 'adobe', 'google', 'subscription', 'saas', 'software',
      'zoom', 'slack', 'dropbox', 'netflix', 'spotify', 'annual fee'
    ],
    'Utilities': [
      'electric', 'power', 'gas utility', 'water', 'internet', 'phone',
      'hydro', 'bell', 'rogers', 'telus'
    ],
    'Insurance': [
      'insurance', 'life ins', 'health ins', 'liability'
    ],
    'Professional Services': [
      'legal', 'accounting', 'consultant', 'lawyer', 'cpa', 'bookkeeping'
    ],
    'Marketing & Advertising': [
      'google ads', 'facebook ads', 'advertising', 'marketing', 'social media',
      'mailchimp', 'constant contact'
    ],
    'Bank Fees': [
      'bank fee', 'service charge', 'overdraft', 'atm fee', 'wire transfer',
      'monthly fee', 'transaction fee'
    ]
  };

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [view, setView] = useState('upload');
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    date: '',
    description: '',
    amount: ''
  });

  // Auto-categorize based on description
  const autoCategorizTransaction = (description) => {
    const lowerDesc = description.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categorizationRules)) {
      for (const keyword of keywords) {
        if (lowerDesc.includes(keyword)) {
          return category;
        }
      }
    }
    
    return 'Uncategorized';
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.data.length > 0) {
          setCsvHeaders(Object.keys(results.data[0]));
          setCsvData(results.data);
          setView('mapping');
        }
      }
    });
  };

  const confirmMapping = () => {
    const newTransactions = csvData.map((row, idx) => {
      const description = String(row[columnMapping.description] || '');
      return {
        id: Date.now() + idx,
        date: String(row[columnMapping.date] || ''),
        description: description,
        amount: Math.abs(parseFloat(row[columnMapping.amount]) || 0),
        category: autoCategorizTransaction(description)
      };
    }).filter(t => t.amount > 0);

    setTransactions([...transactions, ...newTransactions]);
    setView('categorize');
  };

  const updateCategory = (txId, category) => {
    const updated = transactions.map(tx => 
      tx.id === txId ? { ...tx, category } : tx
    );
    setTransactions(updated);
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const startEditCategory = (cat) => {
    setEditingCategory(cat);
    setEditValue(cat);
  };

  const saveEditCategory = () => {
    if (editValue.trim() && editValue !== editingCategory) {
      const updated = categories.map(c => c === editingCategory ? editValue.trim() : c);
      setCategories(updated);
      
      const updatedTx = transactions.map(tx => 
        tx.category === editingCategory ? { ...tx, category: editValue.trim() } : tx
      );
      setTransactions(updatedTx);
    }
    setEditingCategory(null);
  };

  const deleteCategory = (cat) => {
    const updated = categories.filter(c => c !== cat);
    setCategories(updated);
    
    const updatedTx = transactions.map(tx => 
      tx.category === cat ? { ...tx, category: 'Uncategorized' } : tx
    );
    setTransactions(updatedTx);
  };

  const exportData = () => {
    const summary = {};
    transactions.forEach(tx => {
      summary[tx.category] = (summary[tx.category] || 0) + tx.amount;
    });

    const csv = [
      ['Category', 'Total Amount'],
      ...Object.entries(summary).map(([cat, amt]) => [cat, amt.toFixed(2)])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expense-summary.csv';
    a.click();
  };

  const getCategorySummary = () => {
    const summary = {};
    transactions.forEach(tx => {
      summary[tx.category] = (summary[tx.category] || 0) + tx.amount;
    });
    return Object.entries(summary).sort((a, b) => b[1] - a[1]);
  };

  const totalExpenses = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const uncategorizedCount = transactions.filter(tx => tx.category === 'Uncategorized').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-800">Expense Categorizer</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('upload')}
                className={`px-4 py-2 rounded-lg ${view === 'upload' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload
              </button>
              <button
                onClick={() => setView('categorize')}
                className={`px-4 py-2 rounded-lg ${view === 'categorize' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                disabled={transactions.length === 0}
              >
                Review ({uncategorizedCount} need review)
              </button>
              <button
                onClick={() => setView('summary')}
                className={`px-4 py-2 rounded-lg ${view === 'summary' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                disabled={transactions.length === 0}
              >
                <PieChart className="w-4 h-4 inline mr-2" />
                Summary
              </button>
              <button
                onClick={() => setView('settings')}
                className={`px-4 py-2 rounded-lg ${view === 'settings' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Categories
              </button>
            </div>
          </div>

          {view === 'upload' && (
            <div className="text-center py-16">
              <Upload className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-4">Upload Credit Card Statement</h2>
              <p className="text-gray-600 mb-8">Upload your CSV file and we'll auto-categorize your transactions</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-indigo-700 transition"
              >
                Choose CSV File
              </label>
              {transactions.length > 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  Currently managing {transactions.length} transactions
                </p>
              )}
            </div>
          )}

          {view === 'mapping' && (
            <div className="py-8">
              <h2 className="text-2xl font-semibold mb-6">Map CSV Columns</h2>
              <p className="text-gray-600 mb-6">Match your CSV columns to the required fields:</p>
              
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium mb-2">Date Column</label>
                  <select
                    value={columnMapping.date}
                    onChange={(e) => setColumnMapping({...columnMapping, date: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2"
                  >
                    <option value="">Select column...</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description Column</label>
                  <select
                    value={columnMapping.description}
                    onChange={(e) => setColumnMapping({...columnMapping, description: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2"
                  >
                    <option value="">Select column...</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount Column</label>
                  <select
                    value={columnMapping.amount}
                    onChange={(e) => setColumnMapping({...columnMapping, amount: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2"
                  >
                    <option value="">Select column...</option>
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <button
                  onClick={confirmMapping}
                  disabled={!columnMapping.date || !columnMapping.description || !columnMapping.amount}
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                >
                  Auto-Categorize Transactions
                </button>
              </div>
            </div>
          )}

          {view === 'categorize' && (
            <div className="py-8">
              <h2 className="text-2xl font-semibold mb-6">Review & Adjust Categories</h2>
              
              {uncategorizedCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 font-medium">
                    {uncategorizedCount} transaction{uncategorizedCount > 1 ? 's' : ''} need{uncategorizedCount === 1 ? 's' : ''} manual categorization
                  </p>
                </div>
              )}

              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setView('categorize')}
                  className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
                >
                  All Transactions
                </button>
                <button
                  onClick={() => {
                    // Filter to show only uncategorized
                  }}
                  className="px-4 py-2 bg-yellow-100 rounded-lg text-sm"
                >
                  Uncategorized Only ({uncategorizedCount})
                </button>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {transactions.map(tx => (
                  <div 
                    key={tx.id} 
                    className={`flex items-center gap-4 p-4 rounded-lg ${
                      tx.category === 'Uncategorized' ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-sm text-gray-500">{tx.date}</p>
                    </div>
                    <p className="font-semibold text-lg">${tx.amount.toFixed(2)}</p>
                    <select
                      value={tx.category}
                      onChange={(e) => updateCategory(tx.id, e.target.value)}
                      className={`border rounded-lg px-4 py-2 min-w-[200px] ${
                        tx.category === 'Uncategorized' ? 'border-yellow-400 bg-white' : ''
                      }`}
                    >
                      <option value="Uncategorized">Uncategorized</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'summary' && (
            <div className="py-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Expense Summary</h2>
                <button
                  onClick={exportData}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Export CSV
                </button>
              </div>

              <div className="bg-indigo-50 p-6 rounded-lg mb-6">
                <p className="text-gray-600 mb-2">Total Expenses</p>
                <p className="text-4xl font-bold text-indigo-600">${totalExpenses.toFixed(2)}</p>
              </div>

              <div className="space-y-3">
                {getCategorySummary().map(([category, amount]) => {
                  const percentage = (amount / totalExpenses * 100).toFixed(1);
                  return (
                    <div key={category} className="bg-white border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{category}</span>
                        <span className="text-lg font-semibold">${amount.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{percentage}% of total</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="py-8">
              <h2 className="text-2xl font-semibold mb-6">Manage Categories</h2>
              
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                    placeholder="New category name"
                    className="flex-1 border rounded-lg px-4 py-2"
                  />
                  <button
                    onClick={addCategory}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    {editingCategory === cat ? (
                      <>
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && saveEditCategory()}
                          className="flex-1 border rounded px-3 py-1"
                          autoFocus
                        />
                        <button
                          onClick={saveEditCategory}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1">{cat}</span>
                        <button
                          onClick={() => startEditCategory(cat)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCategory(cat)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseCategorizer;
