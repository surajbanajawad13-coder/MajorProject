import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Award,
  LogOut,
  Plus,
  LayoutDashboard,
  Briefcase,
  Users,
  Sun,
  Moon,
  X,
  Loader2,
  Star,
  Activity,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000';
const departments = ['CSE', 'ISE', 'ECE', 'ME', 'CE', 'AIML', 'CSB', 'CSD'];
const emptyForm = { title: '', description: '', type: 'Event', category: 'Workshop', organizer: '', date: '', targetDepartment: ['All'] };

/* ─────────────────────────────────────────────
   Theme Toggle Sub-component
───────────────────────────────────────────── */
const ThemeToggle = ({ isDark, onToggle }) => (
  <motion.button onClick={onToggle} className="sd-theme-toggle" whileTap={{ scale: 0.92 }} title={isDark ? 'Switch to Light' : 'Switch to Dark'}>
    <motion.div className="sd-toggle-track" animate={{ background: isDark ? 'linear-gradient(135deg,#1e1b4b,#312e81)' : 'linear-gradient(135deg,#e0f2fe,#bae6fd)' }} transition={{ duration: 0.4 }}>
      <motion.div className="sd-toggle-thumb" animate={{ x: isDark ? 2 : 26 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
        <AnimatePresence mode="wait">
          {isDark
            ? <motion.span key="moon" initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 30, opacity: 0 }} transition={{ duration: 0.2 }}><Moon size={12} color="#818cf8" /></motion.span>
            : <motion.span key="sun" initial={{ rotate: 30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -30, opacity: 0 }} transition={{ duration: 0.2 }}><Sun size={12} color="#f59e0b" /></motion.span>
          }
        </AnimatePresence>
      </motion.div>
    </motion.div>
    <span className="sd-toggle-label">{isDark ? 'Dark' : 'Light'}</span>
  </motion.button>
);

/* ─────────────────────────────────────────────
   Coordinator Dashboard Main Component
───────────────────────────────────────────── */
export default function CoordinatorDashboard() {
  const { user, logout } = useAuth();
  const token = user?.token;
  const [tab, setTab] = useState('overview');
  const [programs, setPrograms] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('sd-theme');
    return saved !== null ? saved === 'dark' : true;
  });

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('sd-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [programResponse, analyticsResponse] = await Promise.all([
        axios.get(`${API}/api/events`, { headers }),
        axios.get(`${API}/api/events/analytics`, { headers })
      ]);
      setPrograms(programResponse.data.data || []);
      setAnalytics(analyticsResponse.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load programs.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API}/api/events`, { ...form, date: new Date(form.date).toISOString() }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Program created successfully.');
      setShowForm(false);
      setForm(emptyForm);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create program.');
    } finally { setSaving(false); }
  };

  const updateDepartment = department => {
    setForm(current => {
      if (department === 'All') return { ...current, targetDepartment: ['All'] };
      const selected = current.targetDepartment.filter(value => value !== 'All');
      return { ...current, targetDepartment: selected.includes(department) ? selected.filter(value => value !== department) : [...selected, department] };
    });
  };

  const theme = isDark ? 'sd-dark' : 'sd-light';
  const username = user?.result?.username || user?.username || 'Coordinator';
  const roleText = user?.result?.role || 'Event Coordinator';
  const initials = username.slice(0, 2).toUpperCase();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'programs', label: 'Manage Programs', icon: Calendar },
    { id: 'analytics', label: 'Student Analytics', icon: TrendingUp },
  ];

  if (loading) return (
    <div className={`sd-loading-screen ${theme}`}>
      <style>{STYLES}</style>
      <motion.div className="sd-loader" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} />
      <p className="sd-loading-text">Loading coordinator console…</p>
    </div>
  );

  return (
    <div className={`sd-root ${theme}`}>
      <style>{STYLES}</style>

      {/* ── Sidebar ── */}
      <aside className="sd-sidebar">
        <div className="sd-logo">
          <div className="sd-logo-icon">C</div>
          <span className="sd-logo-text">CampusConnect</span>
        </div>

        <div className="sd-avatar-wrap" style={{ cursor: 'default' }}>
          <div className="sd-avatar">{initials}</div>
          <div className="sd-avatar-info">
            <p className="sd-avatar-name">{username}</p>
            <p className="sd-avatar-role">{roleText}</p>
          </div>
        </div>

        <nav className="sd-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`sd-nav-item ${tab === id ? 'sd-nav-active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
              {tab === id && <div className="sd-nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sd-sidebar-spacer" />

        <button onClick={logout} className="sd-logout-btn">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </aside>

      {/* ── Main Workspace ── */}
      <main className="sd-main">
        <header className="sd-topbar">
          <div>
            <p className="sd-topbar-greeting">Event Coordinator Portal 👋</p>
            <h1 className="sd-topbar-title">Dashboard &amp; Analytics</h1>
          </div>
          <div className="sd-topbar-actions">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </header>

        <div className="sd-content">
          <AnimatePresence mode="wait">

            {/* ════════ OVERVIEW TAB ════════ */}
            {tab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                
                <div className="sd-hero">
                  <div className="sd-hero-glow sd-hero-glow-1" />
                  <div className="sd-hero-glow sd-hero-glow-2" />
                  <div className="sd-hero-content" style={{ maxWidth: '100%' }}>
                    <span className="sd-hero-chip"><Star size={12} /> Coordinator Access</span>
                    <h2 className="sd-hero-heading">Events &amp; Training <br /><em>Management Hub</em></h2>
                    <p className="sd-hero-sub">Plan campus programs, supervise departmental workshops, and keep track of real-time student registration metrics seamlessly.</p>
                    <div className="sd-hero-meta">
                      <div className="sd-meta-pill"><Calendar size={13} /> {programs.length} Total Programs</div>
                      <div className="sd-meta-pill"><Users size={13} /> {analytics?.totalRegistrations || 0} Total Registrations</div>
                    </div>
                  </div>
                </div>

                <div className="sd-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <StatCard icon={Calendar} label="Active Programs" value={programs.filter(p => new Date(p.date) >= new Date()).length} gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" delay={0.05} />
                  <StatCard icon={Award} label="Total Events" value={analytics?.totalEvents || 0} gradient="linear-gradient(135deg,#0ea5e9,#06b6d4)" delay={0.1} />
                  <StatCard icon={Activity} label="Total Trainings" value={analytics?.totalTrainings || 0} gradient="linear-gradient(135deg,#10b981,#059669)" delay={0.15} />
                  <StatCard icon={Users} label="Registrations" value={analytics?.totalRegistrations || 0} gradient="linear-gradient(135deg,#f59e0b,#d97706)" delay={0.2} />
                </div>

                <div className="sd-card" style={{ marginTop: '10px' }}>
                  <div className="sd-card-header">
                    <div className="sd-card-icon" style={{ '--icon-color': '#10b981' }}><Calendar size={16} /></div>
                    <div>
                      <h3 className="sd-card-title">Upcoming Programs</h3>
                      <p className="sd-card-sub">Next scheduled sessions on campus</p>
                    </div>
                    <button onClick={() => setTab('programs')} className="sd-view-all">View all <ChevronRight size={13} /></button>
                  </div>
                  {programs.filter(program => new Date(program.date) >= new Date()).length > 0 ? (
                    <div className="sd-events-grid" style={{ marginTop: '12px' }}>
                      {programs.filter(program => new Date(program.date) >= new Date()).slice(0, 3).map((program, idx) => (
                        <div key={program._id || idx} className="sd-event-card">
                          <div className="sd-event-top">
                            <span className="sd-event-chip">{program.type} · {program.category}</span>
                            <span className="sd-event-date">{new Date(program.date).toLocaleDateString()}</span>
                          </div>
                          <h4 className="sd-event-title">{program.title}</h4>
                          <p className="sd-event-desc">{program.description}</p>
                          <div className="sd-event-footer">
                            <span className="sd-event-org"><Star size={11} /> {program.organizer}</span>
                            <span className="sd-mini-chip">{program.registrationCount || 0} registered</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="sd-empty-inline"><p>No upcoming programs found.</p></div>
                  )}
                </div>

              </motion.div>
            )}

            {/* ════════ MANAGE PROGRAMS TAB ════════ */}
            {tab === 'programs' && (
              <motion.div key="programs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <SectionHeader icon={Calendar} title="Manage Programs" sub="Create and review campus events and training sessions." color="#6366f1" />
                  <button className="pe-btn-save" onClick={() => setShowForm(true)} style={{ padding: '10px 18px', cursor: 'pointer' }}>
                    <Plus size={16} /> Create Event / Training
                  </button>
                </div>

                <div className="sd-card" style={{ padding: '16px' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="ec-table">
                      <thead>
                        <tr>
                          <th>Program</th>
                          <th>Type</th>
                          <th>Category</th>
                          <th>Date</th>
                          <th>Departments</th>
                          <th>Registrations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {programs.map(program => (
                          <tr key={program._id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-head)' }}>{program.title}</td>
                            <td><span className="sd-event-chip">{program.type}</span></td>
                            <td>{program.category}</td>
                            <td>{new Date(program.date).toLocaleString()}</td>
                            <td>{program.targetDepartment.join(', ')}</td>
                            <td><span className="sd-count-badge">{program.registrationCount || 0}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!programs.length && <div className="sd-empty-inline" style={{ padding: '24px' }}><p>No programs created yet.</p></div>}
                </div>
              </motion.div>
            )}

            {/* ════════ ANALYTICS TAB ════════ */}
            {tab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                <SectionHeader icon={TrendingUp} title="Student Analytics" sub="Comprehensive breakdown of department participation and program stats." color="#10b981" />

                <div className="sd-stats-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <StatCard icon={Users} label="Total Registrations" value={analytics?.totalRegistrations || 0} gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" delay={0.05} />
                  <StatCard icon={Briefcase} label="Total Programs" value={analytics?.totalPrograms || 0} gradient="linear-gradient(135deg,#10b981,#059669)" delay={0.1} />
                </div>

                <div className="sd-two-col" style={{ alignItems: 'start' }}>
                  <div className="sd-card">
                    <div className="sd-card-header">
                      <div className="sd-card-icon" style={{ '--icon-color': '#0ea5e9' }}><Users size={16} /></div>
                      <div>
                        <h3 className="sd-card-title">Registrations by Department</h3>
                        <p className="sd-card-sub">Departmental turnout metrics</p>
                      </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="ec-table">
                        <thead>
                          <tr><th>Department</th><th>Registered Students</th></tr>
                        </thead>
                        <tbody>
                          {analytics?.departmentWise?.map(row => (
                            <tr key={row.department}>
                              <td style={{ fontWeight: 600, color: 'var(--text-head)' }}>{row.department}</td>
                              <td>{row.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="sd-card">
                    <div className="sd-card-header">
                      <div className="sd-card-icon" style={{ '--icon-color': '#f59e0b' }}><Award size={16} /></div>
                      <div>
                        <h3 className="sd-card-title">Program Registrations</h3>
                        <p className="sd-card-sub">Individual activity tracking</p>
                      </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="ec-table">
                        <thead>
                          <tr><th>Program</th><th>Type</th><th>Registrations</th></tr>
                        </thead>
                        <tbody>
                          {analytics?.programs?.map(program => (
                            <tr key={program._id}>
                              <td style={{ fontWeight: 600, color: 'var(--text-head)' }}>{program.title}</td>
                              <td>{program.type}</td>
                              <td>{program.registrations}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ── CREATE PROGRAM MODAL (Properly Centered via Flexbox Portal) ── */}
      <AnimatePresence>
        {showForm && (
          <div className="sd-modal-portal">
            <motion.div 
              className="pe-backdrop" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowForm(false)} 
            />
            <motion.div
              className={`pe-modal ${theme}`}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            >
              <div className="pe-header">
                <div className="pe-header-left">
                  <div>
                    <h2 className="pe-title">Create Event / Training</h2>
                    <p className="pe-subtitle">Publish a new session for target departments</p>
                  </div>
                </div>
                <button className="pe-close" onClick={() => setShowForm(false)}><X size={18} /></button>
              </div>

              <form onSubmit={submit} className="pe-body">
                <div className="pe-field">
                  <label className="pe-label">Title</label>
                  <input className="pe-input" required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Program title" />
                </div>

                <div className="pe-field" style={{ marginTop: '12px' }}>
                  <label className="pe-label">Description</label>
                  <textarea className="pe-input" required value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Enter detailed description..." style={{ minHeight: '90px', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div className="pe-field">
                    <label className="pe-label">Type</label>
                    <select className="pe-input" value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}>
                      <option>Event</option>
                      <option>Training</option>
                    </select>
                  </div>
                  <div className="pe-field">
                    <label className="pe-label">Category</label>
                    <select className="pe-input" value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>
                      {['Workshop', 'Hackathon', 'Coding Bootcamp', 'Seminar', 'Other'].map(value => <option key={value}>{value}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pe-field" style={{ marginTop: '12px' }}>
                  <label className="pe-label">Organizer</label>
                  <input className="pe-input" required value={form.organizer} onChange={event => setForm({ ...form, organizer: event.target.value })} placeholder="Organizer name or club" />
                </div>

                <div className="pe-field" style={{ marginTop: '12px' }}>
                  <label className="pe-label">Date and Time</label>
                  <input className="pe-input" required type="datetime-local" min={new Date().toISOString().slice(0, 16)} value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} />
                </div>

                <div className="pe-field" style={{ marginTop: '12px' }}>
                  <label className="pe-label">Target Departments</label>
                  <div className="ec-checks">
                    <label><input type="checkbox" checked={form.targetDepartment.includes('All')} onChange={() => updateDepartment('All')} /> All Departments</label>
                    {departments.map(department => (
                      <label key={department}><input type="checkbox" checked={form.targetDepartment.includes(department)} onChange={() => updateDepartment(department)} /> {department}</label>
                    ))}
                  </div>
                </div>

                <div className="pe-footer" style={{ marginTop: '20px', padding: 0, border: 'none' }}>
                  <button type="button" className="pe-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="pe-btn-save" disabled={saving}>
                    {saving ? <><Loader2 size={15} className="pe-spin" /> Creating…</> : 'Create Program'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Stat Card Helper
───────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, gradient, delay }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!value) return;
    let start = 0;
    const step = Math.ceil(value / (1200 / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 120 }}
      className="sd-stat-card"
      style={{ '--grad': gradient }}
    >
      <div className="sd-stat-icon-wrap"><Icon size={20} /></div>
      <div className="sd-stat-body">
        <span className="sd-stat-value">{count}</span>
        <span className="sd-stat-label">{label}</span>
      </div>
      <div className="sd-stat-glow" />
    </motion.div>
  );
};

const SectionHeader = ({ icon: Icon, title, sub, color }) => (
  <div className="sd-section-header">
    <div className="sd-section-icon" style={{ '--ic': color }}><Icon size={20} /></div>
    <div>
      <h2 className="sd-section-title">{title}</h2>
      <p className="sd-section-sub">{sub}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Integrated Shared CSS & Theme Definitions
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sd-dark {
    --bg:        #0d1117;
    --bg-sidebar:  #0f1623;
    --bg-card:     rgba(255,255,255,0.03);
    --bg-card-hov: rgba(255,255,255,0.05);
    --bg-input:    rgba(255,255,255,0.04);
    --border:      rgba(255,255,255,0.07);
    --border-hov:  rgba(255,255,255,0.14);
    --text-head:   #f1f5f9;
    --text-body:   #e2e8f0;
    --text-sub:    #94a3b8;
    --text-muted:  #64748b;
    --text-dim:    #475569;
    --accent:      #6366f1;
    --accent-soft: rgba(99,102,241,0.12);
    --accent-text: #818cf8;
    --topbar-bg:   rgba(13,17,23,0.85);
    --hero-bg:     linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);
    --hero-border: rgba(99,102,241,0.2);
    --nav-active-bg: rgba(99,102,241,0.12);
    --scrollbar-track: #0d1117;
    --scrollbar-thumb: rgba(255,255,255,0.1);
  }
  .sd-light {
    --bg:        #f0f4ff;
    --bg-sidebar:  #ffffff;
    --bg-card:     #ffffff;
    --bg-card-hov: #fafbff;
    --bg-input:    #f8faff;
    --border:      rgba(99,102,241,0.1);
    --border-hov:  rgba(99,102,241,0.28);
    --text-head:   #1e1b4b;
    --text-body:   #1e293b;
    --text-sub:    #475569;
    --text-muted:  #64748b;
    --text-dim:    #94a3b8;
    --accent:      #6366f1;
    --accent-soft: rgba(99,102,241,0.08);
    --accent-text: #4f46e5;
    --topbar-bg:   rgba(240,244,255,0.9);
    --hero-bg:     linear-gradient(135deg,#ede9fe 0%,#dbeafe 100%);
    --hero-border: rgba(99,102,241,0.18);
    --nav-active-bg: rgba(99,102,241,0.1);
    --scrollbar-track: #f0f4ff;
    --scrollbar-thumb: rgba(99,102,241,0.15);
  }

  .sd-root {
    display: flex; min-height: 100vh;
    background: var(--bg); font-family: 'Inter', sans-serif;
    color: var(--text-body); transition: background 0.4s ease, color 0.4s ease;
  }
  
  /* Fixed Modal Portal Centering & Flex Layout */
  .sd-modal-portal {
    position: fixed; inset: 0; z-index: 999;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }

  /* ── Sidebar ── */
  .sd-sidebar {
    width: 240px; flex-shrink: 0;
    background: var(--bg-sidebar); border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    padding: 24px 16px; position: sticky; top: 0; height: 100vh; overflow-y: auto;
  }
  .sd-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; padding: 0 8px; }
  .sd-logo-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 800; color: #fff;
    box-shadow: 0 4px 15px rgba(99,102,241,.35);
  }
  .sd-logo-text { font-size: 15px; font-weight: 700; color: var(--text-head); letter-spacing: -0.02em; }

  .sd-avatar-wrap {
    display: flex; align-items: center; gap: 12px;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 16px; padding: 12px; margin-bottom: 28px;
  }
  .sd-avatar {
    width: 40px; height: 40px; border-radius: 12px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .sd-avatar-name { font-size: 13px; font-weight: 600; color: var(--text-head); }
  .sd-avatar-role { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

  .sd-nav { display: flex; flex-direction: column; gap: 4px; }
  .sd-nav-item {
    position: relative; display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 12px;
    border: none; background: transparent;
    color: var(--text-muted); font-size: 13.5px; font-weight: 500;
    cursor: pointer; transition: all 0.2s ease; text-align: left; width: 100%;
  }
  .sd-nav-item:hover { background: var(--accent-soft); color: var(--accent-text); }
  .sd-nav-active { background: var(--nav-active-bg) !important; color: var(--accent-text) !important; font-weight: 600; }
  .sd-nav-indicator {
    position: absolute; right: 0; top: 50%; transform: translateY(-50%);
    width: 3px; height: 18px; border-radius: 99px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
  }
  .sd-sidebar-spacer { flex: 1; }

  .sd-logout-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px; border-radius: 12px;
    border: 1px solid rgba(248,113,113,0.25);
    background: rgba(248,113,113,0.06);
    color: #f87171; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.2s ease; width: 100%;
  }
  .sd-logout-btn:hover { background: rgba(248,113,113,0.12); border-color: rgba(248,113,113,0.5); }

  /* ── Main Workspace ── */
  .sd-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .sd-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 32px; border-bottom: 1px solid var(--border);
    background: var(--topbar-bg); backdrop-filter: blur(12px);
    position: sticky; top: 0; z-index: 10;
  }
  .sd-topbar-greeting { font-size: 12px; color: var(--text-muted); margin-bottom: 2px; }
  .sd-topbar-title    { font-size: 20px; font-weight: 700; color: var(--text-head); letter-spacing: -0.02em; }
  .sd-topbar-actions  { display: flex; align-items: center; gap: 10px; }

  .sd-theme-toggle {
    display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 0;
  }
  .sd-toggle-track {
    width: 50px; height: 26px; border-radius: 99px;
    position: relative; padding: 3px; border: 1px solid var(--border);
    display: flex; align-items: center;
  }
  .sd-toggle-thumb {
    width: 20px; height: 20px; border-radius: 50%; background: #fff;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 6px rgba(0,0,0,0.25); flex-shrink: 0;
  }
  .sd-toggle-label { font-size: 12px; font-weight: 600; color: var(--text-muted); min-width: 32px; }

  .sd-content { flex: 1; padding: 28px 32px; overflow-y: auto; }
  .sd-section { display: flex; flex-direction: column; gap: 22px; }

  /* Hero */
  .sd-hero {
    position: relative; overflow: hidden; border-radius: 24px;
    padding: 40px 40px 40px 44px; background: var(--hero-bg);
    border: 1px solid var(--hero-border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .sd-hero-glow { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
  .sd-hero-glow-1 { width: 360px; height: 360px; background: rgba(99,102,241,0.15); top: -120px; right: -60px; }
  .sd-hero-glow-2 { width: 200px; height: 200px; background: rgba(139,92,246,0.10); bottom: -60px; left: 30%; }
  .sd-hero-content { position: relative; z-index: 2; }
  .sd-hero-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 12px; border-radius: 99px;
    background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3);
    color: var(--accent-text); font-size: 11px; font-weight: 600; margin-bottom: 14px;
  }
  .sd-hero-heading {
    font-size: 34px; font-weight: 800; color: var(--text-head);
    line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 10px;
  }
  .sd-hero-heading em { font-style: normal; color: var(--accent-text); }
  .sd-hero-sub { font-size: 14px; color: var(--text-sub); line-height: 1.7; margin-bottom: 18px; max-width: 520px; }
  .sd-hero-meta { display: flex; flex-wrap: wrap; gap: 8px; }
  .sd-meta-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px; border-radius: 10px;
    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2);
    font-size: 12px; color: var(--text-sub); font-weight: 500;
  }
  .sd-light .sd-meta-pill { background: rgba(99,102,241,0.07); border-color: rgba(99,102,241,0.15); }

  /* Stats */
  .sd-stats-row { display: grid; gap: 16px; }
  .sd-stat-card {
    position: relative; overflow: hidden;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 20px; padding: 22px 20px;
    display: flex; align-items: center; gap: 16px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }
  .sd-stat-icon-wrap {
    width: 48px; height: 48px; border-radius: 14px; background: var(--grad);
    display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0;
  }
  .sd-stat-body { flex: 1; }
  .sd-stat-value { display: block; font-size: 28px; font-weight: 800; color: var(--text-head); line-height: 1; margin-bottom: 4px; }
  .sd-stat-label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
  .sd-stat-glow {
    position: absolute; right: -30px; top: -30px; width: 100px; height: 100px;
    border-radius: 50%; background: var(--grad); filter: blur(50px); opacity: 0.1; pointer-events: none;
  }

  /* Cards & Sections */
  .sd-card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 20px; padding: 22px; display: flex; flex-direction: column; gap: 16px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }
  .sd-card-header { display: flex; align-items: center; gap: 12px; }
  .sd-card-icon {
    width: 38px; height: 38px; border-radius: 11px; background: var(--accent-soft);
    display: flex; align-items: center; justify-content: center; color: var(--icon-color); flex-shrink: 0;
  }
  .sd-card-title { font-size: 14px; font-weight: 700; color: var(--text-head); }
  .sd-card-sub   { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
  .sd-count-badge { padding: 3px 9px; border-radius: 99px; background: var(--accent-soft); font-size: 11px; font-weight: 600; color: var(--accent-text); }
  .sd-view-all {
    margin-left: auto; display: flex; align-items: center; gap: 3px;
    font-size: 11px; font-weight: 600; color: var(--accent); background: none; border: none; cursor: pointer;
  }
  .sd-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  .sd-section-header { display: flex; align-items: center; gap: 14px; }
  .sd-section-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center; color: var(--ic); flex-shrink: 0; }
  .sd-section-title { font-size: 18px; font-weight: 700; color: var(--text-head); }
  .sd-section-sub   { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

  /* Events grid */
  .sd-events-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); gap: 16px; }
  .sd-event-card {
    position: relative; overflow: hidden; background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 18px; padding: 20px; display: flex; flex-direction: column; gap: 10px;
  }
  .sd-event-top   { display: flex; justify-content: space-between; align-items: center; }
  .sd-event-chip  { padding: 4px 10px; border-radius: 8px; background: rgba(16,185,129,0.08); color: #059669; border: 1px solid rgba(16,185,129,0.2); font-size: 10.5px; font-weight: 600; }
  .sd-dark .sd-event-chip { color: #34d399; }
  .sd-event-date  { font-size: 11px; color: var(--text-muted); }
  .sd-event-title { font-size: 15px; font-weight: 700; color: var(--text-head); }
  .sd-event-desc  { font-size: 12px; color: var(--text-sub); line-height: 1.6; }
  .sd-event-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--border); margin-top: auto; }
  .sd-event-org   { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); }
  .sd-mini-chip  { padding: 3px 8px; border-radius: 8px; background: var(--accent-soft); font-size: 10px; font-weight: 600; color: var(--accent-text); }

  /* Table styles */
  .ec-table { width: 100%; border-collapse: collapse; text-align: left; }
  .ec-table th, .ec-table td { padding: 12px 14px; border-bottom: 1px solid var(--border); font-size: 13px; }
  .ec-table th { color: var(--text-muted); font-weight: 600; }
  .ec-table td { color: var(--text-body); }

  /* Form & Modal Elements */
  .pe-backdrop { position: fixed; inset: 0; z-index: 998; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); }
  .pe-modal {
    position: relative; z-index: 999;
    width: 92%; max-width: 620px; border-radius: 24px; display: flex; flex-direction: column;
    max-height: 90vh; overflow-y: auto; font-family: 'Inter', sans-serif;
  }
  .sd-dark .pe-modal  { background: #131929; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 32px 80px rgba(0,0,0,0.6); }
  .sd-light .pe-modal { background: #ffffff;  border: 1px solid rgba(99,102,241,0.15); box-shadow: 0 32px 80px rgba(99,102,241,0.12); }
  
  .pe-header { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px 16px; border-bottom: 1px solid var(--border); }
  .pe-title    { font-size: 16px; font-weight: 700; color: var(--text-head); }
  .pe-subtitle { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
  .pe-close {
    width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card);
    display: flex; align-items: center; justify-content: center; color: var(--text-muted); cursor: pointer;
  }
  .pe-body { flex: 1; overflow-y: auto; padding: 20px 24px; }
  .pe-field { display: flex; flex-direction: column; gap: 6px; }
  .pe-label { font-size: 12px; font-weight: 600; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.05em; }
  .pe-input {
    padding: 10px 13px; border-radius: 11px; border: 1px solid var(--border);
    background: var(--bg-input); color: var(--text-head); font-size: 13.5px; outline: none; font-family: 'Inter', sans-serif;
  }
  .pe-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .ec-checks { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px; }
  .ec-checks label { font-size: 13px; font-weight: 400; display: flex; align-items: center; gap: 6px; color: var(--text-body); cursor: pointer; }
  
  .pe-footer { display: flex; gap: 10px; justify-content: flex-end; }
  .pe-btn-cancel {
    padding: 9px 18px; border-radius: 10px; border: 1px solid var(--border);
    background: transparent; color: var(--text-muted); font-size: 13px; font-weight: 600; cursor: pointer;
  }
  .pe-btn-save {
    display: flex; align-items: center; gap: 6px; padding: 9px 20px; border-radius: 10px;
    background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; font-size: 13px; font-weight: 600; border: none; cursor: pointer;
  }
  .sd-empty-inline { text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px; }
  @keyframes pe-spin { to { transform: rotate(360deg); } }
  .pe-spin { animation: pe-spin 0.8s linear infinite; }
`;