/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Component: AdminDashboard.jsx
 * Purpose: Global platform view for Administrators - user management
 *          (search/filter/change role/delete) and platform-wide
 *          analytics (department breakdown, role breakdown, recent
 *          activity feed) sourced from /api/admin/* and /api/analytics/*.
 *
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  LogOut,
  Sun,
  Moon,
  Search,
  Trash2,
  Shield,
  GraduationCap,
  Briefcase,
  Loader2,
  Activity,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000';

function getToken() {
  const profileString = localStorage.getItem('profile');
  const profileData = profileString ? JSON.parse(profileString) : null;
  return profileData?.token || null;
}
function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const PIE_COLORS = ['#6366f1', '#f59e0b', '#34d399', '#f87171', '#a78bfa', '#38bdf8'];

const ROLE_OPTIONS = ['Student', 'Society Admin', 'Placement Officer', 'Admin'];

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
      className="ad-stat-card"
      style={{ '--grad': gradient }}
    >
      <div className="ad-stat-icon-wrap"><Icon size={20} /></div>
      <div className="ad-stat-body">
        <span className="ad-stat-value">{animatedVal}</span>
        <span className="ad-stat-label">{label}</span>
      </div>
      <div className="ad-stat-glow" />
    </motion.div>
  );
};

const ThemeToggle = ({ isDark, onToggle }) => (
  <motion.button onClick={onToggle} className="ad-theme-toggle" whileTap={{ scale: 0.92 }} title={isDark ? 'Switch to Light' : 'Switch to Dark'}>
    <motion.div className="ad-toggle-track" animate={{ background: isDark ? 'linear-gradient(135deg,#1e1b4b,#312e81)' : 'linear-gradient(135deg,#e0f2fe,#bae6fd)' }} transition={{ duration: 0.4 }}>
      <motion.div className="ad-toggle-thumb" animate={{ x: isDark ? 2 : 26 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
        {isDark ? <Moon size={12} color="#818cf8" /> : <Sun size={12} color="#f59e0b" />}
      </motion.div>
    </motion.div>
    <span className="ad-toggle-label">{isDark ? 'Dark' : 'Light'}</span>
  </motion.button>
);

const RoleBadge = ({ role }) => {
  const cfg = {
    Student: { cls: 'ad-badge-blue', icon: GraduationCap },
    'Society Admin': { cls: 'ad-badge-amber', icon: Shield },
    'Placement Officer': { cls: 'ad-badge-emerald', icon: Briefcase },
    Admin: { cls: 'ad-badge-purple', icon: Shield },
  }[role] || { cls: 'ad-badge-default', icon: Shield };
  const Icon = cfg.icon;
  return (
    <span className={`ad-role-badge ${cfg.cls}`}>
      <Icon size={12} /> {role}
    </span>
  );
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);

  const theme = isDark ? 'ad-dark' : 'ad-light';
  const displayName = user?.result?.username || 'Administrator';

  const loadOverview = async () => {
    setLoading(true);
    try {
      const [summaryRes, overviewRes, activityRes] = await Promise.all([
        axios.get(`${API}/api/admin/summary`, { headers: authHeaders() }),
        axios.get(`${API}/api/analytics/overview`, { headers: authHeaders() }),
        axios.get(`${API}/api/analytics/activity?limit=15`, { headers: authHeaders() }),
      ]);
      setSummary(summaryRes.data.data);
      setOverview(overviewRes.data.data);
      setActivity(activityRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load admin overview');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await axios.get(`${API}/api/admin/users`, { headers: authHeaders(), params });
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => { loadOverview(); }, []);
  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`${API}/api/admin/users/${userId}/role`, { role: newRole }, { headers: authHeaders() });
      toast.success('Role updated');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await axios.delete(`${API}/api/admin/users/${userId}`, { headers: authHeaders() });
      toast.success('User deleted');
      loadUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const navItems = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'analytics', label: 'Global Analytics', icon: BarChart3 },
  ];

  const departmentData = (overview?.departmentBreakdown || []).map((d) => ({
    name: d._id || 'Unspecified',
    value: d.count,
  }));
  const roleData = (overview?.roleBreakdown || []).map((r) => ({
    name: r._id,
    value: r.count,
  }));

  return (
    <div className={`ad-root ${theme}`}>
      <style>{ADMIN_STYLES}</style>

      <aside className="ad-sidebar">
        <div className="ad-logo">
          <div className="ad-logo-icon">CC</div>
          <div>
            <div className="ad-logo-text">CampusConnect</div>
            <div className="ad-logo-sub">Administrator</div>
          </div>
        </div>

        <nav className="ad-nav">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`ad-nav-item ${activeTab === key ? 'ad-nav-active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="ad-sidebar-footer">
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark((d) => !d)} />
          <button className="ad-logout-btn" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="ad-main">
        <header className="ad-topbar">
          <div>
            <h1 className="ad-topbar-title">Welcome, {displayName}</h1>
            <p className="ad-topbar-sub">Platform-wide oversight and user management</p>
          </div>
        </header>

        {loading ? (
          <div className="ad-loading"><Loader2 className="ad-spin" size={28} /> Loading dashboard...</div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <>
                <div className="ad-stats-grid">
                  <StatCard icon={Users} label="Total Users" value={summary?.totalUsers || 0} gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" delay={0.05} />
                  <StatCard icon={GraduationCap} label="Learners" value={summary?.totalStudents || 0} gradient="linear-gradient(135deg,#38bdf8,#0ea5e9)" delay={0.1} />
                  <StatCard icon={Shield} label="Coordinators" value={summary?.totalCoordinators || 0} gradient="linear-gradient(135deg,#f59e0b,#d97706)" delay={0.15} />
                  <StatCard icon={Briefcase} label="Placement Officers" value={summary?.totalTPOs || 0} gradient="linear-gradient(135deg,#34d399,#059669)" delay={0.2} />
                  <StatCard icon={BarChart3} label="Events" value={summary?.totalEvents || 0} gradient="linear-gradient(135deg,#a78bfa,#7c3aed)" delay={0.25} />
                  <StatCard icon={Briefcase} label="Placement Drives" value={summary?.totalCompanies || 0} gradient="linear-gradient(135deg,#f87171,#dc2626)" delay={0.3} />
                </div>

                <section className="ad-section">
                  <h2 className="ad-section-title">Recent Platform Activity</h2>
                  <div className="ad-activity-card">
                    {activity.length === 0 ? (
                      <div className="ad-empty">No recorded activity yet.</div>
                    ) : (
                      activity.map((log) => (
                        <div key={log._id} className="ad-activity-row">
                          <Activity size={14} className="ad-activity-icon" />
                          <div>
                            <span className="ad-activity-action">{log.action.replace(/_/g, ' ')}</span>
                            {log.user?.username && <span className="ad-activity-user"> by {log.user.username}</span>}
                          </div>
                          <span className="ad-activity-time">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </>
            )}

            {activeTab === 'users' && (
              <section className="ad-section">
                <form className="ad-search-bar" onSubmit={handleSearch}>
                  <div className="ad-search-input-wrap">
                    <Search size={16} />
                    <input
                      placeholder="Search by name, email, or USN..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">All Roles</option>
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button type="submit" className="ad-primary-btn">Search</button>
                </form>

                {usersLoading ? (
                  <div className="ad-loading"><Loader2 className="ad-spin" size={22} /> Loading users...</div>
                ) : (
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>USN</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>CGPA</th>
                          <th>Role</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u._id}>
                            <td>{u.username}</td>
                            <td>{u.usn}</td>
                            <td>{u.email}</td>
                            <td>{u.department}</td>
                            <td>{u.cgpa}</td>
                            <td>
                              <div className="ad-role-cell">
                                <RoleBadge role={u.role} />
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                  className="ad-role-select"
                                >
                                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                              </div>
                            </td>
                            <td>
                              <button className="ad-icon-btn ad-icon-btn-danger" onClick={() => handleDeleteUser(u._id)}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {users.length === 0 && <div className="ad-empty">No users match this search.</div>}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'analytics' && (
              <>
                <section className="ad-section">
                  <h2 className="ad-section-title">Learners by Department</h2>
                  <div className="ad-chart-card">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={departmentData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#475569' }} />
                        <YAxis tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#475569' }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: isDark ? '#0f1623' : '#fff', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8 }} />
                        <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} name="Learners" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="ad-section">
                  <h2 className="ad-section-title">Users by Role</h2>
                  <div className="ad-chart-card ad-chart-card-flex">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                          {roleData.map((entry, idx) => (
                            <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: isDark ? '#0f1623' : '#fff', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8 }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const ADMIN_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ad-dark {
    --bg: #0d1117; --bg-sidebar: #0f1623; --bg-card: rgba(255,255,255,0.03);
    --bg-card-hov: rgba(255,255,255,0.05); --bg-input: rgba(255,255,255,0.04);
    --border: rgba(255,255,255,0.07); --text-head: #f1f5f9; --text-body: #e2e8f0;
    --text-sub: #94a3b8; --text-muted: #64748b; --accent: #6366f1;
    --accent-soft: rgba(99,102,241,0.12); --accent-text: #818cf8;
  }
  .ad-light {
    --bg: #f0f4ff; --bg-sidebar: #ffffff; --bg-card: #ffffff;
    --bg-card-hov: #fafbff; --bg-input: #f8faff;
    --border: rgba(99,102,241,0.1); --text-head: #1e1b4b; --text-body: #1e293b;
    --text-sub: #475569; --text-muted: #64748b; --accent: #6366f1;
    --accent-soft: rgba(99,102,241,0.08); --accent-text: #4f46e5;
  }

  .ad-root { display: flex; min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; color: var(--text-body); }

  .ad-sidebar { width: 240px; flex-shrink: 0; background: var(--bg-sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 24px 16px; position: sticky; top: 0; height: 100vh; }
  .ad-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; padding: 0 8px; }
  .ad-logo-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; color: #fff; }
  .ad-logo-text { font-size: 15px; font-weight: 700; color: var(--text-head); }
  .ad-logo-sub { font-size: 11px; color: var(--text-muted); }

  .ad-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .ad-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; border: none; background: none; color: var(--text-sub); font-size: 14px; font-weight: 500; cursor: pointer; text-align: left; }
  .ad-nav-item:hover { background: var(--bg-card-hov); color: var(--text-head); }
  .ad-nav-active { background: var(--accent-soft); color: var(--accent-text); font-weight: 600; }

  .ad-sidebar-footer { display: flex; flex-direction: column; gap: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .ad-theme-toggle { display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; }
  .ad-toggle-track { width: 44px; height: 22px; border-radius: 99px; position: relative; padding: 2px; }
  .ad-toggle-thumb { width: 18px; height: 18px; border-radius: 50%; background: #0d1117; display: flex; align-items: center; justify-content: center; position: absolute; top: 2px; }
  .ad-toggle-label { font-size: 12px; color: var(--text-sub); font-weight: 600; }
  .ad-logout-btn { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-radius: 10px; border: 1px solid var(--border); background: none; color: var(--text-sub); font-size: 13px; font-weight: 600; cursor: pointer; }
  .ad-logout-btn:hover { color: #f87171; border-color: rgba(248,113,113,0.3); }

  .ad-main { flex: 1; padding: 28px 36px; overflow-x: hidden; }
  .ad-topbar { margin-bottom: 28px; }
  .ad-topbar-title { font-size: 24px; font-weight: 800; color: var(--text-head); }
  .ad-topbar-sub { font-size: 14px; color: var(--text-sub); margin-top: 4px; }

  .ad-loading { display: flex; align-items: center; gap: 10px; color: var(--text-sub); padding: 60px 0; justify-content: center; font-size: 14px; }
  .ad-spin { animation: ad-spin 1s linear infinite; }
  @keyframes ad-spin { to { transform: rotate(360deg); } }

  .ad-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; margin-bottom: 28px; }
  .ad-stat-card { position: relative; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 18px; display: flex; align-items: center; gap: 14px; overflow: hidden; }
  .ad-stat-icon-wrap { width: 44px; height: 44px; border-radius: 12px; background: var(--grad); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
  .ad-stat-value { font-size: 20px; font-weight: 800; color: var(--text-head); display: block; }
  .ad-stat-label { font-size: 12px; color: var(--text-sub); }
  .ad-stat-glow { position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: var(--grad); filter: blur(30px); opacity: 0.25; }

  .ad-section { margin-bottom: 32px; }
  .ad-section-title { font-size: 17px; font-weight: 700; color: var(--text-head); margin-bottom: 14px; }
  .ad-chart-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
  .ad-chart-card-flex { display: flex; justify-content: center; }
  .ad-empty { padding: 32px; text-align: center; color: var(--text-muted); }

  .ad-activity-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 8px; }
  .ad-activity-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 13px; }
  .ad-activity-row:last-child { border-bottom: none; }
  .ad-activity-icon { color: var(--accent-text); flex-shrink: 0; }
  .ad-activity-action { text-transform: capitalize; font-weight: 600; color: var(--text-head); }
  .ad-activity-user { color: var(--text-sub); }
  .ad-activity-time { margin-left: auto; color: var(--text-muted); font-size: 11px; }

  .ad-search-bar { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
  .ad-search-input-wrap { display: flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-input); flex: 1; min-width: 220px; color: var(--text-sub); }
  .ad-search-input-wrap input { border: none; background: none; outline: none; flex: 1; color: var(--text-head); font-size: 13px; font-family: inherit; }
  .ad-search-bar select { padding: 9px 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-input); color: var(--text-head); font-size: 13px; font-family: inherit; }
  .ad-primary-btn { padding: 9px 18px; border-radius: 10px; border: none; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; font-weight: 700; cursor: pointer; font-size: 13px; }

  .ad-table-wrap { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow-x: auto; }
  .ad-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .ad-table th { text-align: left; padding: 12px 16px; color: var(--text-sub); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1px solid var(--border); }
  .ad-table td { padding: 12px 16px; border-bottom: 1px solid var(--border); color: var(--text-body); }
  .ad-table tr:last-child td { border-bottom: none; }

  .ad-role-cell { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .ad-role-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 99px; }
  .ad-badge-blue { background: rgba(96,165,250,0.15); color: #60a5fa; }
  .ad-badge-amber { background: rgba(245,158,11,0.15); color: #f59e0b; }
  .ad-badge-emerald { background: rgba(52,211,153,0.15); color: #34d399; }
  .ad-badge-purple { background: rgba(167,139,250,0.15); color: #a78bfa; }
  .ad-badge-default { background: rgba(148,163,184,0.15); color: #94a3b8; }
  .ad-role-select { font-size: 11px; padding: 4px 6px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-input); color: var(--text-body); font-family: inherit; }

  .ad-icon-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--text-sub); display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .ad-icon-btn-danger:hover { border-color: rgba(248,113,113,0.4); color: #f87171; }
`;
