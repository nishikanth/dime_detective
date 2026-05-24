import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

// ── Constants ─────────────────────────────────────────────────────────────
const MONTHS = [
  { value: '01', label: 'January' },  { value: '02', label: 'February' },
  { value: '03', label: 'March' },    { value: '04', label: 'April' },
  { value: '05', label: 'May' },      { value: '06', label: 'June' },
  { value: '07', label: 'July' },     { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS = ['2022', '2023', '2024', '2025', '2026'];

const fmt = (n) =>
  '$' + (+(n) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ── Firebase service ──────────────────────────────────────────────────────
const firebaseService = {
  signIn: () => signInWithPopup(auth, googleProvider),
  signOut: () => signOut(auth),
  saveData: async (data) => {
    if (auth.currentUser) {
      await setDoc(doc(db, 'users', auth.currentUser.uid), data);
    }
  },
  loadData: async () => {
    if (auth.currentUser) {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      return snap.exists() ? snap.data() : null;
    }
    return null;
  },
};

// ── Toast system ──────────────────────────────────────────────────────────
const ToastCtx = createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

const useToast = () => useContext(ToastCtx);

// ── Auth Screen ───────────────────────────────────────────────────────────
const AuthScreen = ({ onSignIn }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await firebaseService.signIn();
      onSignIn(result.user);
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-badge">💰</div>
          <h1 className="auth-title">Dime Detective</h1>
          <p className="auth-subtitle">Your personal financial command center</p>
        </div>

        <div className="auth-features">
          {[
            { icon: '⏱️', text: 'Track work hours & earnings per company' },
            { icon: '📊', text: 'Dashboard with charts & financial summary' },
            { icon: '☁️', text: 'Cloud sync — access anywhere, anytime' },
          ].map(f => (
            <div key={f.text} className="auth-feature">
              <span className="auth-feature-icon">{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        <button onClick={handleSignIn} disabled={loading} className="google-btn">
          {loading ? (
            <div className="spinner" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        {error && <div className="auth-error">{error}</div>}
        <p className="auth-privacy">🔒 Your data is securely stored and only accessible by you</p>
      </div>
    </div>
  );
};

// ── Loading Screen ────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="auth-page">
    <div className="auth-orb auth-orb-1" />
    <div className="auth-orb auth-orb-2" />
    <div style={{ textAlign: 'center' }}>
      <div className="spinner spinner-lg" style={{ margin: '0 auto 1rem' }} />
      <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading your data…</p>
    </div>
  </div>
);

// ── Metric Card ───────────────────────────────────────────────────────────
const MetricCard = ({ label, value, color, icon, sub }) => (
  <div className={`metric-card metric-${color}`}>
    <div className="metric-top">
      <span className="metric-label">{label}</span>
      <span className="metric-icon-badge">{icon}</span>
    </div>
    <div className="metric-value">{value}</div>
    {sub && <div className="metric-sub">{sub}</div>}
  </div>
);

// ── Income Chart (SVG bar chart) ──────────────────────────────────────────
const IncomeChart = ({ workRecords, expenses, insurance, payroll }) => {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { key, label: MONTH_SHORT[d.getMonth()] };
  });

  const data = months.map(({ key, label }) => {
    const income = workRecords
      .filter(r => r.monthKey === key)
      .reduce((s, r) => s + r.hours * r.rate, 0);
    const exp = expenses
      .filter(e => e.date && e.date.startsWith(key))
      .reduce((s, e) => s + e.amount, 0);
    const ins = insurance
      .filter(i => i.monthKey === key)
      .reduce((s, i) => s + i.amount, 0);
    const pay = payroll
      .filter(p => p.monthKey === key)
      .reduce((s, p) => s + p.grossPay, 0);
    return { label, income, net: Math.max(income - exp - ins - pay, 0) };
  });

  const maxVal = Math.max(...data.map(d => d.income), 1);
  const BAR_H = 110;
  const COL_W = 72;

  return (
    <div className="chart-container">
      <div className="chart-header">
        <span className="chart-title">6-Month Earnings Overview</span>
        <div className="chart-legend">
          <span className="legend-dot legend-blue" /> Income
          <span className="legend-dot legend-green" style={{ marginLeft: '0.75rem' }} /> Net
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${months.length * COL_W} ${BAR_H + 36}`} preserveAspectRatio="xMidYMid meet">
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map(t => (
          <line
            key={t}
            x1={0} y1={BAR_H * (1 - t)}
            x2={months.length * COL_W} y2={BAR_H * (1 - t)}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1"
          />
        ))}
        {data.map((d, i) => {
          const x = i * COL_W + 8;
          const incH = (d.income / maxVal) * BAR_H;
          const netH = (d.net / maxVal) * BAR_H;
          return (
            <g key={d.label}>
              {/* Income bar */}
              <rect x={x} y={BAR_H - incH} width={24} height={incH}
                fill="url(#blueGrad)" rx="3" opacity="0.85" />
              {/* Net bar */}
              <rect x={x + 28} y={BAR_H - netH} width={24} height={netH}
                fill="url(#greenGrad)" rx="3" opacity="0.85" />
              {/* Month label */}
              <text x={x + 28} y={BAR_H + 18} textAnchor="middle" fill="#64748b" fontSize="10"
                fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">{d.label}</text>
              {/* Income value */}
              {d.income > 0 && (
                <text x={x + 12} y={BAR_H - incH - 5} textAnchor="middle" fill="#93c5fd" fontSize="8"
                  fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
                  {d.income >= 1000 ? `${(d.income / 1000).toFixed(1)}k` : d.income.toFixed(0)}
                </text>
              )}
            </g>
          );
        })}
        <defs>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// ── Company Manager ───────────────────────────────────────────────────────
const CompanyManager = ({ companies, onAddCompany, onEditCompany, onDeleteCompany }) => {
  const [form, setForm] = useState({ name: '', rate: '', percent: '' });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  const handleSubmit = () => {
    if (!form.name.trim() || !form.rate) return;
    const base = parseFloat(form.rate);
    const pct = parseFloat(form.percent) || 0;
    const data = {
      name: form.name.trim(),
      baseRate: base,
      deductionPercent: pct,
      payRate: base * (1 - pct / 100),
    };
    if (editing) {
      onEditCompany(editing.id, data);
      toast('Company updated!');
      setEditing(null);
    } else {
      onAddCompany(data);
      toast('Company added!');
    }
    setForm({ name: '', rate: '', percent: '' });
    setShowForm(false);
  };

  const startEdit = (c) => {
    setForm({ name: c.name, rate: c.baseRate.toString(), percent: c.deductionPercent.toString() });
    setEditing(c);
    setShowForm(true);
  };

  const cancelForm = () => { setShowForm(false); setEditing(null); setForm({ name: '', rate: '', percent: '' }); };

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title-inline">🏢 Companies & Rates</h2>
        <button className="btn btn-primary" onClick={() => showForm && !editing ? cancelForm() : setShowForm(true)}>
          {showForm && !editing ? '✕ Cancel' : '+ Add Company'}
        </button>
      </div>

      {showForm && (
        <div className="form-card animate-in">
          <div className="form-grid form-grid-3">
            <div className="form-field">
              <label className="form-label">Company Name</label>
              <input className="form-input" type="text" placeholder="Acme Corp" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <div className="form-field">
              <label className="form-label">Base Rate ($/hr)</label>
              <input className="form-input" type="number" placeholder="75.00" step="0.01" value={form.rate}
                onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-label">Deduction %</label>
              <input className="form-input" type="number" placeholder="0" step="0.01" min="0" max="100" value={form.percent}
                onChange={e => setForm(f => ({ ...f, percent: e.target.value }))} />
            </div>
          </div>
          {form.rate && (
            <div className="form-preview">
              Effective pay rate: <strong>{fmt(parseFloat(form.rate || 0) * (1 - parseFloat(form.percent || 0) / 100))}/hr</strong>
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={cancelForm}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editing ? '✓ Update Company' : '+ Add Company'}
            </button>
          </div>
        </div>
      )}

      {companies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h3>No companies yet</h3>
          <p>Add your first company to start tracking work hours</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>
            + Add Your First Company
          </button>
        </div>
      ) : (
        <div className="company-grid">
          {companies.map(c => (
            <div key={c.id} className="company-card">
              <div className="company-card-header">
                <div className="company-avatar">{c.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="company-name">{c.name}</div>
                  <div className="company-rate">{fmt(c.payRate)}/hr</div>
                </div>
              </div>
              {c.deductionPercent > 0 && (
                <div className="company-deduction">
                  Base {fmt(c.baseRate)} − {c.deductionPercent}% deduction = {fmt(c.payRate)}/hr net
                </div>
              )}
              <div className="company-actions">
                <button className="btn btn-ghost-blue btn-sm" onClick={() => startEdit(c)}>✏️ Edit</button>
                <button className="btn btn-ghost-red btn-sm" onClick={() => {
                  if (window.confirm(`Delete "${c.name}" and all its work records?`)) {
                    onDeleteCompany(c.id);
                    toast('Company deleted');
                  }
                }}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Work Entry Section ────────────────────────────────────────────────────
const WorkEntrySection = ({ companies, workRecords, onAddRecord, onDeleteRecord }) => {
  const [form, setForm] = useState({ companyId: '', month: '', year: '2025', hours: '', rate: '' });
  const toast = useToast();

  const handleCompanyChange = (cid) => {
    const c = companies.find(x => x.id === parseInt(cid));
    setForm(f => ({ ...f, companyId: cid, rate: c ? c.payRate.toFixed(2) : '' }));
  };

  const handleSubmit = () => {
    const { companyId, month, year, hours, rate } = form;
    if (!companyId || !month || !year || !hours || !rate) {
      toast('Please fill in all fields', 'error');
      return;
    }
    onAddRecord({
      id: Date.now(),
      companyId: parseInt(companyId),
      monthKey: `${year}-${month}`,
      month,
      year: parseInt(year),
      hours: parseFloat(hours),
      rate: parseFloat(rate),
    });
    setForm(f => ({ ...f, month: '', hours: '' }));
    toast('Work entry saved!');
  };

  const grouped = {};
  workRecords.forEach(r => {
    const c = companies.find(x => x.id === r.companyId);
    if (!c) return;
    if (!grouped[c.id]) grouped[c.id] = { company: c, records: [] };
    grouped[c.id].records.push(r);
  });

  return (
    <div>
      <h2 className="section-title">⏱️ Work Entries</h2>

      {companies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <p>Add a company first before logging work entries</p>
        </div>
      ) : (
        <div className="form-card">
          <div className="form-grid form-grid-5">
            <div className="form-field">
              <label className="form-label">Company</label>
              <select className="form-input" value={form.companyId} onChange={e => handleCompanyChange(e.target.value)}>
                <option value="">Select…</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Month</label>
              <select className="form-input" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
                <option value="">Month…</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Year</label>
              <select className="form-input" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Hours Worked</label>
              <input className="form-input" type="number" placeholder="160" step="0.5" value={form.hours}
                onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-label">Rate ($/hr)</label>
              <input className="form-input" type="number" placeholder="75.00" step="0.01" value={form.rate}
                onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
            </div>
          </div>
          {form.hours && form.rate && (
            <div className="form-preview">
              Estimated earnings: <strong>{fmt(parseFloat(form.hours || 0) * parseFloat(form.rate || 0))}</strong>
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-green" onClick={handleSubmit}>+ Add Entry</button>
          </div>
        </div>
      )}

      {Object.values(grouped).map(({ company, records }) => {
        const total = records.reduce((s, r) => s + r.hours * r.rate, 0);
        const totalHrs = records.reduce((s, r) => s + r.hours, 0);
        const sorted = [...records].sort((a, b) => b.monthKey.localeCompare(a.monthKey));
        return (
          <div key={company.id} className="data-section">
            <div className="data-section-header">
              <div>
                <span style={{ fontWeight: 600 }}>{company.name}</span>
                <span className="data-section-meta"> · {totalHrs.toFixed(1)}h total</span>
              </div>
              <span className="data-section-total">{fmt(total)}</span>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Period</th><th>Hours</th><th>Rate</th><th>Earnings</th><th></th></tr>
              </thead>
              <tbody>
                {sorted.map(r => (
                  <tr key={r.id}>
                    <td>{MONTHS.find(m => m.value === r.month)?.label} {r.year}</td>
                    <td>{r.hours}h</td>
                    <td className="td-muted">{fmt(r.rate)}/hr</td>
                    <td className="amount-positive">{fmt(r.hours * r.rate)}</td>
                    <td>
                      <button className="btn-del" onClick={() => { onDeleteRecord(r.id); toast('Entry deleted'); }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {workRecords.length === 0 && companies.length > 0 && (
        <div className="empty-state">
          <div className="empty-icon">⏱️</div>
          <p>No work entries yet. Use the form above to add your first entry.</p>
        </div>
      )}
    </div>
  );
};

// ── Expenses / Received Section ───────────────────────────────────────────
const ExpensesSection = ({ expenses, onAddExpense, onDeleteExpense }) => {
  const [form, setForm] = useState({ date: '', name: '', type: '', amount: '' });
  const toast = useToast();

  const handleSubmit = () => {
    const { date, name, type, amount } = form;
    if (!date || !name || !type || !amount) {
      toast('Please fill in all fields', 'error');
      return;
    }
    onAddExpense({ id: Date.now(), date, name, type, amount: parseFloat(amount) });
    setForm({ date: '', name: '', type: '', amount: '' });
    toast('Entry added!');
  };

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const businessTotal = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const otherTotal = expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <h2 className="section-title">💳 Received</h2>

      <div className="form-card">
        <div className="form-grid form-grid-4">
          <div className="form-field">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Description</label>
            <input className="form-input" type="text" placeholder="Client payment" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Type</label>
            <select className="form-input" value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="">Select type…</option>
              <option value="expense">💸 Business Received</option>
              <option value="income">💰 Other Received</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Amount ($)</label>
            <input className="form-input" type="number" placeholder="500.00" step="0.01" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-purple" onClick={handleSubmit}>+ Add Entry</button>
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="summary-chips">
          <div className="chip chip-purple">Business: {fmt(businessTotal)}</div>
          <div className="chip chip-green">Other: {fmt(otherTotal)}</div>
          <div className="chip chip-white">Total: {fmt(total)}</div>
        </div>
      )}

      {sorted.length > 0 ? (
        <div className="data-section">
          <div className="data-section-header">
            <span>All Entries ({expenses.length})</span>
            <span className="data-section-total">{fmt(total)}</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th><th></th></tr>
            </thead>
            <tbody>
              {sorted.map(e => (
                <tr key={e.id}>
                  <td className="td-muted">{e.date}</td>
                  <td>{e.name}</td>
                  <td>
                    <span className={`badge ${e.type === 'income' ? 'badge-green' : 'badge-purple'}`}>
                      {e.type === 'income' ? '💰 Other' : '💸 Business'}
                    </span>
                  </td>
                  <td className="amount-positive">{fmt(e.amount)}</td>
                  <td><button className="btn-del" onClick={() => { onDeleteExpense(e.id); toast('Entry deleted'); }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <p>No received entries yet. Track payments and income above.</p>
        </div>
      )}
    </div>
  );
};

// ── Insurance Section ─────────────────────────────────────────────────────
const InsuranceSection = ({ insurance, onAddInsurance, onDeleteInsurance }) => {
  const [form, setForm] = useState({ month: '', year: '2025', amount: '' });
  const toast = useToast();

  const handleSubmit = () => {
    const { month, year, amount } = form;
    if (!month || !year || !amount) {
      toast('Please fill in all fields', 'error');
      return;
    }
    onAddInsurance({
      id: Date.now(),
      monthKey: `${year}-${month}`,
      month,
      year: parseInt(year),
      amount: parseFloat(amount),
    });
    setForm(f => ({ ...f, month: '', amount: '' }));
    toast('Insurance entry added!');
  };

  const sorted = [...insurance].sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  const total = insurance.reduce((s, i) => s + i.amount, 0);
  const avgMonthly = insurance.length > 0 ? total / insurance.length : 0;

  return (
    <div>
      <h2 className="section-title">🛡️ Insurance Payments</h2>

      <div className="form-card">
        <div className="form-grid form-grid-3">
          <div className="form-field">
            <label className="form-label">Month</label>
            <select className="form-input" value={form.month}
              onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
              <option value="">Month…</option>
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Year</label>
            <select className="form-input" value={form.year}
              onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Amount ($)</label>
            <input className="form-input" type="number" placeholder="250.00" step="0.01" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-red" onClick={handleSubmit}>+ Add Payment</button>
        </div>
      </div>

      {insurance.length > 0 && (
        <div className="summary-chips">
          <div className="chip chip-red">Total Paid: {fmt(total)}</div>
          <div className="chip chip-white">Monthly Avg: {fmt(avgMonthly)}</div>
        </div>
      )}

      {sorted.length > 0 ? (
        <div className="data-section">
          <div className="data-section-header">
            <span>All Payments ({insurance.length})</span>
            <span className="data-section-total">{fmt(total)}</span>
          </div>
          <table className="data-table">
            <thead><tr><th>Period</th><th>Amount</th><th></th></tr></thead>
            <tbody>
              {sorted.map(i => (
                <tr key={i.id}>
                  <td>{MONTHS.find(m => m.value === i.month)?.label} {i.year}</td>
                  <td className="amount-negative">{fmt(i.amount)}</td>
                  <td><button className="btn-del" onClick={() => { onDeleteInsurance(i.id); toast('Entry deleted'); }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🛡️</div>
          <p>No insurance payments recorded yet.</p>
        </div>
      )}
    </div>
  );
};

// ── Payroll Section ───────────────────────────────────────────────────────
const PayrollSection = ({ payroll, onAddPayroll, onDeletePayroll }) => {
  const [form, setForm] = useState({ month: '', year: '2025', hours: '', rate: '', gross: '' });
  const toast = useToast();

  const handleSubmit = () => {
    const { month, year, hours, rate, gross } = form;
    if (!month || !year || !hours) {
      toast('Month, year and hours are required', 'error');
      return;
    }
    const h = parseFloat(hours);
    const r = parseFloat(rate) || 0;
    const g = parseFloat(gross) || 0;
    const finalGross = g || r * h;
    const finalRate = r || (h > 0 ? g / h : 0);
    onAddPayroll({
      id: Date.now(),
      monthKey: `${year}-${month}`,
      month,
      year: parseInt(year),
      hours: h,
      rate: finalRate,
      grossPay: finalGross,
    });
    setForm(f => ({ ...f, month: '', hours: '', rate: '', gross: '' }));
    toast('Payroll entry added!');
  };

  const sorted = [...payroll].sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  const total = payroll.reduce((s, p) => s + p.grossPay, 0);
  const totalHours = payroll.reduce((s, p) => s + p.hours, 0);

  return (
    <div>
      <h2 className="section-title">💼 Payroll</h2>

      <div className="form-card">
        <div className="form-grid form-grid-5">
          <div className="form-field">
            <label className="form-label">Month</label>
            <select className="form-input" value={form.month}
              onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
              <option value="">Month…</option>
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Year</label>
            <select className="form-input" value={form.year}
              onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Hours</label>
            <input className="form-input" type="number" placeholder="160" step="0.5" value={form.hours}
              onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Rate (optional)</label>
            <input className="form-input" type="number" placeholder="50.00" step="0.01" value={form.rate}
              onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Gross Pay ($)</label>
            <input className="form-input" type="number" placeholder="8000.00" step="0.01" value={form.gross}
              onChange={e => setForm(f => ({ ...f, gross: e.target.value }))} />
          </div>
        </div>
        <p className="form-hint">💡 Enter Hours + Rate OR Hours + Gross Pay (rate auto-calculated)</p>
        <div className="form-actions">
          <button className="btn btn-blue" onClick={handleSubmit}>+ Add Entry</button>
        </div>
      </div>

      {payroll.length > 0 && (
        <div className="summary-chips">
          <div className="chip chip-blue">Total Payroll: {fmt(total)}</div>
          <div className="chip chip-white">Total Hours: {totalHours.toFixed(1)}h</div>
          <div className="chip chip-white">Avg Gross: {fmt(payroll.length > 0 ? total / payroll.length : 0)}/mo</div>
        </div>
      )}

      {sorted.length > 0 ? (
        <div className="data-section">
          <div className="data-section-header">
            <span>All Entries ({payroll.length})</span>
            <span className="data-section-total">{fmt(total)}</span>
          </div>
          <table className="data-table">
            <thead><tr><th>Period</th><th>Hours</th><th>Rate</th><th>Gross Pay</th><th></th></tr></thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.id}>
                  <td>{MONTHS.find(m => m.value === p.month)?.label} {p.year}</td>
                  <td>{p.hours}h</td>
                  <td className="td-muted">{fmt(p.rate)}/hr</td>
                  <td className="amount-positive">{fmt(p.grossPay)}</td>
                  <td><button className="btn-del" onClick={() => { onDeletePayroll(p.id); toast('Entry deleted'); }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">💼</div>
          <p>No payroll entries yet. Track your salary here.</p>
        </div>
      )}
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────
const Dashboard = ({ companies, workRecords, expenses, insurance, payroll }) => {
  const totalWork = workRecords.reduce((s, r) => s + r.hours * r.rate, 0);
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIns = insurance.reduce((s, i) => s + i.amount, 0);
  const totalPay = payroll.reduce((s, p) => s + p.grossPay, 0);
  const netTotal = totalWork - totalExp - totalIns - totalPay;

  const now = new Date();
  const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthWork = workRecords.filter(r => r.monthKey === thisKey).reduce((s, r) => s + r.hours * r.rate, 0);
  const monthHours = workRecords.filter(r => r.monthKey === thisKey).reduce((s, r) => s + r.hours, 0);
  const totalHours = workRecords.reduce((s, r) => s + r.hours, 0);

  // Top earning company
  const companyEarnings = companies.map(c => ({
    name: c.name,
    total: workRecords.filter(r => r.companyId === c.id).reduce((s, r) => s + r.hours * r.rate, 0),
  })).sort((a, b) => b.total - a.total);

  return (
    <div>
      <h2 className="section-title">📊 Dashboard</h2>

      <div className="metrics-grid">
        <MetricCard
          label="Total Work Income"
          value={fmt(totalWork)}
          color="blue"
          icon="💼"
          sub={`${totalHours.toFixed(0)} total hours`}
        />
        <MetricCard
          label="Total Received"
          value={fmt(totalExp)}
          color="purple"
          icon="💳"
          sub={`${expenses.length} entries`}
        />
        <MetricCard
          label="Insurance Paid"
          value={fmt(totalIns)}
          color="red"
          icon="🛡️"
          sub={`${insurance.length} payments`}
        />
        <MetricCard
          label="Payroll Total"
          value={fmt(totalPay)}
          color="orange"
          icon="👤"
          sub={`${payroll.length} entries`}
        />
        <MetricCard
          label="Net Total"
          value={fmt(netTotal)}
          color={netTotal >= 0 ? 'green' : 'red'}
          icon={netTotal >= 0 ? '📈' : '📉'}
          sub="income − all deductions"
        />
        <MetricCard
          label={`${MONTH_SHORT[now.getMonth()]} Earnings`}
          value={fmt(monthWork)}
          color="teal"
          icon="📅"
          sub={`${monthHours.toFixed(1)}h this month`}
        />
      </div>

      <div className="dashboard-bottom">
        <IncomeChart
          workRecords={workRecords}
          expenses={expenses}
          insurance={insurance}
          payroll={payroll}
        />
        <div className="stats-panel">
          <div className="stats-title">Quick Stats</div>
          {[
            ['Companies', companies.length],
            ['Work Entries', workRecords.length],
            ['Total Hours', `${totalHours.toFixed(1)}h`],
            ['Avg Rate', totalHours > 0 ? `${fmt(totalWork / totalHours)}/hr` : '—'],
            ['Received Entries', expenses.length],
            ['Insurance Payments', insurance.length],
            ['Payroll Entries', payroll.length],
          ].map(([label, val]) => (
            <div key={label} className="stat-row">
              <span>{label}</span>
              <span>{val}</span>
            </div>
          ))}
          {companyEarnings.length > 0 && (
            <>
              <div className="stats-divider" />
              <div className="stats-subtitle">Top Earners</div>
              {companyEarnings.slice(0, 3).map(c => (
                <div key={c.name} className="stat-row">
                  <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span className="amount-positive-sm">{fmt(c.total)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Excel export ──────────────────────────────────────────────────────────
const doExport = (companies, workRecords, expenses, insurance, payroll) => {
  const wb = XLSX.utils.book_new();

  const wData = workRecords.map(r => {
    const c = companies.find(x => x.id === r.companyId);
    return {
      Company: c?.name || 'Unknown',
      Month: MONTHS.find(m => m.value === r.month)?.label || r.month,
      Year: r.year,
      Hours: r.hours,
      'Rate ($/hr)': r.rate,
      'Earnings ($)': r.hours * r.rate,
    };
  });
  if (wData.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wData), 'Work Records');

  const eData = expenses.map(e => ({ Date: e.date, Description: e.name, Type: e.type, 'Amount ($)': e.amount }));
  if (eData.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eData), 'Received');

  const iData = insurance.map(i => ({
    Month: MONTHS.find(m => m.value === i.month)?.label || i.month,
    Year: i.year, 'Amount ($)': i.amount,
  }));
  if (iData.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(iData), 'Insurance');

  const pData = payroll.map(p => ({
    Month: MONTHS.find(m => m.value === p.month)?.label || p.month,
    Year: p.year, Hours: p.hours, 'Rate ($/hr)': p.rate, 'Gross Pay ($)': p.grossPay,
  }));
  if (pData.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pData), 'Payroll');

  XLSX.writeFile(wb, 'dime_detective_export.xlsx');
};

// ── Main WorkTracker ──────────────────────────────────────────────────────
const WorkTracker = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syncStatus, setSyncStatus] = useState('synced');
  const [companies, setCompanies] = useState([]);
  const [workRecords, setWorkRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [insurance, setInsurance] = useState([]);
  const [payroll, setPayroll] = useState([]);

  const saveData = useCallback(async () => {
    if (!user) return;
    setSyncStatus('syncing');
    try {
      await firebaseService.saveData({ companies, workRecords, expenses, insurance, payroll });
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, [user, companies, workRecords, expenses, insurance, payroll]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const data = await firebaseService.loadData();
          if (data) {
            setCompanies(data.companies || []);
            setWorkRecords(data.workRecords || []);
            setExpenses(data.expenses || []);
            setInsurance(data.insurance || []);
            setPayroll(data.payroll || []);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user && !loading) {
      const t = setTimeout(saveData, 1200);
      return () => clearTimeout(t);
    }
  }, [user, companies, workRecords, expenses, insurance, payroll, saveData, loading]);

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthScreen onSignIn={setUser} />;

  // Data handlers
  const addCompany = (d) => setCompanies(p => [...p, { ...d, id: Date.now() }]);
  const editCompany = (id, d) => setCompanies(p => p.map(c => c.id === id ? { ...d, id } : c));
  const deleteCompany = (id) => {
    setCompanies(p => p.filter(c => c.id !== id));
    setWorkRecords(p => p.filter(r => r.companyId !== id));
  };
  const addWorkRecord = (r) => setWorkRecords(p => {
    const idx = p.findIndex(x => x.companyId === r.companyId && x.monthKey === r.monthKey);
    return idx >= 0 ? p.map((x, i) => i === idx ? { ...x, hours: r.hours, rate: r.rate } : x) : [...p, r];
  });
  const deleteWorkRecord = (id) => setWorkRecords(p => p.filter(r => r.id !== id));
  const addExpense = (e) => setExpenses(p => [...p, e]);
  const deleteExpense = (id) => setExpenses(p => p.filter(e => e.id !== id));
  const addInsurance = (i) => setInsurance(p => {
    const idx = p.findIndex(x => x.monthKey === i.monthKey);
    return idx >= 0 ? p.map((x, j) => j === idx ? { ...x, amount: i.amount } : x) : [...p, i];
  });
  const deleteInsurance = (id) => setInsurance(p => p.filter(i => i.id !== id));
  const addPayroll = (pr) => setPayroll(p => {
    const idx = p.findIndex(x => x.monthKey === pr.monthKey);
    return idx >= 0 ? p.map((x, j) => j === idx ? { ...pr, id: x.id } : x) : [...p, pr];
  });
  const deletePayroll = (id) => setPayroll(p => p.filter(pr => pr.id !== id));

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'companies', label: 'Companies', icon: '🏢' },
    { id: 'work', label: 'Work', icon: '⏱️' },
    { id: 'received', label: 'Received', icon: '💳' },
    { id: 'insurance', label: 'Insurance', icon: '🛡️' },
    { id: 'payroll', label: 'Payroll', icon: '💼' },
  ];

  const syncLabel = { synced: 'Saved', syncing: 'Saving…', error: 'Error' }[syncStatus];

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">💰</span>
          <span className="sidebar-logo-text">Dime Detective</span>
        </div>

        <nav className="sidebar-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'nav-item-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="sidebar-export-btn"
            onClick={() => doExport(companies, workRecords, expenses, insurance, payroll)}
          >
            <span>📥</span> Export to Excel
          </button>

          <div className="sidebar-user">
            <img
              src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=3b82f6&color=fff`}
              alt="avatar"
              className="user-avatar"
              onError={e => { e.target.src = `https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff`; }}
            />
            <div className="user-info">
              <div className="user-name">{user.displayName || 'User'}</div>
              <button className="sign-out-btn" onClick={() => firebaseService.signOut()}>Sign out</button>
            </div>
            <div className={`sync-indicator sync-${syncStatus}`} title={syncLabel}>
              <div className="sync-dot-inner" />
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        {/* Mobile header */}
        <div className="mobile-header">
          <span className="mobile-logo">💰 Dime Detective</span>
          <div className={`sync-indicator sync-${syncStatus} sync-sm`}>
            <div className="sync-dot-inner" />
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="mobile-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`mobile-tab ${activeTab === t.id ? 'mobile-tab-active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span>{t.icon}</span>
              <span className="mobile-tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="content-area">
          {activeTab === 'dashboard' && (
            <Dashboard companies={companies} workRecords={workRecords} expenses={expenses} insurance={insurance} payroll={payroll} />
          )}
          {activeTab === 'companies' && (
            <CompanyManager companies={companies} onAddCompany={addCompany} onEditCompany={editCompany} onDeleteCompany={deleteCompany} />
          )}
          {activeTab === 'work' && (
            <WorkEntrySection companies={companies} workRecords={workRecords} onAddRecord={addWorkRecord} onDeleteRecord={deleteWorkRecord} />
          )}
          {activeTab === 'received' && (
            <ExpensesSection expenses={expenses} onAddExpense={addExpense} onDeleteExpense={deleteExpense} />
          )}
          {activeTab === 'insurance' && (
            <InsuranceSection insurance={insurance} onAddInsurance={addInsurance} onDeleteInsurance={deleteInsurance} />
          )}
          {activeTab === 'payroll' && (
            <PayrollSection payroll={payroll} onAddPayroll={addPayroll} onDeletePayroll={deletePayroll} />
          )}
        </div>
      </main>
    </div>
  );
};

// ── Root ──────────────────────────────────────────────────────────────────
const App = () => (
  <ToastProvider>
    <WorkTracker />
  </ToastProvider>
);

export default App;
