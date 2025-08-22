import React, { useState, useEffect, useCallback } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
    <div className="min-h-screen bg-gradient flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-bg rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">💰 Work Tracker</h1>
          <p className="text-slate-300 mb-6">Sign in to access your financial data anywhere</p>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 btn-white transition-all hover-lift hover-shadow disabled-opacity cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 animate-spin" style={{border: '2px solid #ccc', borderTop: '2px solid #3498db', borderRadius: '50%'}} />
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
            <div className="mb-4 p-3" style={{background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#fca5a5', fontSize: '0.875rem'}}>
              {error}
            </div>
          )}

          <p className="text-sm text-slate-300 mb-4">
            Your data is securely stored and only accessible by you
          </p>
        </div>
      </div>
    </div>
  );
};

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 animate-spin mx-auto mb-4" style={{border: '3px solid #cbd5e1', borderTop: '3px solid #3b82f6', borderRadius: '50%'}} />
      <p className="text-blue-400">Loading your data...</p>
    </div>
  </div>
);

// Company Manager Component
const CompanyManager = ({ companies, onAddCompany, onEditCompany, onDeleteCompany }) => {
  const [formData, setFormData] = useState({ name: '', rate: '', percent: '' });
  const [editing, setEditing] = useState(null);

  const handleSubmit = () => {
    if (!formData.name || !formData.rate) return;
    
    const companyData = {
      name: formData.name,
      baseRate: parseFloat(formData.rate),
      deductionPercent: parseFloat(formData.percent) || 0,
      payRate: parseFloat(formData.rate) - (parseFloat(formData.rate) * (parseFloat(formData.percent) || 0) / 100)
    };

    if (editing) {
      onEditCompany(editing.id, companyData);
      setEditing(null);
    } else {
      onAddCompany(companyData);
    }
    
    setFormData({ name: '', rate: '', percent: '' });
  };

  const handleEdit = (company) => {
    setFormData({
      name: company.name,
      rate: company.baseRate.toString(),
      percent: company.deductionPercent.toString()
    });
    setEditing(company);
  };

  return (
    <div className="glass-bg rounded-2xl p-6 mb-8">
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        🏢 Companies & Rates
      </h2>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Company name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem', color: 'white'}}
        />
        <input
          type="number"
          placeholder="Hourly rate ($)"
          step="0.01"
          value={formData.rate}
          onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
          style={{padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem', color: 'white'}}
        />
        <input
          type="number"
          placeholder="Deduction %"
          step="0.01"
          min="0"
          max="100"
          value={formData.percent}
          onChange={(e) => setFormData({ ...formData, percent: e.target.value })}
          style={{padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem', color: 'white'}}
        />
        <button
          onClick={handleSubmit}
          className="btn-primary px-6 py-2 font-medium"
        >
          {editing ? 'Update' : '+ Add'}
        </button>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
        {companies.length === 0 ? (
          <div className="text-center py-8 text-slate-300">No companies added yet.</div>
        ) : (
          companies.map((company) => (
            <div
              key={company.id}
              className="flex items-center justify-between p-4 glass-bg transition-all"
              style={{borderRadius: '0.5rem'}}
            >
              <div>
                <h3 className="font-medium text-white">{company.name}</h3>
                <p className="text-sm text-slate-300">
                  Base: ${company.baseRate.toFixed(2)}/hr{' '}
                  {company.deductionPercent > 0 && `(-${company.deductionPercent}%)`} = {' '}
                  <strong className="text-blue-400">${company.payRate.toFixed(2)}/hr</strong>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(company)}
                  style={{padding: '0.25rem 0.75rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '0.25rem', border: 'none', cursor: 'pointer'}}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this company and all its work records?')) {
                      onDeleteCompany(company.id);
                    }
                  }}
                  style={{padding: '0.25rem 0.75rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '0.25rem', border: 'none', cursor: 'pointer'}}
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

  return (
    <div className="min-h-screen bg-gradient text-slate-200">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <h1 className="text-3xl font-bold text-white">💰 Work Hours & Earnings Tracker</h1>
            <div className="flex items-center gap-3 px-4 py-2 glass-bg-blue rounded-full">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=3b82f6&color=fff`}
                alt="User"
                className="w-8 h-8 rounded-full"
                style={{border: '2px solid rgba(59, 130, 246, 0.3)'}}
              />
              <div className="text-right">
                <div className="text-sm font-medium text-white">{user.displayName || 'User'}</div>
                <button
                  onClick={handleSignOut}
                  className="text-blue-400 hover-shadow"
                  style={{fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer'}}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Company Manager */}
        <CompanyManager
          companies={companies}
          onAddCompany={handleAddCompany}
          onEditCompany={handleEditCompany}
          onDeleteCompany={handleDeleteCompany}
        />

        {/* Financial Summary */}
        <div className="glass-bg rounded-2xl p-6">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            📊 Financial Summary
          </h2>
          <div className="text-center">
            <div className="text-slate-300 mb-2">Work Income: <span className="text-white font-bold">+$0.00</span></div>
            <div className="text-slate-300 mb-2">Total Received: <span className="text-white font-bold">-$0.00</span></div>
            <div className="text-slate-300 mb-2">Insurance: <span className="text-white font-bold">-$0.00</span></div>
            <div className="text-slate-300 mb-2">Payroll: <span className="text-white font-bold">-$0.00</span></div>
            <div className="text-slate-300 mb-4">Net Total: <span className="text-white font-bold">+$0.00</span></div>
            <div className="text-slate-300 text-sm mb-4">☁️ Data automatically synced to cloud</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkTracker;