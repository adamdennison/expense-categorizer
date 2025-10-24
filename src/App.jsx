import React, { useState } from 'react';
import { Upload, Download, PieChart, TrendingUp, Settings, Plus, X, Edit2, Check } from 'lucide-react';
import Papa from 'papaparse';

const ExpenseCategorizer = () => {
  const defaultCategories = [
    'Office Supplies', 'Travel', 'Meals & Entertainment', 'Professional Services',
    'Marketing & Advertising', 'Utilities', 'Rent/Lease', 'Insurance',
    'Software & Subscriptions', 'Equipment', 'Bank Fees', 'Other'
  ];

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
          setView('mapping'
