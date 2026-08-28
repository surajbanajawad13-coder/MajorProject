import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Bell,
  Plus,
  Megaphone,
  Zap,
  Building,
  LogOut,
  Sun,
  Moon,
  X,
  Upload,
  FileText,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000';

function useCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

const StatCard = ({ icon: Icon, label, value, gradient, delay }) => {
  const animatedVal = useCounter(value);
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
        <span className="sd-stat-value">{animatedVal}</span>
        <span className="sd-stat-label">{label}</span>
      </div>
      <div className="sd-stat-glow" />
    </motion.div>
  );
};

const ThemeToggle = ({ isDark, onToggle }) => (
  <motion.button onClick={onToggle} className="sd-theme-toggle" whileTap={{ scale: 0.92 }} title={isDark ? 'Switch to Light' : 'Switch to Dark'}>
    <motion.div className="sd-toggle-track" animate={{ background: isDark ? 'linear-gradient(135deg,#1e1b4b,#312e81)' : 'linear-gradient(135deg,#e0f2fe,#bae6fd)' }} transition={{ duration: 0.4 }}>
      <motion.div className="sd-toggle-thumb" animate={{ x: isDark ? 2 : 26 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
        <AnimatePresence mode="wait">
          {isDark
            ? <motion.span key="moon" initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 30, opacity: 0 }} transition={{ duration: 0.2 }}><Moon size={12} color="#818cf8" /></motion.span>
            : <motion.span key="sun"  initial={{ rotate:  30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -30, opacity: 0 }} transition={{ duration: 0.2 }}><Sun  size={12} color="#f59e0b" /></motion.span>
          }
        </AnimatePresence>
      </motion.div>
    </motion.div>
    <span className="sd-toggle-label">{isDark ? 'Dark' : 'Light'}</span>
  </motion.button>
);

const statusConfig = {
  Upcoming: { cls: 'sd-badge-blue',    dot: '#60a5fa' },
  Today:    { cls: 'sd-badge-emerald', dot: '#34d399' },
  Visited:  { cls: 'sd-badge-default', dot: '#94a3b8' },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || { cls: 'sd-badge-default', dot: '#94a3b8' };
  return (
    <span className={`sd-status-badge ${cfg.cls}`}>
      <span className="sd-badge-dot" style={{ background: cfg.dot }} />
      {status || 'Upcoming'}
    </span>
  );
};

const PostDriveModal = ({ onClose, isDark, onDrivePosted }) => {
  const [formData, setFormData] = useState({ name: '', jobRole: '', ctc: '', visitDate: '', cgpa: '', branches: '' });
  const [jdFile, setJdFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const theme = isDark ? 'sd-dark' : 'sd-light';
  const fileRef = useRef();

  const handleSave = async () => {
    if (!formData.name || !formData.jobRole || !formData.ctc || !formData.visitDate || !formData.cgpa || !formData.branches) {
      toast.error('Please fill in all text fields');
      return;
    }
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('jobRole', formData.jobRole);
      data.append('ctc', formData.ctc);
      data.append('visitDate', formData.visitDate);
      data.append('cgpa', formData.cgpa);
      data.append('branches', formData.branches);
      if (jdFile) data.append('jdFile', jdFile);

      const profileString = localStorage.getItem('profile');
      const token = profileString ? JSON.parse(profileString).token : null;

      const res = await axios.post(`${API}/api/placements`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success || res.status === 201) {
        toast.success('Drive posted & eligible students notified!');
        if (onDrivePosted) onDrivePosted();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to post drive.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className={`pe-backdrop ${theme}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className={`pe-modal ${theme}`} initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 16 }}>
        <div className="pe-header">
          <div className="pe-header-left">
            <div className="pe-avatar-big" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><Building size={24} color="#fff" /></div>
            <div>
              <h2 className="pe-title">Post New Drive</h2>
              <p className="pe-subtitle">Notify eligible students instantly</p>
            </div>
          </div>
          <button className="pe-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="pe-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="pe-field" style={{ gridColumn: 'span 2' }}>
            <label className="pe-label">Company Name</label>
            <input className="pe-input" placeholder="e.g. TechNova" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="pe-field">
            <label className="pe-label">Job Role</label>
            <input className="pe-input" placeholder="Software Engineer" value={formData.jobRole} onChange={e => setFormData({...formData, jobRole: e.target.value})} />
          </div>
          <div className="pe-field">
            <label className="pe-label">Package (CTC)</label>
            <input className="pe-input" placeholder="e.g. 8 LPA" value={formData.ctc} onChange={e => setFormData({...formData, ctc: e.target.value})} />
          </div>
          <div className="pe-field">
            <label className="pe-label">Date of Visit</label>
            <input className="pe-input" type="date" value={formData.visitDate} onChange={e => setFormData({...formData, visitDate: e.target.value})} />
          </div>
          <div className="pe-field">
            <label className="pe-label">Minimum CGPA</label>
            <input className="pe-input" type="number" step="0.1" placeholder="7.5" value={formData.cgpa} onChange={e => setFormData({...formData, cgpa: e.target.value})} />
          </div>
          <div className="pe-field" style={{ gridColumn: 'span 2' }}>
            <label className="pe-label">Eligible Branches (Comma Separated)</label>
            <input className="pe-input" placeholder="CSE, ISE, ECE" value={formData.branches} onChange={e => setFormData({...formData, branches: e.target.value})} />
          </div>
          <div className="pe-field" style={{ gridColumn: 'span 2', marginTop: '8px' }}>
             <label className="pe-label">Job Description (PDF)</label>
             <div className={`pe-upload-zone ${jdFile ? 'pe-upload-filled' : ''}`} onClick={() => fileRef.current.click()}>
                <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setJdFile(e.target.files[0])} />
                <Upload size={24} className="pe-upload-icon" />
                <p className="pe-upload-title">{jdFile ? jdFile.name : 'Upload JD Document'}</p>
                <p className="pe-upload-sub">Click to browse • Max 5MB</p>
             </div>
          </div>
        </div>

        <div className="pe-footer">
          <button className="pe-btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="pe-btn-save" onClick={handleSave} disabled={saving}>{saving ? 'Posting...' : 'Post & Notify'}</button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const TPODashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDark, setIsDark] = useState(false);
  const { logout } = useAuth();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [companies, setCompanies] = useState([]);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API}/api/placements`);
      if (res.data.success) {
        setCompanies(res.data.data);
      }
    } catch (err) {
      console.error('Fetch Companies Error:', err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const toggleTheme = () => setIsDark(!isDark);
  const theme = isDark ? 'sd-dark' : 'sd-light';

  const totalDrives = companies.length;
  const upcomingDrives = companies.filter(c => c.visitStatus === 'Upcoming' || !c.visitStatus).length;

  const navItems = [
    { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
    { id: 'companies', label: 'Company Drives', icon: Briefcase },
    { id: 'students',  label: 'Student Analytics', icon: Users },
  ];

  return (
    <div className={`sd-root ${theme}`}>
      <style>{STYLES}</style>
      {isPostModalOpen && (
        <PostDriveModal
          onClose={() => setIsPostModalOpen(false)}
          isDark={isDark}
          onDrivePosted={fetchCompanies}
        />
      )}

      {/* Sidebar */}
      <aside className="sd-sidebar">
        <div className="sd-logo">
          <div className="sd-logo-icon">C</div>
          <span className="sd-logo-text">CampusConnect</span>
        </div>
        <div className="sd-avatar-wrap">
          <div className="sd-avatar">TP</div>
          <div className="sd-avatar-info">
            <p className="sd-avatar-name">Placement Office</p>
            <p className="sd-avatar-role">Administrator</p>
          </div>
        </div>
        <nav className="sd-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`sd-nav-item ${activeTab === id ? 'sd-nav-active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
              {activeTab === id && <div className="sd-nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sd-sidebar-spacer" />
        <button className="sd-logout-btn" onClick={logout}><LogOut size={16} /><span>Logout</span></button>
      </aside>

      {/* Main Content */}
      <main className="sd-main">
        <header className="sd-topbar">
          <div>
            <p className="sd-topbar-greeting">Command Center 👋</p>
            <h1 className="sd-topbar-title">Placement Operations</h1>
          </div>
          <div className="sd-topbar-actions">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <button className="sd-topbar-bell"><Bell size={18} /><span className="sd-bell-dot" /></button>
          </div>
        </header>

        <div className="sd-content">
          <AnimatePresence mode="wait">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                <div className="sd-hero">
                  <div className="sd-hero-glow sd-hero-glow-1" />
                  <div className="sd-hero-glow sd-hero-glow-2" />
                  <div className="sd-hero-content">
                    <span className="sd-hero-chip"><Zap size={12} /> Active Recruitment Cycle</span>
                    <h2 className="sd-hero-heading">Welcome back, <br /><em>Placement Officer!</em></h2>
                    <p className="sd-hero-sub">Manage upcoming company visits, track student applications, and broadcast updates.</p>
                  </div>
                </div>

                <div className="sd-stats-row">
                  <StatCard icon={Building}  label="Total Drives"      value={totalDrives}       gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" delay={0.05} />
                  <StatCard icon={Briefcase} label="Upcoming Visits"   value={upcomingDrives}    gradient="linear-gradient(135deg,#0ea5e9,#06b6d4)" delay={0.1} />
                  <StatCard icon={Users}     label="Active Apps"       value={0}                 gradient="linear-gradient(135deg,#10b981,#059669)" delay={0.15} />
                </div>

                <div className="sd-two-col">
                  <div className="sd-card">
                    <div className="sd-card-header">
                      <div className="sd-card-icon" style={{ '--icon-color': '#f59e0b' }}><Briefcase size={16} /></div>
                      <div>
                        <h3 className="sd-card-title">Recent Postings</h3>
                        <p className="sd-card-sub">Current company requirements</p>
                      </div>
                    </div>
                    {companies.length > 0 ? (
                      companies.slice(0, 5).map((comp, idx) => (
                        <div key={comp._id || idx} className="sd-mini-row">
                          <div className="sd-mini-dot" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                            {(comp.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div className="sd-mini-body">
                            <p className="sd-mini-title">{comp.name} - {comp.jobRole}</p>
                            <p className="sd-mini-sub">{comp.ctc} | Min CGPA: {comp.eligibilityCriteria?.cgpa || 0}</p>
                          </div>
                          <StatusBadge status={comp.visitStatus} />
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No drive posted yet.</p>
                    )}
                  </div>

                  <div className="sd-card">
                    <div className="sd-card-header">
                      <div className="sd-card-icon" style={{ '--icon-color': '#10b981' }}><Zap size={16} /></div>
                      <div>
                        <h3 className="sd-card-title">Quick Actions</h3>
                        <p className="sd-card-sub">Administrative tools</p>
                      </div>
                    </div>
                    <button className="sd-logout-btn" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)', border: '1px dashed var(--accent)', marginBottom: '10px' }} onClick={() => setIsPostModalOpen(true)}>
                      <Plus size={16}/> Post New Drive
                    </button>
                    <button className="sd-logout-btn" style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px dashed rgba(245,158,11,0.4)' }}>
                      <Megaphone size={16} /> Broadcast Alert
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* COMPANY DRIVES TAB */}
            {activeTab === 'companies' && (
              <motion.div key="companies" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-head)' }}>Company Placement Drives</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{companies.length} Total Drives Registered</p>
                  </div>
                  <button className="pe-btn-save" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setIsPostModalOpen(true)}>
                    <Plus size={16} /> Post Drive
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {companies.map((comp, idx) => (
                    <motion.div key={comp._id || idx} className="sd-card" style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="pe-avatar-big" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', width: '42px', height: '42px', borderRadius: '12px' }}>
                          {(comp.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-head)' }}>{comp.name}</h3>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{comp.jobRole}</p>
                        </div>
                        <div style={{ marginLeft: 'auto' }}>
                          <StatusBadge status={comp.visitStatus} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '13px' }}>
                        <p style={{ color: 'var(--text-sub)' }}><strong>Package:</strong> {comp.ctc}</p>
                        <p style={{ color: 'var(--text-sub)' }}><strong>Eligibility:</strong> Min {comp.eligibilityCriteria?.cgpa || 0} CGPA</p>
                        <p style={{ color: 'var(--text-sub)' }}><strong>Branches:</strong> {comp.eligibilityCriteria?.branches?.join(', ') || 'All'}</p>
                        <p style={{ color: 'var(--text-sub)' }}><strong>Visit Date:</strong> {new Date(comp.visitDate).toLocaleDateString()}</p>
                      </div>

                      {comp.jobDescription?.url && (
                        <a
                          href={`${API}/${comp.jobDescription.url}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            marginTop: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--accent-text)',
                            textDecoration: 'none'
                          }}
                        >
                          <FileText size={14} /> View Job Description PDF
                        </a>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STUDENTS TAB */}
            {activeTab === 'students' && (
              <motion.div key="students" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                <div className="sd-card">
                  <h3 className="sd-card-title">Student Placement Analytics</h3>
                  <p className="sd-card-sub">Student registration and application filtering overview will be populated here.</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sd-dark {
    --bg:          #0d1117;
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
  }
  .sd-light {
    --bg:          #f0f4ff;
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
  }

  .sd-root { display: flex; min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; color: var(--text-body); }
  .sd-sidebar { width: 240px; flex-shrink: 0; background: var(--bg-sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 24px 16px; position: sticky; top: 0; height: 100vh; }
  .sd-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; padding: 0 8px; }
  .sd-logo-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #fff; }
  .sd-logo-text { font-size: 15px; font-weight: 700; color: var(--text-head); }
  .sd-avatar-wrap { display: flex; align-items: center; gap: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 12px; margin-bottom: 28px; }
  .sd-avatar { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #fff; }
  .sd-avatar-name { font-size: 13px; font-weight: 600; color: var(--text-head); }
  .sd-avatar-role { font-size: 11px; color: var(--text-muted); }
  .sd-nav { display: flex; flex-direction: column; gap: 4px; }
  .sd-nav-item { position: relative; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; border: none; background: transparent; color: var(--text-muted); font-size: 13.5px; font-weight: 500; cursor: pointer; text-align: left; width: 100%; }
  .sd-nav-item:hover { background: var(--accent-soft); color: var(--accent-text); }
  .sd-nav-active { background: var(--nav-active-bg) !important; color: var(--accent-text) !important; font-weight: 600; }
  .sd-nav-indicator { position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 18px; border-radius: 99px; background: linear-gradient(135deg, #6366f1, #8b5cf6); }
  .sd-sidebar-spacer { flex: 1; }
  .sd-logout-btn { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(248,113,113,0.25); background: rgba(248,113,113,0.06); color: #f87171; font-size: 13px; font-weight: 500; cursor: pointer; width: 100%; }
  .sd-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .sd-topbar { display: flex; align-items: center; justify-content: space-between; padding: 18px 32px; border-bottom: 1px solid var(--border); background: var(--topbar-bg); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 10; }
  .sd-topbar-greeting { font-size: 12px; color: var(--text-muted); }
  .sd-topbar-title { font-size: 20px; font-weight: 700; color: var(--text-head); }
  .sd-topbar-actions { display: flex; align-items: center; gap: 10px; }
  .sd-theme-toggle { display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; }
  .sd-toggle-track { width: 50px; height: 26px; border-radius: 99px; position: relative; padding: 3px; border: 1px solid var(--border); display: flex; align-items: center; }
  .sd-toggle-thumb { width: 20px; height: 20px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; }
  .sd-topbar-bell { position: relative; width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-card); display: flex; align-items: center; justify-content: center; color: var(--text-sub); cursor: pointer; }
  .sd-bell-dot { position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; border-radius: 50%; background: #6366f1; }
  .sd-content { flex: 1; padding: 28px 32px; overflow-y: auto; }
  .sd-section { display: flex; flex-direction: column; gap: 22px; }
  .sd-hero { position: relative; overflow: hidden; border-radius: 24px; padding: 40px; background: var(--hero-bg); border: 1px solid var(--hero-border); min-height: 200px; display: flex; align-items: center; }
  .sd-hero-content { position: relative; z-index: 2; max-width: 60%; }
  .sd-hero-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 99px; background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3); color: var(--accent-text); font-size: 11px; font-weight: 600; margin-bottom: 14px; }
  .sd-hero-heading { font-size: 34px; font-weight: 800; color: var(--text-head); line-height: 1.1; margin-bottom: 10px; }
  .sd-hero-heading em { font-style: normal; color: var(--accent-text); }
  .sd-hero-sub { font-size: 14px; color: var(--text-sub); line-height: 1.6; }
  .sd-stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .sd-stat-card { position: relative; overflow: hidden; background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 22px 20px; display: flex; align-items: center; gap: 16px; }
  .sd-stat-icon-wrap { width: 48px; height: 48px; border-radius: 14px; background: var(--grad); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
  .sd-stat-body { flex: 1; }
  .sd-stat-value { display: block; font-size: 28px; font-weight: 800; color: var(--text-head); line-height: 1; }
  .sd-stat-label { font-size: 12px; color: var(--text-muted); }
  .sd-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 22px; display: flex; flex-direction: column; gap: 16px; }
  .sd-card-header { display: flex; align-items: center; gap: 12px; }
  .sd-card-icon { width: 38px; height: 38px; border-radius: 11px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center; color: var(--icon-color); }
  .sd-card-title { font-size: 14px; font-weight: 700; color: var(--text-head); }
  .sd-card-sub { font-size: 11px; color: var(--text-dim); }
  .sd-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .sd-mini-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .sd-mini-dot { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; }
  .sd-mini-body { flex: 1; min-width: 0; }
  .sd-mini-title { font-size: 12.5px; font-weight: 600; color: var(--text-head); }
  .sd-mini-sub { font-size: 11px; color: var(--text-muted); }
  .sd-status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 99px; font-size: 11.5px; font-weight: 600; }
  .sd-badge-dot { width: 6px; height: 6px; border-radius: 50%; }
  .sd-badge-blue { background: rgba(96,165,250,0.1); color: #3b82f6; border: 1px solid rgba(96,165,250,0.25); }
  .sd-badge-emerald { background: rgba(52,211,153,0.1); color: #059669; border: 1px solid rgba(52,211,153,0.25); }
  .sd-badge-default { background: rgba(148,163,184,0.08); color: #64748b; border: 1px solid rgba(148,163,184,0.2); }

  .pe-backdrop { position: fixed; inset: 0; z-index: 998; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); }
  .pe-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) !important; z-index: 999; width: 92%; max-width: 600px; border-radius: 24px; display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; font-family: 'Inter', sans-serif; }
  .sd-dark .pe-modal { background: #131929; border: 1px solid rgba(255,255,255,0.08); }
  .sd-light .pe-modal { background: #ffffff; border: 1px solid rgba(99,102,241,0.15); }
  .pe-header { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px 16px; border-bottom: 1px solid var(--border); }
  .pe-header-left { display: flex; align-items: center; gap: 14px; }
  .pe-avatar-big { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
  .pe-title { font-size: 18px; font-weight: 700; color: var(--text-head); }
  .pe-subtitle { font-size: 13px; color: var(--text-muted); }
  .pe-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); display: flex; align-items: center; justify-content: center; color: var(--text-muted); cursor: pointer; }
  .pe-body { flex: 1; overflow-y: auto; padding: 24px; }
  .pe-field { display: flex; flex-direction: column; gap: 6px; }
  .pe-label { font-size: 12px; font-weight: 600; color: var(--text-sub); text-transform: uppercase; }
  .pe-input { padding: 12px 14px; border-radius: 11px; border: 1px solid var(--border); background: var(--bg-input); color: var(--text-head); font-size: 13.5px; outline: none; }
  .pe-upload-zone { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 20px; border-radius: 14px; border: 2px dashed var(--border-hov); cursor: pointer; text-align: center; }
  .pe-upload-filled { border-color: var(--accent); background: var(--accent-soft); }
  .pe-upload-title { font-size: 14px; font-weight: 600; color: var(--text-head); }
  .pe-upload-sub { font-size: 12px; color: var(--text-muted); }
  .pe-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid var(--border); }
  .pe-btn-cancel { padding: 9px 18px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text-muted); font-size: 13px; font-weight: 600; cursor: pointer; }
  .pe-btn-save { padding: 9px 20px; border-radius: 10px; background: linear-gradient(135deg,#f59e0b,#d97706); color: #fff; font-size: 13px; font-weight: 600; border: none; cursor: pointer; }
`;

export default TPODashboard;