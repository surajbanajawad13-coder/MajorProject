import React, { useEffect, useState } from 'react';
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
  Moon
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Helper: Animated counter hook
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   Shared Components
───────────────────────────────────────────── */
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
      {status || 'Unknown'}
    </span>
  );
};

/* ─────────────────────────────────────────────
   Main TPO Dashboard Component
───────────────────────────────────────────── */
const TPODashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDark, setIsDark] = useState(true);
  
  // Dummy Data mapping to your companySchema
  const [companies, setCompanies] = useState([
    { _id: '1', name: 'TechNova', jobRole: 'Software Engineer', ctc: '6 LPA', visitDate: new Date().toISOString(), visitStatus: 'Today', eligibilityCriteria: { cgpa: 7.5, branches: ['CSE', 'IT'] } },
    { _id: '2', name: 'CloudSync', jobRole: 'Cloud Architect', ctc: '12 LPA', visitDate: new Date(Date.now() + 86400000 * 5).toISOString(), visitStatus: 'Upcoming', eligibilityCriteria: { cgpa: 8.0, branches: ['CSE'] } }
  ]);

  const toggleTheme = () => setIsDark(!isDark);
  const theme = isDark ? 'sd-dark' : 'sd-light';
  
  const totalDrives = companies.length;
  const upcomingDrives = companies.filter(c => c.visitStatus === 'Upcoming').length;
  const totalApplications = 145; 

  const navItems = [
    { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
    { id: 'companies', label: 'Company Drives', icon: Briefcase },
    { id: 'students',  label: 'Student Analytics', icon: Users },
  ];

  return (
    <div className={`sd-root ${theme}`}>
      <style>{STYLES}</style>

      {/* ── Sidebar ── */}
      <aside className="sd-sidebar">
        <div className="sd-logo">
          <div className="sd-logo-icon">C</div>
          <span className="sd-logo-text">CampusConnect</span>
        </div>

        <motion.div className="sd-avatar-wrap">
          <div className="sd-avatar">TP</div>
          <div className="sd-avatar-info">
            <p className="sd-avatar-name">Placement Office</p>
            <p className="sd-avatar-role">Administrator</p>
          </div>
        </motion.div>

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
        <button className="sd-logout-btn"><LogOut size={16} /><span>Logout</span></button>
      </aside>

      {/* ── Main ── */}
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
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="sd-section">
                
                <div className="sd-hero">
                  <div className="sd-hero-glow sd-hero-glow-1" />
                  <div className="sd-hero-glow sd-hero-glow-2" />
                  <div className="sd-hero-content">
                    <span className="sd-hero-chip"><Zap size={12} /> Active Recruitment Cycle</span>
                    <h2 className="sd-hero-heading">Welcome back, <br /><em>Placement Officer!</em></h2>
                    <p className="sd-hero-sub">Manage upcoming company visits, track student applications, and broadcast important updates instantly.</p>
                  </div>
                </div>

                <div className="sd-stats-row">
                  <StatCard icon={Building}  label="Total Drives"      value={totalDrives}       gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" delay={0.05} />
                  <StatCard icon={Briefcase} label="Upcoming Visits"   value={upcomingDrives}    gradient="linear-gradient(135deg,#0ea5e9,#06b6d4)" delay={0.1} />
                  <StatCard icon={Users}     label="Active Apps"       value={totalApplications} gradient="linear-gradient(135deg,#10b981,#059669)" delay={0.15} />
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
                    {companies.map((company, i) => (
                      <div key={i} className="sd-mini-row">
                        <div className="sd-mini-dot" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                          {company.name.charAt(0)}
                        </div>
                        <div className="sd-mini-body">
                          <p className="sd-mini-title">{company.name} - {company.jobRole}</p>
                          <p className="sd-mini-sub">{company.ctc} | Min CGPA: {company.eligibilityCriteria.cgpa}</p>
                        </div>
                        <StatusBadge status={company.visitStatus} />
                      </div>
                    ))}
                  </div>

                  <div className="sd-card">
                    <div className="sd-card-header">
                      <div className="sd-card-icon" style={{ '--icon-color': '#10b981' }}><Zap size={16} /></div>
                      <div>
                        <h3 className="sd-card-title">Quick Actions</h3>
                        <p className="sd-card-sub">Administrative tools</p>
                      </div>
                    </div>
                    
                    <button className="sd-logout-btn" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)', border: '1px dashed var(--accent)', marginBottom: '10px' }}>
                      <Plus size={16} /> Post New Drive
                    </button>
                    
                    <button className="sd-logout-btn" style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px dashed rgba(245,158,11,0.4)' }}>
                      <Megaphone size={16} /> Broadcast Alert
                    </button>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
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
    --scrollbar-track: #0d1117;
    --scrollbar-thumb: rgba(255,255,255,0.1);
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
    --scrollbar-track: #f0f4ff;
    --scrollbar-thumb: rgba(99,102,241,0.15);
  }

  .sd-root {
    display: flex; min-height: 100vh;
    background: var(--bg); font-family: 'Inter', sans-serif;
    color: var(--text-body); transition: background 0.4s ease, color 0.4s ease;
  }
  .sd-root ::-webkit-scrollbar { width: 6px; }
  .sd-root ::-webkit-scrollbar-track { background: var(--scrollbar-track); }
  .sd-root ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 99px; }

  /* ── Sidebar ── */
  .sd-sidebar {
    width: 240px; flex-shrink: 0;
    background: var(--bg-sidebar); border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    padding: 24px 16px; position: sticky; top: 0; height: 100vh; overflow-y: auto;
    transition: background 0.4s ease, border-color 0.4s ease;
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
    transition: background 0.4s ease;
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

  /* ── Main ── */
  .sd-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

  .sd-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 32px; border-bottom: 1px solid var(--border);
    background: var(--topbar-bg); backdrop-filter: blur(12px);
    position: sticky; top: 0; z-index: 10;
    transition: background 0.4s ease, border-color 0.4s ease;
  }
  .sd-topbar-greeting { font-size: 12px; color: var(--text-muted); margin-bottom: 2px; }
  .sd-topbar-title    { font-size: 20px; font-weight: 700; color: var(--text-head); letter-spacing: -0.02em; }
  .sd-topbar-actions  { display: flex; align-items: center; gap: 10px; }

  .sd-theme-toggle {
    display: flex; align-items: center; gap: 8px;
    background: none; border: none; cursor: pointer; padding: 0;
  }
  .sd-toggle-track {
    width: 50px; height: 26px; border-radius: 99px;
    position: relative; padding: 3px;
    border: 1px solid var(--border);
    display: flex; align-items: center; transition: border-color 0.4s;
  }
  .sd-toggle-thumb {
    width: 20px; height: 20px; border-radius: 50%; background: #fff;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 6px rgba(0,0,0,0.25); flex-shrink: 0;
  }
  .sd-toggle-label { font-size: 12px; font-weight: 600; color: var(--text-muted); transition: color 0.3s; min-width: 32px; }

  .sd-topbar-bell {
    position: relative; width: 38px; height: 38px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--bg-card);
    display: flex; align-items: center; justify-content: center;
    color: var(--text-sub); cursor: pointer; transition: all 0.2s;
  }
  .sd-topbar-bell:hover { border-color: var(--border-hov); color: var(--accent-text); }
  .sd-bell-dot {
    position: absolute; top: 6px; right: 6px;
    width: 8px; height: 8px; border-radius: 50%;
    background: #6366f1; border: 2px solid var(--bg);
    animation: sd-pulse 2s infinite;
  }
  @keyframes sd-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,.4); }
    50%       { box-shadow: 0 0 0 6px rgba(99,102,241,0); }
  }

  .sd-content { flex: 1; padding: 28px 32px; overflow-y: auto; }
  .sd-section { display: flex; flex-direction: column; gap: 22px; }

  /* Hero */
  .sd-hero {
    position: relative; overflow: hidden; border-radius: 24px;
    padding: 40px 40px 40px 44px; background: var(--hero-bg);
    border: 1px solid var(--hero-border);
    display: flex; align-items: center; justify-content: space-between;
    min-height: 230px; transition: background 0.4s ease;
  }
  .sd-hero-glow { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
  .sd-hero-glow-1 { width: 360px; height: 360px; background: rgba(99,102,241,0.15); top: -120px; right: -60px; }
  .sd-hero-glow-2 { width: 200px; height: 200px; background: rgba(139,92,246,0.10); bottom: -60px; left: 30%; }
  .sd-hero-content { position: relative; z-index: 2; max-width: 60%; }
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
  .sd-hero-sub { font-size: 14px; color: var(--text-sub); line-height: 1.7; margin-bottom: 18px; max-width: 480px; }

  /* Stats */
  .sd-stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .sd-stat-card {
    position: relative; overflow: hidden;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 20px; padding: 22px 20px;
    display: flex; align-items: center; gap: 16px;
    transition: all 0.3s ease; cursor: default;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }
  .sd-stat-card:hover { border-color: var(--border-hov); transform: translateY(-2px); box-shadow: 0 16px 40px rgba(99,102,241,0.08); }
  .sd-stat-icon-wrap {
    width: 48px; height: 48px; border-radius: 14px; background: var(--grad);
    display: flex; align-items: center; justify-content: center;
    color: #fff; flex-shrink: 0; box-shadow: 0 6px 18px rgba(0,0,0,0.2);
  }
  .sd-stat-body { flex: 1; }
  .sd-stat-value { display: block; font-size: 28px; font-weight: 800; color: var(--text-head); line-height: 1; margin-bottom: 4px; }
  .sd-stat-label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
  .sd-stat-glow {
    position: absolute; right: -30px; top: -30px;
    width: 100px; height: 100px; border-radius: 50%;
    background: var(--grad); filter: blur(50px); opacity: 0.1; pointer-events: none;
  }

  /* Cards */
  .sd-card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 20px; padding: 22px;
    display: flex; flex-direction: column; gap: 16px;
    transition: border-color 0.3s, box-shadow 0.3s, background 0.4s;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }
  .sd-card:hover { border-color: var(--border-hov); box-shadow: 0 12px 30px rgba(99,102,241,0.06); }
  .sd-card-header { display: flex; align-items: center; gap: 12px; }
  .sd-card-icon {
    width: 38px; height: 38px; border-radius: 11px; background: var(--accent-soft);
    display: flex; align-items: center; justify-content: center;
    color: var(--icon-color); flex-shrink: 0;
  }
  .sd-card-title { font-size: 14px; font-weight: 700; color: var(--text-head); }
  .sd-card-sub   { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
  .sd-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  /* List & Mini rows */
  .sd-mini-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .sd-mini-row:last-child { border-bottom: none; }
  .sd-mini-dot {
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #fff;
  }
  .sd-mini-body { flex: 1; min-width: 0; }
  .sd-mini-title { font-size: 12.5px; font-weight: 600; color: var(--text-head); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sd-mini-sub   { font-size: 11px; color: var(--text-muted); }

  /* Status badges */
  .sd-status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 99px;
    font-size: 11.5px; font-weight: 600; white-space: nowrap;
  }
  .sd-badge-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .sd-badge-blue    { background: rgba(96,165,250,0.1);   color: #3b82f6; border: 1px solid rgba(96,165,250,0.25); }
  .sd-badge-emerald { background: rgba(52,211,153,0.1);   color: #059669; border: 1px solid rgba(52,211,153,0.25); }
  .sd-badge-default { background: rgba(148,163,184,0.08); color: #64748b; border: 1px solid rgba(148,163,184,0.2); }
  .sd-dark .sd-badge-blue    { color: #93c5fd; }
  .sd-dark .sd-badge-emerald { color: #6ee7b7; }
`;

export default TPODashboard;