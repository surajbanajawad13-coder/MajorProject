import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, GraduationCap, LayoutDashboard, LogOut, Search, Users, UserRoundCheck, LoaderCircle, Building2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000/api/faculty';

export default function FacultyDashboard() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [savingStudent, setSavingStudent] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/dashboard`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setDashboard(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load department data.');
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const students = dashboard?.students || [];
  const filteredStudents = useMemo(() => students.filter(student => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [student.username, student.email, student.usn].some(value => value?.toLowerCase().includes(term));
    return matchesSearch && (statusFilter === 'All' || student.placementStatus === statusFilter);
  }), [students, search, statusFilter]);

  const updateMentorship = async (student) => {
    setSavingStudent(student._id);
    try {
      await axios.put(`${API}/students/${student._id}/mentor`, { assigned: !student.mentor }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      toast.success(student.mentor ? 'Student removed from your mentees.' : 'Student added to your mentees.');
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update mentorship.');
    } finally {
      setSavingStudent('');
    }
  };

  const faculty = dashboard?.faculty || user?.result || {};
  const analytics = dashboard?.analytics || {};
  const mentees = students.filter(student => student.mentor?._id === faculty._id);

  if (loading && !dashboard) return <div className="sd-loading-screen sd-light"><LoaderCircle className="pe-spin" style={{ width: '36px', height: '36px', color: 'var(--accent)' }} /> <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>Loading your department…</p></div>;

  return (
    <div className="sd-root sd-light">
      <style>{STYLES}</style>
      <aside className="sd-sidebar">
        <div className="sd-logo">
          <div className="sd-logo-icon">C</div>
          <span className="sd-logo-text">CampusConnect</span>
        </div>
        <div className="sd-avatar-wrap">
          <div className="sd-avatar">{(faculty.username || 'F').slice(0, 2).toUpperCase()}</div>
          <div className="sd-avatar-info">
            <p className="sd-avatar-name">{faculty.username || 'Faculty'}</p>
            <p className="sd-avatar-role">{faculty.designation || 'Department Faculty'}</p>
          </div>
        </div>
        <div className="sd-dept-badge"><Building2 size={15} /> Dept: {faculty.department || 'Department'}</div>
        <nav className="sd-nav">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'students', label: 'Department Students', icon: Users },
            { id: 'mentorship', label: 'Mentorship', icon: UserRoundCheck },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`sd-nav-item ${activeTab === id ? 'sd-nav-active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
              {activeTab === id && <div className="sd-nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sd-sidebar-spacer" />
        <button className="sd-logout-btn" onClick={logout}><LogOut size={16} /><span>Sign out</span></button>
      </aside>

      <main className="sd-main">
        <header className="sd-topbar">
          <div>
            <p className="sd-topbar-greeting">Department Portal / {faculty.department}</p>
            <h1 className="sd-topbar-title">{activeTab === 'overview' ? 'Faculty Overview' : activeTab === 'students' ? 'Department Students' : 'Mentorship Tracking'}</h1>
          </div>
          <div className="sd-topbar-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-sub)' }}>
              <span>{faculty.username}</span>
              <div className="sd-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', fontSize: '13px' }}>{(faculty.username || 'F').slice(0, 1).toUpperCase()}</div>
            </div>
          </div>
        </header>

        <div className="sd-content">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                <div className="sd-hero">
                  <div className="sd-hero-glow sd-hero-glow-1" />
                  <div className="sd-hero-glow sd-hero-glow-2" />
                  <div className="sd-hero-content">
                    <span className="sd-hero-chip"><GraduationCap size={12} /> {faculty.designation || 'Faculty'} · {faculty.department}</span>
                    <h2 className="sd-hero-heading">Welcome back, <br /><em>{faculty.username || 'Faculty'}!</em></h2>
                    <p className="sd-hero-sub">Here is the latest snapshot of your department performance and student placement metrics.</p>
                  </div>
                </div>

                <div className="sd-stats-row">
                  <StatCard icon={Users} label="Department Students" value={analytics.totalStudents || 0} gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" delay={0.05} />
                  <StatCard icon={UserRoundCheck} label="Students Placed" value={analytics.placedStudents || 0} gradient="linear-gradient(135deg,#10b981,#059669)" delay={0.1} />
                  <StatCard icon={Activity} label="Average CGPA" value={Number(analytics.averageCgpa || 0).toFixed(2)} gradient="linear-gradient(135deg,#0ea5e9,#06b6d4)" delay={0.15} />
                  <StatCard icon={GraduationCap} label="Placement Rate" value={`${analytics.placementRate || 0}%`} gradient="linear-gradient(135deg,#f59e0b,#d97706)" delay={0.2} />
                </div>

                <div className="sd-card">
                  <div className="sd-card-header">
                    <div className="sd-card-icon" style={{ '--icon-color': '#6366f1' }}><Building2 size={16} /></div>
                    <div>
                      <h3 className="sd-card-title">Department Snapshot</h3>
                      <p className="sd-card-sub">Placement and mentorship at a glance</p>
                    </div>
                    <button className="pe-btn-cancel" style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '12px' }} onClick={() => setActiveTab('students')}>View students</button>
                  </div>
                  <div className="snapshot-grid">
                    <div className="snapshot-item"><span>Active mentees</span><strong>{mentees.length}</strong><small>Students assigned to you</small></div>
                    <div className="snapshot-item"><span>Placement progress</span><strong>{analytics.placementRate || 0}%</strong><small>{analytics.placedStudents || 0} of {analytics.totalStudents || 0} students placed</small></div>
                    <div className="snapshot-item"><span>Department average</span><strong>{Number(analytics.averageCgpa || 0).toFixed(2)}</strong><small>Mean student CGPA</small></div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'students' && (
              <motion.div key="students" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                <div className="sd-card">
                  <div className="sd-card-header">
                    <div>
                      <h3 className="sd-card-title">Department Students</h3>
                      <p className="sd-card-sub">{filteredStudents.length} students registered in {faculty.department}</p>
                    </div>
                  </div>
                  
                  <div className="student-controls">
                    <div className="pe-field" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '11px', padding: '0 12px' }}>
                        <Search size={16} color="var(--text-muted)" />
                        <input className="pe-input" style={{ border: 'none', background: 'transparent', padding: '10px 0', width: '100%' }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, or USN..." />
                      </div>
                    </div>
                    <div className="pe-field" style={{ width: '180px' }}>
                      <select className="pe-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="All">All Statuses</option>
                        <option value="Placed">Placed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Unplaced">Unplaced</option>
                      </select>
                    </div>
                  </div>

                  <div className="sd-table-wrap">
                    <table className="sd-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>USN</th>
                          <th>CGPA</th>
                          <th>Placement Status</th>
                          <th>Mentorship Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map(student => (
                          <tr key={student._id}>
                            <td>
                              <div className="table-person">
                                <div className="sd-mini-dot" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{student.username.slice(0, 1).toUpperCase()}</div>
                                <div>
                                  <p style={{ fontWeight: '600', color: 'var(--text-head)' }}>{student.username}</p>
                                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td>{student.usn}</td>
                            <td style={{ fontWeight: '600' }}>{Number(student.cgpa || 0).toFixed(2)}</td>
                            <td>
                              <span className={`sd-status-badge ${student.placementStatus === 'Placed' ? 'sd-badge-emerald' : student.placementStatus === 'In Progress' ? 'sd-badge-blue' : 'sd-badge-default'}`}>
                                {student.placementStatus}
                              </span>
                            </td>
                            <td>
                              <button 
                                className={`pe-btn-cancel ${student.mentor?._id === faculty._id ? 'assigned' : ''}`}
                                style={{ padding: '6px 12px', fontSize: '11px', background: student.mentor?._id === faculty._id ? 'var(--accent-soft)' : 'transparent', color: student.mentor?._id === faculty._id ? 'var(--accent-text)' : 'var(--text-sub)' }}
                                disabled={savingStudent === student._id || (!!student.mentor && student.mentor._id !== faculty._id)}
                                onClick={() => updateMentorship(student)}
                              >
                                {savingStudent === student._id ? 'Saving…' : student.mentor?._id === faculty._id ? 'Assigned to you' : student.mentor ? `Mentor: ${student.mentor.username}` : 'Assign to me'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredStudents.length === 0 && <div className="sd-empty-inline" style={{ padding: '30px' }}><p>No students match these filters.</p></div>}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'mentorship' && (
              <motion.div key="mentorship" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                <div className="sd-card">
                  <div className="sd-card-header">
                    <div>
                      <h3 className="sd-card-title">Your Mentees</h3>
                      <p className="sd-card-sub">Track and manage students assigned directly to your mentorship</p>
                    </div>
                    <span className="sd-count-badge" style={{ marginLeft: 'auto' }}>{mentees.length} assigned</span>
                  </div>
                  {mentees.length > 0 ? (
                    <div className="mentee-grid">
                      {mentees.map(student => (
                        <div key={student._id} className="mentee-card">
                          <div className="sd-mini-dot" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', width: '38px', height: '38px', borderRadius: '10px' }}>{student.username.slice(0, 1).toUpperCase()}</div>
                          <div className="mentee-info">
                            <p style={{ fontWeight: '600', color: 'var(--text-head)', fontSize: '13px' }}>{student.username}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{student.usn} · CGPA {Number(student.cgpa || 0).toFixed(2)}</p>
                          </div>
                          <button className="pe-resume-remove" style={{ width: '28px', height: '28px' }} onClick={() => updateMentorship(student)} title="Remove mentee">×</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="sd-empty-card">
                      <div className="sd-empty-icon"><UserRoundCheck size={32} /></div>
                      <p>No mentees assigned yet. Assign students from the Department Students tab.</p>
                      <button className="pe-btn-save" style={{ marginTop: '10px' }} onClick={() => setActiveTab('students')}>Browse students</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gradient, delay }) {
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
        <span className="sd-stat-value">{value}</span>
        <span className="sd-stat-label">{label}</span>
      </div>
      <div className="sd-stat-glow" />
    </motion.div>
  );
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

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
  .sd-sidebar { width: 250px; flex-shrink: 0; background: var(--bg-sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 24px 16px; position: sticky; top: 0; height: 100vh; }
  .sd-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; padding: 0 8px; }
  .sd-logo-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #fff; }
  .sd-logo-text { font-size: 15px; font-weight: 700; color: var(--text-head); }
  
  .sd-avatar-wrap { display: flex; align-items: center; gap: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 12px; margin-bottom: 14px; }
  .sd-avatar { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #fff; flex-shrink: 0; }
  .sd-avatar-name { font-size: 13px; font-weight: 600; color: var(--text-head); }
  .sd-avatar-role { font-size: 11px; color: var(--text-muted); }

  .sd-dept-badge { display: flex; align-items: center; gap: 8px; color: var(--accent-text); background: var(--accent-soft); padding: 10px 12px; border-radius: 12px; margin-bottom: 20px; font-size: 12px; font-weight: 600; }

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

  .sd-content { flex: 1; padding: 28px 32px; overflow-y: auto; }
  .sd-section { display: flex; flex-direction: column; gap: 22px; }

  .sd-hero { position: relative; overflow: hidden; border-radius: 24px; padding: 40px; background: var(--hero-bg); border: 1px solid var(--hero-border); min-height: 200px; display: flex; align-items: center; }
  .sd-hero-content { position: relative; z-index: 2; max-width: 70%; }
  .sd-hero-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 99px; background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3); color: var(--accent-text); font-size: 11px; font-weight: 600; margin-bottom: 14px; }
  .sd-hero-heading { font-size: 34px; font-weight: 800; color: var(--text-head); line-height: 1.1; margin-bottom: 10px; }
  .sd-hero-heading em { font-style: normal; color: var(--accent-text); }
  .sd-hero-sub { font-size: 14px; color: var(--text-sub); line-height: 1.6; }

  .sd-stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
  .sd-stat-card { position: relative; overflow: hidden; background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 22px 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
  .sd-stat-icon-wrap { width: 48px; height: 48px; border-radius: 14px; background: var(--grad); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
  .sd-stat-body { flex: 1; }
  .sd-stat-value { display: block; font-size: 26px; font-weight: 800; color: var(--text-head); line-height: 1; }
  .sd-stat-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
  .sd-stat-glow { position: absolute; right: -30px; top: -30px; width: 100px; height: 100px; border-radius: 50%; background: var(--grad); filter: blur(50px); opacity: 0.1; pointer-events: none; }

  .sd-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 22px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
  .sd-card-header { display: flex; align-items: center; gap: 12px; }
  .sd-card-icon { width: 38px; height: 38px; border-radius: 11px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center; color: var(--icon-color); }
  .sd-card-title { font-size: 15px; font-weight: 700; color: var(--text-head); }
  .sd-card-sub { font-size: 11.5px; color: var(--text-muted); }
  .sd-count-badge { padding: 4px 10px; border-radius: 99px; background: var(--accent-soft); font-size: 12px; font-weight: 600; color: var(--accent-text); }

  .snapshot-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .snapshot-item { background: var(--bg-input); border: 1px solid var(--border); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 6px; }
  .snapshot-item span { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
  .snapshot-item strong { font-size: 24px; font-weight: 800; color: var(--text-head); }
  .snapshot-item small { font-size: 12px; color: var(--text-sub); }

  .student-controls { display: flex; gap: 12px; align-items: center; }
  .sd-table-wrap { overflow-x: auto; }
  .sd-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
  .sd-table th { padding: 14px 16px; background: var(--bg-card-hov); color: var(--text-muted); font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--border); }
  .sd-table td { padding: 14px 16px; border-bottom: 1px solid var(--border); color: var(--text-body); }
  
  .table-person { display: flex; align-items: center; gap: 12px; }
  .sd-mini-dot { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #fff; flex-shrink: 0; }
  
  .sd-status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 99px; font-size: 11.5px; font-weight: 600; }
  .sd-badge-emerald { background: rgba(52,211,153,0.1); color: #059669; border: 1px solid rgba(52,211,153,0.25); }
  .sd-badge-blue { background: rgba(96,165,250,0.1); color: #3b82f6; border: 1px solid rgba(96,165,250,0.25); }
  .sd-badge-default { background: rgba(148,163,184,0.08); color: #64748b; border: 1px solid rgba(148,163,184,0.2); }

  .mentee-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .mentee-card { display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 16px; border: 1px solid var(--border); background: var(--bg-card); }
  .mentee-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }

  .pe-field { display: flex; flex-direction: column; gap: 6px; }
  .pe-input { padding: 10px 14px; border-radius: 11px; border: 1px solid var(--border); background: var(--bg-input); color: var(--text-head); font-size: 13.5px; outline: none; }
  .pe-btn-cancel { padding: 8px 16px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text-muted); font-size: 13px; font-weight: 600; cursor: pointer; }
  .pe-btn-save { padding: 9px 20px; border-radius: 10px; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; font-size: 13px; font-weight: 600; border: none; cursor: pointer; }
  .pe-resume-remove { width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(248,113,113,0.1); color: #f87171; cursor: pointer; display: flex; align-items: center; justify-content: center; }

  .sd-empty-inline { text-align: center; color: var(--text-muted); }
  .sd-empty-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 40px; text-align: center; color: var(--text-muted); }
  .sd-empty-icon { color: var(--text-dim); }

  @media (max-width: 900px) {
    .sd-sidebar { display: none; }
    .sd-stats-row { grid-template-columns: repeat(2,1fr); }
    .snapshot-grid { grid-template-columns: 1fr; }
  }
`;