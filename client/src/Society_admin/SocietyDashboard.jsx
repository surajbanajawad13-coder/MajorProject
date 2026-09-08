/**
 * CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
 * ---------------------------------------------------------------------
 * Component: SocietyDashboard.jsx  ("Coordinator Dashboard")
 * Purpose: Lets a Society Admin / Coordinator create technical events,
 *          view who has registered / applied, and see participation
 *          analytics charts (Recharts) sourced from
 *          GET /api/analytics/events and GET /api/analytics/placements.
 *
 * Project by: Vikas (USN: 4CB23CS186)
 * ---------------------------------------------------------------------
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarPlus,
  Users,
  BarChart3,
  Bell,
  Plus,
  Zap,
  LogOut,
  Sun,
  Moon,
  X,
  Calendar,
  MapPin,
  Tag,
  Trash2,
  Pencil,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
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

/* ─────────────────────────────────────────────
   Small building blocks (mirrors the visual
   language used in StudentDashboard / TPODashboard)
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
            : <motion.span key="sun" initial={{ rotate: 30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -30, opacity: 0 }} transition={{ duration: 0.2 }}><Sun size={12} color="#f59e0b" /></motion.span>
          }
        </AnimatePresence>
      </motion.div>
    </motion.div>
    <span className="sd-toggle-label">{isDark ? 'Dark' : 'Light'}</span>
  </motion.button>
);

const PIE_COLORS = ['#6366f1', '#f59e0b', '#34d399', '#f87171'];

/* ─────────────────────────────────────────────
   Create / Edit Event Modal
───────────────────────────────────────────── */
const EventModal = ({ onClose, isDark, onSaved, editingEvent, societyId }) => {
  const theme = isDark ? 'sd-dark' : 'sd-light';
  const [form, setForm] = useState({
    title: editingEvent?.title || '',
    description: editingEvent?.description || '',
    eventDate: editingEvent?.eventDate ? editingEvent.eventDate.slice(0, 10) : '',
    venue: editingEvent?.venue || '',
    category: editingEvent?.category || 'Technical',
    domain: editingEvent?.domain || '',
    tags: editingEvent?.tags?.join(', ') || '',
    required_skills: editingEvent?.required_skills?.join(', ') || '',
    eligibility_branch: editingEvent?.eligibility_branch?.join(', ') || '',
    eligibility_year: editingEvent?.eligibility_year?.join(', ') || '',
    capacity: editingEvent?.capacity || '',
    registrationLink: editingEvent?.registrationLink || '',
  });
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSave = async () => {
    if (!form.title || !form.description || !form.eventDate || !form.venue) {
      toast.error('Title, description, date, and venue are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        eventDate: form.eventDate,
        venue: form.venue,
        category: form.category,
        domain: form.domain,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        registrationLink: form.registrationLink,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        required_skills: form.required_skills.split(',').map((t) => t.trim()).filter(Boolean),
        eligibility_branch: form.eligibility_branch.split(',').map((t) => t.trim()).filter(Boolean),
        eligibility_year: form.eligibility_year.split(',').map((t) => t.trim()).filter(Boolean),
        organizer: societyId,
      };

      if (editingEvent) {
        await axios.put(`${API}/api/events/${editingEvent._id}`, payload, { headers: authHeaders() });
        toast.success('Event updated');
      } else {
        await axios.post(`${API}/api/events`, payload, { headers: authHeaders() });
        toast.success('Event created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
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
            <div className="pe-avatar-big" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}><CalendarPlus size={24} color="#fff" /></div>
            <div>
              <h2 className="pe-title">{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
              <p className="pe-subtitle">Publish a technical event for learners to discover</p>
            </div>
          </div>
          <button className="pe-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="pe-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="pe-field" style={{ gridColumn: 'span 2' }}>
            <label className="pe-label">Event Title</label>
            <input className="pe-input" placeholder="e.g. AI/ML Hackathon 2026" value={form.title} onChange={update('title')} />
          </div>
          <div className="pe-field" style={{ gridColumn: 'span 2' }}>
            <label className="pe-label">Description</label>
            <textarea className="pe-input" rows={3} placeholder="What is this event about?" value={form.description} onChange={update('description')} />
          </div>
          <div className="pe-field">
            <label className="pe-label">Date</label>
            <input className="pe-input" type="date" value={form.eventDate} onChange={update('eventDate')} />
          </div>
          <div className="pe-field">
            <label className="pe-label">Venue</label>
            <input className="pe-input" placeholder="Seminar Hall / Online" value={form.venue} onChange={update('venue')} />
          </div>
          <div className="pe-field">
            <label className="pe-label">Category</label>
            <select className="pe-input" value={form.category} onChange={update('category')}>
              {['Technical', 'Workshop', 'Hackathon', 'Seminar', 'Cultural', 'Sports', 'Other'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="pe-field">
            <label className="pe-label">Domain (for AI matching)</label>
            <input className="pe-input" placeholder="e.g. web development, ai" value={form.domain} onChange={update('domain')} />
          </div>
          <div className="pe-field" style={{ gridColumn: 'span 2' }}>
            <label className="pe-label">Tags (comma separated)</label>
            <input className="pe-input" placeholder="hackathon, 24hr, teams" value={form.tags} onChange={update('tags')} />
          </div>
          <div className="pe-field" style={{ gridColumn: 'span 2' }}>
            <label className="pe-label">Required Skills (comma separated, drives AI recommendations)</label>
            <input className="pe-input" placeholder="python, react, tensorflow" value={form.required_skills} onChange={update('required_skills')} />
          </div>
          <div className="pe-field">
            <label className="pe-label">Eligible Branches (comma separated, blank = all)</label>
            <input className="pe-input" placeholder="CSE, ISE" value={form.eligibility_branch} onChange={update('eligibility_branch')} />
          </div>
          <div className="pe-field">
            <label className="pe-label">Eligible Years (comma separated, blank = all)</label>
            <input className="pe-input" placeholder="3, 4" value={form.eligibility_year} onChange={update('eligibility_year')} />
          </div>
          <div className="pe-field">
            <label className="pe-label">Capacity</label>
            <input className="pe-input" type="number" placeholder="100" value={form.capacity} onChange={update('capacity')} />
          </div>
          <div className="pe-field">
            <label className="pe-label">Registration Link (optional)</label>
            <input className="pe-input" placeholder="https://..." value={form.registrationLink} onChange={update('registrationLink')} />
          </div>
        </div>

        <div className="pe-footer">
          <button className="pe-btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="pe-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─────────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────────── */
export default function SocietyDashboard() {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState([]);
  const [eventStats, setEventStats] = useState([]);
  const [placementStats, setPlacementStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const theme = isDark ? 'sd-dark' : 'sd-light';
  const displayName = user?.result?.username || 'Coordinator';

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, eventStatsRes, placementStatsRes] = await Promise.all([
        axios.get(`${API}/api/events`),
        axios.get(`${API}/api/analytics/events`, { headers: authHeaders() }),
        axios.get(`${API}/api/analytics/placements`, { headers: authHeaders() }),
      ]);
      setEvents(eventsRes.data.data || []);
      setEventStats(eventStatsRes.data.data || []);
      setPlacementStats(placementStatsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (eventId) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/api/events/${eventId}`, { headers: authHeaders() });
      toast.success('Event deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  const totalRegistrations = eventStats.reduce((sum, e) => sum + (e.registrations || 0), 0);
  const totalApplications = placementStats.reduce((sum, p) => {
    const c = p.statusCounts || {};
    return sum + (c.Applied || 0) + (c.Interviewing || 0) + (c.Placed || 0) + (c.Rejected || 0);
  }, 0);
  const totalPlaced = placementStats.reduce((sum, p) => sum + (p.statusCounts?.Placed || 0), 0);

  const placementFunnelTotals = ['Applied', 'Interviewing', 'Placed', 'Rejected'].map((status) => ({
    name: status,
    value: placementStats.reduce((sum, p) => sum + (p.statusCounts?.[status] || 0), 0),
  }));

  const navItems = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'events', label: 'My Events', icon: CalendarPlus },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className={`sd-root ${theme}`}>
      <style>{COORD_STYLES}</style>

      {/* Sidebar */}
      <aside className="sd-sidebar">
        <div className="sd-logo">
          <div className="sd-logo-icon">CC</div>
          <div>
            <div className="sd-logo-text">CampusConnect</div>
            <div className="sd-logo-sub">Coordinator</div>
          </div>
        </div>

        <nav className="sd-nav">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`sd-nav-item ${activeTab === key ? 'sd-nav-active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sd-sidebar-footer">
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark((d) => !d)} />
          <button className="sd-logout-btn" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="sd-main">
        <header className="sd-topbar">
          <div>
            <h1 className="sd-topbar-title">Welcome back, {displayName}</h1>
            <p className="sd-topbar-sub">Manage your society's events and track engagement</p>
          </div>
          <button className="sd-primary-btn" onClick={() => { setEditingEvent(null); setShowEventModal(true); }}>
            <Plus size={16} /> New Event
          </button>
        </header>

        {loading ? (
          <div className="sd-loading"><Loader2 className="sd-spin" size={28} /> Loading dashboard...</div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <>
                <div className="sd-stats-grid">
                  <StatCard icon={CalendarPlus} label="Events Hosted" value={events.length} gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" delay={0.05} />
                  <StatCard icon={Users} label="Total Registrations" value={totalRegistrations} gradient="linear-gradient(135deg,#f59e0b,#d97706)" delay={0.1} />
                  <StatCard icon={Zap} label="Placement Applications" value={totalApplications} gradient="linear-gradient(135deg,#34d399,#059669)" delay={0.15} />
                  <StatCard icon={BarChart3} label="Students Placed" value={totalPlaced} gradient="linear-gradient(135deg,#f87171,#dc2626)" delay={0.2} />
                </div>

                <section className="sd-section">
                  <h2 className="sd-section-title">Event Participation</h2>
                  <div className="sd-chart-card">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={eventStats.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} />
                        <XAxis dataKey="title" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#475569' }} interval={0} angle={-15} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#475569' }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: isDark ? '#0f1623' : '#fff', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8 }} />
                        <Bar dataKey="registrations" fill="#6366f1" radius={[6, 6, 0, 0]} name="Registrations" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </>
            )}

            {activeTab === 'events' && (
              <section className="sd-section">
                <h2 className="sd-section-title">My Events</h2>
                {events.length === 0 ? (
                  <div className="sd-empty">No events created yet. Click "New Event" to get started.</div>
                ) : (
                  <div className="sd-event-list">
                    {events.map((ev) => (
                      <motion.div key={ev._id} className="sd-event-row" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="sd-event-row-main">
                          <h3>{ev.title}</h3>
                          <div className="sd-event-meta">
                            <span><Calendar size={13} /> {new Date(ev.eventDate).toDateString()}</span>
                            <span><MapPin size={13} /> {ev.venue}</span>
                            <span><Users size={13} /> {ev.registeredStudents?.length || 0} registered</span>
                          </div>
                          {ev.tags?.length > 0 && (
                            <div className="sd-tag-row">
                              {ev.tags.map((t) => <span key={t} className="sd-tag"><Tag size={11} />{t}</span>)}
                            </div>
                          )}
                        </div>
                        <div className="sd-event-row-actions">
                          <button className="sd-icon-btn" onClick={() => { setEditingEvent(ev); setShowEventModal(true); }}><Pencil size={15} /></button>
                          <button className="sd-icon-btn sd-icon-btn-danger" onClick={() => handleDelete(ev._id)}><Trash2 size={15} /></button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'analytics' && (
              <>
                <section className="sd-section">
                  <h2 className="sd-section-title">Event Registrations by Event</h2>
                  <div className="sd-chart-card">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={eventStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} />
                        <XAxis dataKey="title" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#475569' }} interval={0} angle={-20} textAnchor="end" height={70} />
                        <YAxis tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#475569' }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: isDark ? '#0f1623' : '#fff', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8 }} />
                        <Bar dataKey="registrations" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="sd-section">
                  <h2 className="sd-section-title">Placement Application Funnel</h2>
                  <div className="sd-chart-card sd-chart-card-flex">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={placementFunnelTotals} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                          {placementFunnelTotals.map((entry, idx) => (
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

      {showEventModal && (
        <EventModal
          isDark={isDark}
          editingEvent={editingEvent}
          societyId={user?.result?.societyId || user?.result?._id}
          onClose={() => setShowEventModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Styles - reuses the sd-* token system from
   StudentDashboard / TPODashboard for visual
   consistency, plus a few coordinator-specific
   classes.
───────────────────────────────────────────── */
const COORD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sd-dark {
    --bg: #0d1117; --bg-sidebar: #0f1623; --bg-card: rgba(255,255,255,0.03);
    --bg-card-hov: rgba(255,255,255,0.05); --bg-input: rgba(255,255,255,0.04);
    --border: rgba(255,255,255,0.07); --border-hov: rgba(255,255,255,0.14);
    --text-head: #f1f5f9; --text-body: #e2e8f0; --text-sub: #94a3b8;
    --text-muted: #64748b; --accent: #6366f1; --accent-soft: rgba(99,102,241,0.12);
    --accent-text: #818cf8;
  }
  .sd-light {
    --bg: #f0f4ff; --bg-sidebar: #ffffff; --bg-card: #ffffff;
    --bg-card-hov: #fafbff; --bg-input: #f8faff;
    --border: rgba(99,102,241,0.1); --border-hov: rgba(99,102,241,0.28);
    --text-head: #1e1b4b; --text-body: #1e293b; --text-sub: #475569;
    --text-muted: #64748b; --accent: #6366f1; --accent-soft: rgba(99,102,241,0.08);
    --accent-text: #4f46e5;
  }

  .sd-root { display: flex; min-height: 100vh; background: var(--bg); font-family: 'Inter', sans-serif; color: var(--text-body); transition: background 0.4s ease, color 0.4s ease; }

  .sd-sidebar { width: 240px; flex-shrink: 0; background: var(--bg-sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 24px 16px; position: sticky; top: 0; height: 100vh; }
  .sd-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; padding: 0 8px; }
  .sd-logo-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; color: #fff; box-shadow: 0 4px 15px rgba(99,102,241,.35); }
  .sd-logo-text { font-size: 15px; font-weight: 700; color: var(--text-head); }
  .sd-logo-sub { font-size: 11px; color: var(--text-muted); }

  .sd-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .sd-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; border: none; background: none; color: var(--text-sub); font-size: 14px; font-weight: 500; cursor: pointer; text-align: left; transition: all 0.2s ease; }
  .sd-nav-item:hover { background: var(--bg-card-hov); color: var(--text-head); }
  .sd-nav-active { background: var(--accent-soft); color: var(--accent-text); font-weight: 600; }

  .sd-sidebar-footer { display: flex; flex-direction: column; gap: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .sd-theme-toggle { display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 4px; }
  .sd-toggle-track { width: 44px; height: 22px; border-radius: 99px; position: relative; padding: 2px; }
  .sd-toggle-thumb { width: 18px; height: 18px; border-radius: 50%; background: #0d1117; display: flex; align-items: center; justify-content: center; position: absolute; top: 2px; }
  .sd-toggle-label { font-size: 12px; color: var(--text-sub); font-weight: 600; }
  .sd-logout-btn { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-radius: 10px; border: 1px solid var(--border); background: none; color: var(--text-sub); font-size: 13px; font-weight: 600; cursor: pointer; }
  .sd-logout-btn:hover { color: #f87171; border-color: rgba(248,113,113,0.3); }

  .sd-main { flex: 1; padding: 28px 36px; max-width: 100%; overflow-x: hidden; }
  .sd-topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
  .sd-topbar-title { font-size: 24px; font-weight: 800; color: var(--text-head); }
  .sd-topbar-sub { font-size: 14px; color: var(--text-sub); margin-top: 4px; }

  .sd-primary-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px; border: none; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(99,102,241,.35); }
  .sd-primary-btn:hover { filter: brightness(1.08); }

  .sd-loading { display: flex; align-items: center; gap: 10px; color: var(--text-sub); padding: 60px 0; justify-content: center; font-size: 14px; }
  .sd-spin { animation: sd-spin 1s linear infinite; }
  @keyframes sd-spin { to { transform: rotate(360deg); } }

  .sd-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; }
  .sd-stat-card { position: relative; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 18px; display: flex; align-items: center; gap: 14px; overflow: hidden; }
  .sd-stat-icon-wrap { width: 44px; height: 44px; border-radius: 12px; background: var(--grad); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
  .sd-stat-value { font-size: 22px; font-weight: 800; color: var(--text-head); display: block; }
  .sd-stat-label { font-size: 12px; color: var(--text-sub); }
  .sd-stat-glow { position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: var(--grad); filter: blur(30px); opacity: 0.25; }

  .sd-section { margin-bottom: 32px; }
  .sd-section-title { font-size: 17px; font-weight: 700; color: var(--text-head); margin-bottom: 14px; }
  .sd-chart-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
  .sd-chart-card-flex { display: flex; justify-content: center; }

  .sd-empty { padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-card); border: 1px dashed var(--border); border-radius: 16px; }

  .sd-event-list { display: flex; flex-direction: column; gap: 10px; }
  .sd-event-row { display: flex; justify-content: space-between; align-items: flex-start; background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; gap: 12px; }
  .sd-event-row h3 { font-size: 15px; font-weight: 700; color: var(--text-head); margin-bottom: 6px; }
  .sd-event-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--text-sub); }
  .sd-event-meta span { display: flex; align-items: center; gap: 4px; }
  .sd-tag-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
  .sd-tag { display: flex; align-items: center; gap: 3px; font-size: 11px; padding: 3px 8px; border-radius: 99px; background: var(--accent-soft); color: var(--accent-text); font-weight: 600; }
  .sd-event-row-actions { display: flex; gap: 6px; flex-shrink: 0; }
  .sd-icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--text-sub); display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .sd-icon-btn:hover { border-color: var(--accent); color: var(--accent-text); }
  .sd-icon-btn-danger:hover { border-color: rgba(248,113,113,0.4); color: #f87171; }

  /* Modal styles (pe-* = "post event") */
  .pe-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 998; backdrop-filter: blur(2px); }
  .pe-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(640px, 92vw); max-height: 88vh; overflow-y: auto; background: var(--bg-sidebar, var(--bg-card)); border: 1px solid var(--border); border-radius: 18px; z-index: 999; padding: 24px; }
  .pe-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .pe-header-left { display: flex; align-items: center; gap: 12px; }
  .pe-avatar-big { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .pe-title { font-size: 17px; font-weight: 700; color: var(--text-head); }
  .pe-subtitle { font-size: 12px; color: var(--text-sub); margin-top: 2px; }
  .pe-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--text-sub); cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .pe-field { display: flex; flex-direction: column; gap: 6px; }
  .pe-label { font-size: 12px; font-weight: 600; color: var(--text-sub); }
  .pe-input { padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-input); color: var(--text-head); font-size: 13px; font-family: inherit; }
  .pe-input:focus { outline: none; border-color: var(--accent); }
  .pe-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
  .pe-btn-cancel { padding: 10px 18px; border-radius: 10px; border: 1px solid var(--border); background: none; color: var(--text-sub); font-weight: 600; cursor: pointer; }
  .pe-btn-save { padding: 10px 18px; border-radius: 10px; border: none; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; font-weight: 700; cursor: pointer; }
  .pe-btn-save:disabled, .pe-btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
`;
