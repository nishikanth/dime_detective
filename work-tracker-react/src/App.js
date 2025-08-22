import React, { useState, useEffect, useCallback } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Types
const calculateActualRate = (baseRate, percentage) => {
  const deduction = baseRate * (percentage / 100);
  return parseFloat((baseRate - deduction).toFixed(1));
};

const getMonthName = (month) => {
  const months = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December'
  };
  return months[month] || '';
};

const groupByYear = (records, getYear) => {
  return records.reduce((grouped, record) => {
    const year = getYear(record);
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(record);
    return grouped;
  }, {});
};

// Firebase service
const firebaseService = {
  signIn: () => signInWithPopup(auth, googleProvider),
  signOut: () => signOut(auth),
  saveData: async (userData) => {
    if (auth.currentUser) {
      await setDoc(doc(db, 'users', auth.currentUser.uid), userData);
      console.log('✅ Data saved to cloud');
    }
  },
  loadData: async () => {
    if (auth.currentUser) {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    }
    return null;
  }
};

// Authentication Component
const AuthScreen = ({ onSignIn }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await firebaseService.signIn();
      onSignIn(result.user);
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      console.error('Sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">💰 Work Tracker</h1>
          <p className="text-slate-300 mb-6">Sign in to access your financial data anywhere</p>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white/90 hover:bg-white border-2 border-white/20 rounded-xl font-medium text-slate-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-400 mt-4">
            Your data is securely stored and only accessible by you
          </p>
        </div>
      </div>
    </div>
  );
};

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-3 border-slate-400 border-t-blue-500 rounded-full animate-spin mb-4 mx-auto" />
      <p className="text-blue-400">Loading your data...</p>
    </div>
  </div>
);

// Company Management Component
const CompanyManagement = ({ companies, onAddCompany, onEditCompany, onDeleteCompany }) => {
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    percent: ''
  });

  const handleSubmit = () => {
    if (formData.name && formData.rate) {
      const baseRate = parseFloat(formData.rate);
      const deductionPercent = parseFloat(formData.percent) || 0;
      const actualRate = calculateActualRate(baseRate, deductionPercent);

      onAddCompany({
        name: formData.name.trim(),
        baseRate,
        deductionPercent,
        payRate: actualRate
      });

      setFormData({ name: '', rate: '', percent: '' });
    }
  };

  const handleEdit = (company) => {
    const newName = prompt('Enter new company name:', company.name);
    const newRate = prompt('Enter new base hourly rate:', company.baseRate.toString());
    const newPercent = prompt('Enter new deduction percentage:', company.deductionPercent.toString());

    if (newName && newRate) {
      const baseRate = parseFloat(newRate);
      const deductionPercent = parseFloat(newPercent) || 0;
      const actualRate = calculateActualRate(baseRate, deductionPercent);

      onEditCompany(company.id, {
        name: newName.trim(),
        baseRate,
        deductionPercent,
        payRate: actualRate
      });
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-white">🏢 Companies & Rates</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <input
          type="text"
          placeholder="Company name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg text-slate-200 placeholder-slate-400 focus:bg-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        <input
          type="number"
          placeholder="Hourly rate ($)"
          step="0.01"
          value={formData.rate}
          onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg text-slate-200 placeholder-slate-400 focus:bg-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        <input
          type="number"
          placeholder="Deduction %"
          step="0.01"
          min="0"
          max="100"
          value={formData.percent}
          onChange={(e) => setFormData({ ...formData, percent: e.target.value })}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg text-slate-200 placeholder-slate-400 focus:bg-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-400 hover:to-orange-500 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg font-medium"
        >
          + Add
        </button>
      </div>

      <div className="space-y-3">
        {companies.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No companies added yet.</div>
        ) : (
          companies.map((company) => (
            <div
              key={company.id}
              className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all"
            >
              <div>
                <h3 className="font-semibold text-white">{company.name}</h3>
                <p className="text-sm text-slate-300">
                  Base: ${company.baseRate.toFixed(2)}/hr{' '}
                  {company.deductionPercent > 0 && `(-${company.deductionPercent}%)`} = {' '}
                  <strong className="text-blue-400">${company.payRate.toFixed(2)}/hr</strong>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(company)}
                  className="px-3 py-1 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this company and all its work records?')) {
                      onDeleteCompany(company.id);
                    }
                  }}
                  className="px-3 py-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Main App Component
const WorkTracker = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [workRecords, setWorkRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [insurance, setInsurance] = useState([]);
  const [payroll, setPayroll] = useState([]);

  // Save data function
  const saveData = useCallback(async () => {
    if (!user) return;
    
    const data = {
      companies,
      workRecords,
      expenses,
      insurance,
      payroll
    };
    
    try {
      await firebaseService.saveData(data);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [user, companies, workRecords, expenses, insurance, payroll]);

  // Load data on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          const data = await firebaseService.loadData();
          if (data) {
            setCompanies(data.companies || []);
            setWorkRecords(data.workRecords || []);
            setExpenses(data.expenses || []);
            setInsurance(data.insurance || []);
            setPayroll(data.payroll || []);
          }
          console.log('✅ Data loaded from cloud');
        } catch (error) {
          console.error('Error loading data:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-save when data changes
  useEffect(() => {
    if (user && !loading) {
      saveData();
    }
  }, [user, companies, workRecords, expenses, insurance, payroll, saveData, loading]);

  // Calculate totals
  const calculateGrandTotals = useCallback(() => {
    const companyTotals = companies.reduce((sum, company) => {
      const companyRecords = workRecords.filter(r => r.companyId === company.id);
      const companyTotal = companyRecords.reduce((total, r) => total + (r.hours * r.rate), 0);
      return sum + companyTotal;
    }, 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalInsurance = insurance.reduce((sum, i) => sum + i.amount, 0);
    const totalPayroll = payroll.reduce((sum, p) => p.grossPay ? sum + p.grossPay : sum, 0);
    const grandTotal = companyTotals - totalExpenses - totalInsurance - totalPayroll;

    return { companyTotals, totalExpenses, totalInsurance, totalPayroll, grandTotal };
  }, [companies, workRecords, expenses, insurance, payroll]);

  // Event handlers
  const handleSignIn = (userData) => {
    setUser(userData);
  };

  const handleSignOut = async () => {
    try {
      await firebaseService.signOut();
      setUser(null);
      setCompanies([]);
      setWorkRecords([]);
      setExpenses([]);
      setInsurance([]);
      setPayroll([]);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleAddCompany = (companyData) => {
    const newCompany = { ...companyData, id: Date.now() };
    setCompanies(prev => [...prev, newCompany]);
  };

  const handleEditCompany = (id, companyData) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...companyData, id } : c));
  };

  const handleDeleteCompany = (id) => {
    setCompanies(prev => prev.filter(c => c.id !== id));
    setWorkRecords(prev => prev.filter(r => r.companyId !== id));
  };

  // Render loading screen
  if (loading) {
    return <LoadingScreen />;
  }

  // Render auth screen
  if (!user) {
    return <AuthScreen onSignIn={handleSignIn} />;
  }

  const totals = calculateGrandTotals();
  const hasData = companies.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-slate-200">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <h1 className="text-3xl font-bold text-white">💰 Work Hours & Earnings Tracker</h1>
            <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-full">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=3b82f6&color=fff`}
                alt="User"
                className="w-8 h-8 rounded-full border-2 border-blue-500/30"
              />
              <div className="text-right">
                <div className="text-sm font-medium text-white">{user.displayName || 'User'}</div>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-blue-300 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
          <p className="text-slate-300 mb-3">Track work, expenses, insurance, and payroll - complete financial overview</p>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-sm text-green-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Connected to Cloud
          </div>
        </div>

        {/* Company Management */}
        <CompanyManagement
          companies={companies}
          onAddCompany={handleAddCompany}
          onEditCompany={handleEditCompany}
          onDeleteCompany={handleDeleteCompany}
        />

        {/* Empty State */}
        {!hasData && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Companies Added</h3>
            <p className="text-slate-400">Add your first company above to start tracking!</p>
          </div>
        )}

        {/* Financial Summary */}
        {hasData && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 border border-blue-500/20 rounded-xl p-6 mt-6">
            <h3 className="text-xl font-bold mb-4 text-white">📊 Financial Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <span className="block text-sm opacity-75 text-slate-300">Work Income</span>
                <span className="block text-2xl font-bold text-green-400">+${totals.companyTotals.toFixed(2)}</span>
              </div>
              <div className="text-center">
                <span className="block text-sm opacity-75 text-slate-300">Total Received</span>
                <span className="block text-2xl font-bold text-red-400">-${totals.totalExpenses.toFixed(2)}</span>
              </div>
              <div className="text-center">
                <span className="block text-sm opacity-75 text-slate-300">Insurance</span>
                <span className="block text-2xl font-bold text-red-400">-${totals.totalInsurance.toFixed(2)}</span>
              </div>
              <div className="text-center">
                <span className="block text-sm opacity-75 text-slate-300">Payroll</span>
                <span className="block text-2xl font-bold text-red-400">-${totals.totalPayroll.toFixed(2)}</span>
              </div>
              <div className="text-center border-l-2 border-slate-600 pl-4">
                <span className="block text-sm opacity-75 text-slate-300">Net Total</span>
                <span className={`block text-3xl font-bold ${totals.grandTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totals.grandTotal >= 0 ? '+' : ''}${totals.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Export/Import Section */}
        {hasData && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400 mb-4">☁️ Data automatically synced to cloud</p>
            <div className="flex justify-center gap-4">
              <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-400 hover:to-orange-500 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                📥 Export to Excel
              </button>
              <label className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-400 hover:to-emerald-500 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer">
                📤 Import from Excel
                <input type="file" accept=".xlsx,.xls" className="hidden" />
              </label>
              <button
                onClick={() => {
                  if (window.confirm('Delete ALL data permanently?\n\nThis cannot be undone!')) {
                    setCompanies([]);
                    setWorkRecords([]);
                    setExpenses([]);
                    setInsurance([]);
                    setPayroll([]);
                    alert('All data cleared.');
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-400 hover:to-red-500 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkTracker;