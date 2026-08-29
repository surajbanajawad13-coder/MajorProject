import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Briefcase,
  Calendar,
  Award,
  CheckCircle,
  Clock,
  Tag,
  LogOut,
  AlertCircle,
  LayoutDashboard,
  Bell,
  ChevronRight,
  Zap,
  Star,
  Activity,
  Mail,
  Hash,
  Shield,
  ExternalLink,
  Sun,
  Moon,
  Edit3,
  Upload,
  FileText,
  X,
  Plus,
  Trash2,
  Save,
  Download,
  User,
  Loader2,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000';

/* ─────────────────────────────────────────────
   Helper: get auth token
───────────────────────────────────────────── */
function getToken() {
  const profileString = localStorage.getItem('profile');
  const profileData = profileString ? JSON.parse(profileString) : null;
  return profileData?.token || null;
}

/* ─────────────────────────────────────────────
   Tiny animated counter hook
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
   Animated stat card
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

/* ─────────────────────────────────────────────
   Status badge
───────────────────────────────────────────── */
const statusConfig = {
  Applied:      { cls: 'sd-badge-blue',    dot: '#60a5fa' },
  Interviewing: { cls: 'sd-badge-amber',   dot: '#fbbf24' },
  Placed:       { cls: 'sd-badge-emerald', dot: '#34d399' },
  Rejected:     { cls: 'sd-badge-rose',    dot: '#f87171' },
};

/* ─────────────────────────────────────────────
   Theme Toggle
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   Tag input component (for skills / interests)
───────────────────────────────────────────── */
const TagInput = ({ label, values, onChange, color }) => {
  const [inputVal, setInputVal] = useState('');

  const add = () => {
    const trimmed = inputVal.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setInputVal('');
  };

  const remove = (idx) => onChange(values.filter((_, i) => i !== idx));

  return (
    <div className="pe-field">
      <label className="pe-label">{label}</label>
      <div className="pe-tag-input-row">
        <input
          className="pe-input"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={`Add ${label.toLowerCase()} and press Enter`}
        />
        <button type="button" className="pe-add-btn" onClick={add}><Plus size={15} /></button>
      </div>
      <div className="pe-tags-wrap">
        {values.map((v, i) => (
          <span key={i} className={`pe-tag ${color}`}>
            {v}
            <button type="button" onClick={() => remove(i)} className="pe-tag-del"><X size={10} /></button>
          </span>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Profile Edit Modal
───────────────────────────────────────────── */
const ProfileModal = ({ profile, onClose, onSaved, isDark }) => {
  const [tab, setTab] = useState('info');          // 'info' | 'skills' | 'resume'
  const [username, setUsername] = useState(profile.username || '');
  const [email, setEmail]       = useState(profile.email    || '');
  const [skills, setSkills]     = useState(profile.skills   || []);
  const [interests, setInterests] = useState(profile.interests || []);
  const [cgpa, setCgpa]         = useState(profile.cgpa     || ''); // ADDED
  const [department, setDepartment] = useState(profile.department || 'CSE'); // ADDED
  const [resumeFile, setResumeFile] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);   // { type:'success'|'error', text }
  const fileRef = useRef();
  const theme = isDark ? 'sd-dark' : 'sd-light';

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const token = getToken();
      const fd = new FormData();
      fd.append('username',  username.trim());
      fd.append('email',     email.trim());
      fd.append('skills',    JSON.stringify(skills));
      fd.append('interests', JSON.stringify(interests));
      fd.append('cgpa',      cgpa); // ADDED
      fd.append('department', department); // ADDED
      if (resumeFile) fd.append('resume', resumeFile);

      const res = await axios.put(`${API}/api/student/profile`, fd, {
        headers: { Authorization: `Bearer ${token}` },
        // Let axios set content-type automatically for FormData
      });

      if (res.data?.success) {
        setMsg({ type: 'success', text: 'Profile updated successfully! ✓' });
        onSaved(res.data.data);
        setTimeout(onClose, 1500);
      } else {
        setMsg({ type: 'error', text: res.data?.error || 'Update failed.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  const hasResume = !!profile.resumeUrl;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className={`pe-backdrop ${theme}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      {/* Modal */}
      <motion.div
        className={`pe-modal ${theme}`}
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        <style>{MODAL_STYLES}</style>

        {/* Header */}
        <div className="pe-header">
          <div className="pe-header-left">
            <div className="pe-avatar-big">{(username || 'S').charAt(0).toUpperCase()}</div>
            <div>
              <h2 className="pe-title">Edit Profile</h2>
              <p className="pe-subtitle">{profile.usn || 'Student'}</p>
            </div>
          </div>
          <button className="pe-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="pe-tabs">
          {[
            { id: 'info',   label: 'Profile Info', icon: User     },
            { id: 'skills', label: 'Skills',        icon: Tag      },
            { id: 'resume', label: 'Resume',         icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} className={`pe-tab ${tab === id ? 'pe-tab-active' : ''}`} onClick={() => setTab(id)}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="pe-body">
          {/* ── Info tab ── */}
          {tab === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="pe-tab-content">
              <div className="pe-field">
                <label className="pe-label">Username</label>
                <input className="pe-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Your username" />
              </div>
              <div className="pe-field">
                <label className="pe-label">Email</label>
                <input className="pe-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" />
              </div>
              <div className="pe-field">
                <label className="pe-label">USN</label>
                <input className="pe-input pe-input-disabled" value={profile.usn || ''} disabled />
                <p className="pe-hint">USN cannot be changed.</p>
              </div>
              <div className="pe-field">
                <label className="pe-label">Role</label>
                <input className="pe-input pe-input-disabled" value={profile.role || 'Student'} disabled />
              </div>
              <div className="pe-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="pe-label">CGPA</label>
                  <input className="pe-input" type="number" step="0.1" value={cgpa} onChange={e => setCgpa(e.target.value)} placeholder="e.g. 8.5" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="pe-label">Branch</label>
                  <select className="pe-input" value={department} onChange={e => setDepartment(e.target.value)}>
                    <option value="CSE">CSE</option>
                    <option value="ISE">ISE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Skills tab ── */}
          {tab === 'skills' && (
            <motion.div key="skills" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="pe-tab-content">
              <TagInput label="Technical Skills"   values={skills}    onChange={setSkills}    color="pe-tag-purple" />
              <TagInput label="Domain Interests"   values={interests} onChange= {setInterests} color="pe-tag-blue"   />
            </motion.div>
          )}

          {/* ── Resume tab ── */}
          {tab === 'resume' && (
            <motion.div key="resume" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="pe-tab-content">
              {/* Current resume */}
              {hasResume && !resumeFile && (
                <div className="pe-resume-current">
                  <div className="pe-resume-icon"><FileText size={22} /></div>
                  <div className="pe-resume-info">
                    <p className="pe-resume-name">{profile.resumeOriginalName || 'resume.pdf'}</p>
                    <p className="pe-resume-hint">Currently uploaded resume</p>
                  </div>
                  <a
                    href={`${API}/${profile.resumeUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="pe-resume-download"
                    download
                  >
                    <Download size={14} /> View
                  </a>
                </div>
              )}

              {/* New file selected preview */}
              {resumeFile && (
                <div className="pe-resume-current pe-resume-new">
                  <div className="pe-resume-icon"><FileText size={22} /></div>
                  <div className="pe-resume-info">
                    <p className="pe-resume-name">{resumeFile.name}</p>
                    <p className="pe-resume-hint">{(resumeFile.size / 1024).toFixed(1)} KB — ready to upload</p>
                  </div>
                  <button className="pe-resume-remove" onClick={() => setResumeFile(null)}><Trash2 size={14} /></button>
                </div>
              )}

              {/* Upload zone */}
              <div
                className={`pe-upload-zone ${resumeFile ? 'pe-upload-filled' : ''}`}
                onClick={() => fileRef.current.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) setResumeFile(f);
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={e => { if (e.target.files[0]) setResumeFile(e.target.files[0]); }}
                />
                <Upload size={28} className="pe-upload-icon" />
                <p className="pe-upload-title">{resumeFile ? 'Replace resume' : hasResume ? 'Upload new resume' : 'Upload your resume'}</p>
                <p className="pe-upload-sub">Drag &amp; drop or click · PDF, DOC, DOCX · Max 5 MB</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Feedback message */}
        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`pe-msg ${msg.type === 'success' ? 'pe-msg-success' : 'pe-msg-error'}`}
            >
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="pe-footer">
          <button className="pe-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="pe-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={15} className="pe-spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─────────────────────────────────────────────
   Main Dashboard Component
───────────────────────────────────────────── */
const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [availableDrives, setAvailableDrives] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('sd-theme');
    return saved !== null ? saved === 'dark' : true;
  });
  const [showProfileModal, setShowProfileModal] = useState(false);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('sd-theme', next ? 'dark' : 'light');
      return next;
    });
  };

 const fetchDashboard = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) { setError('No authentication token found.'); setLoading(false); return; }
      
      // Fetch Student Profile Data
      const response = await axios.get(`${API}/api/student/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) setDashboardData(response.data.data);
      else setError(response.data?.message || 'Failed to parse response data.');

      // Fetch Available Company Drives
      const drivesRes = await axios.get(`${API}/api/placements`);
      if (drivesRes.data?.success) setAvailableDrives(drivesRes.data.data);

    } catch (err) {
      console.error('Dashboard Fetch Error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  // When profile is saved from modal, update in-place without full reload
  const handleProfileSaved = (updatedProfile) => {
    setDashboardData(prev => ({
      ...prev,
      profile: { ...prev.profile, ...updatedProfile },
    }));
  };

  const theme = isDark ? 'sd-dark' : 'sd-light';

  if (loading) return (
    <div className={`sd-loading-screen ${theme}`}>
      <style>{STYLES}</style>
      <motion.div className="sd-loader" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} />
      <p className="sd-loading-text">Loading your dashboard…</p>
    </div>
  );

  if (error || !dashboardData) return (
    <div className={`sd-error-screen ${theme}`}>
      <style>{STYLES}</style>
      <motion.div className="sd-error-card" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="sd-error-icon"><AlertCircle size={32} /></div>
        <h2 className="sd-error-title">Dashboard Unavailable</h2>
        <p className="sd-error-msg">{error || 'Unable to fetch profile data.'}</p>
        <div className="sd-error-actions">
          <button onClick={fetchDashboard} className="sd-btn-primary">Retry</button>
          <button onClick={logout}         className="sd-btn-ghost">Logout</button>
        </div>
      </motion.div>
    </div>
  );

  const {
    profile = {},
    stats = { eventsCount: 0, appliedCompaniesCount: 0, trainingsAttendedCount: 0 },
    registeredEvents = [],
    appliedCompanies = [],
    trainingAttendance = [],
  } = dashboardData;

  const initials = (profile?.username || user?.username || 'S').slice(0, 2).toUpperCase();
  const username = profile?.username || user?.username || 'Student';

  const navItems = [
    { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
    { id: 'companies', label: 'Companies', icon: Briefcase },
    { id: 'events',    label: 'Events',    icon: Calendar },
    { id: 'training',  label: 'Training',  icon: Award },
  ];

  return (
    <div className={`sd-root ${theme}`}>
      <style>{STYLES}</style>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="sd-modal-portal">
          <ProfileModal
            profile={profile}
            onClose={() => setShowProfileModal(false)}
            onSaved={handleProfileSaved}
            isDark={isDark}
          />
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="sd-sidebar">
        <div className="sd-logo">
          <div className="sd-logo-icon">C</div>
          <span className="sd-logo-text">CampusConnect</span>
        </div>

        {/* Clickable Avatar */}
        <motion.div
          className="sd-avatar-wrap sd-avatar-clickable"
          onClick={() => setShowProfileModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title="Edit Profile"
        >
          <div className="sd-avatar">{initials}</div>
          <div className="sd-avatar-info">
            <p className="sd-avatar-name">{username}</p>
            <p className="sd-avatar-role">{profile?.role || 'Student'}</p>
          </div>
          <div className="sd-avatar-edit-hint">
            <Edit3 size={12} />
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

        {/* Resume quick-link */}
        {profile.resumeUrl && (
          <a
            href={`${API}/${profile.resumeUrl}`}
            target="_blank"
            rel="noreferrer"
            className="sd-resume-link"
            download
          >
            <FileText size={14} />
            <span>My Resume</span>
            <Download size={12} style={{ marginLeft: 'auto' }} />
          </a>
        )}

        <button onClick={logout} className="sd-logout-btn">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </aside>

      {/* ── Main ── */}
      <main className="sd-main">
        <header className="sd-topbar">
          <div>
            <p className="sd-topbar-greeting">Good day 👋</p>
            <h1 className="sd-topbar-title">{username}</h1>
          </div>
          <div className="sd-topbar-actions">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            {/* Mobile edit profile button */}
            <button className="sd-topbar-bell" onClick={() => setShowProfileModal(true)} title="Edit Profile">
              <Edit3 size={16} />
            </button>
            <button className="sd-topbar-bell">
              <Bell size={18} />
              <span className="sd-bell-dot" />
            </button>
          </div>
        </header>

        <div className="sd-content">
          <AnimatePresence mode="wait">

            {/* ════════ OVERVIEW ════════ */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                <div className="sd-hero">
                  <div className="sd-hero-glow sd-hero-glow-1" />
                  <div className="sd-hero-glow sd-hero-glow-2" />
                  <div className="sd-hero-content">
                    <span className="sd-hero-chip"><Zap size={12} /> Active Student</span>
                    <h2 className="sd-hero-heading">Welcome back, <br /><em>{username}!</em></h2>
                    <p className="sd-hero-sub">Track your academic journey, explore opportunities, and stay connected with everything happening on campus.</p>
                    <div className="sd-hero-meta">
                      <div className="sd-meta-pill"><Hash size={13} />{profile?.usn || 'N/A'}</div>
                      <div className="sd-meta-pill"><Mail size={13} />{profile?.email || user?.email || 'N/A'}</div>
                      <div className="sd-meta-pill"><Shield size={13} />{profile?.role || 'Student'}</div>
                    </div>
                  </div>
                  <div className="sd-hero-illustration">
                    <img src="/images/student_dashboard.png" alt="Student" className="sd-hero-img" />
                    <div className="sd-hero-img-glow" />
                  </div>
                </div>

                <div className="sd-stats-row">
                  <StatCard icon={Calendar}  label="Events Joined"      value={stats.eventsCount || 0}            gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" delay={0.05} />
                  <StatCard icon={Briefcase} label="Companies Applied"  value={stats.appliedCompaniesCount || 0}   gradient="linear-gradient(135deg,#0ea5e9,#06b6d4)"  delay={0.1}  />
                  <StatCard icon={Activity}  label="Trainings Attended" value={stats.trainingsAttendedCount || 0}  gradient="linear-gradient(135deg,#10b981,#059669)"  delay={0.15} />
                </div>

                <div className="sd-two-col">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="sd-card">
                    <div className="sd-card-header">
                      <div className="sd-card-icon" style={{ '--icon-color': '#6366f1' }}><Tag size={16} /></div>
                      <div>
                        <h3 className="sd-card-title">Technical Skills</h3>
                        <p className="sd-card-sub">Core competencies &amp; technologies</p>
                      </div>
                      {profile.skills?.length > 0 && <span className="sd-count-badge">{profile.skills.length}</span>}
                    </div>
                    <div className="sd-tags-wrap">
                      {profile.skills?.length > 0
                        ? profile.skills.map((s, i) => <motion.span key={i} whileHover={{ scale: 1.05 }} className="sd-tag sd-tag-purple">{s}</motion.span>)
                        : <EmptyState text="No skills added yet. Click your avatar to edit." />}
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="sd-card">
                    <div className="sd-card-header">
                      <div className="sd-card-icon" style={{ '--icon-color': '#0ea5e9' }}><BookOpen size={16} /></div>
                      <div>
                        <h3 className="sd-card-title">Domain Interests</h3>
                        <p className="sd-card-sub">Preferred industries &amp; fields</p>
                      </div>
                      {profile.interests?.length > 0 && <span className="sd-count-badge sd-count-blue">{profile.interests.length}</span>}
                    </div>
                    <div className="sd-tags-wrap">
                      {profile.interests?.length > 0
                        ? profile.interests.map((s, i) => <motion.span key={i} whileHover={{ scale: 1.05 }} className="sd-tag sd-tag-blue">{s}</motion.span>)
                        : <EmptyState text="No interests added yet. Click your avatar to edit." />}
                    </div>
                  </motion.div>
                </div>

                <div className="sd-two-col">
                  <div className="sd-card">
                    <div className="sd-card-header">
                      <div className="sd-card-icon" style={{ '--icon-color': '#f59e0b' }}><Briefcase size={16} /></div>
                      <div>
                        <h3 className="sd-card-title">Recent Applications</h3>
                        <p className="sd-card-sub">Latest placement activity</p>
                      </div>
                      <button onClick={() => setActiveTab('companies')} className="sd-view-all">View all <ChevronRight size={13} /></button>
                    </div>
                    {appliedCompanies.slice(0, 3).length > 0
                      ? appliedCompanies.slice(0, 3).map((item, i) => <CompanyRow key={i} item={item} />)
                      : <EmptyState text="No applications yet." />}
                  </div>

                  <div className="sd-card">
                    <div className="sd-card-header">
                      <div className="sd-card-icon" style={{ '--icon-color': '#10b981' }}><Calendar size={16} /></div>
                      <div>
                        <h3 className="sd-card-title">Upcoming Events</h3>
                        <p className="sd-card-sub">Your registered events</p>
                      </div>
                      <button onClick={() => setActiveTab('events')} className="sd-view-all">View all <ChevronRight size={13} /></button>
                    </div>
                    {registeredEvents.slice(0, 3).length > 0
                      ? registeredEvents.slice(0, 3).map((ev, i) => <EventRow key={i} ev={ev} />)
                      : <EmptyState text="No events registered." />}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════════ COMPANIES ════════ */}
            {activeTab === 'companies' && (
              <motion.div key="companies" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                
                {/* Available Drives Section */}
                <SectionHeader icon={Zap} title="New Opportunities" sub={`${availableDrives.length} active placement drives`} color="#6366f1" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                  {availableDrives.map((comp, idx) => (
                    <motion.div key={comp._id || idx} className="sd-card" whileHover={{ translateY: -4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="pe-avatar-big" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', width: '42px', height: '42px', borderRadius: '12px', fontSize: '16px' ,textAlign: 'center', lineHeight: '42px', color: '#fff'}}>
                          {(comp.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-head)' }}>{comp.name}</h3>
                          <p style={{ fontSize: '12px', color: 'var(--accent)' }}>{comp.jobRole}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', marginTop: '4px' }}>
                        <p style={{ color: 'var(--text-sub)' }}><strong>Package:</strong> {comp.ctc}</p>
                        <p style={{ color: 'var(--text-sub)' }}><strong>Eligibility:</strong> {comp.eligibilityCriteria?.cgpa || 0} CGPA</p>
                        <p style={{ color: 'var(--text-sub)' }}><strong>Deadline:</strong> {new Date(comp.visitDate).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        {comp.jobDescription?.url && (
                          <a href={`${API}/${comp.jobDescription.url}`} target="_blank" rel="noreferrer" className="sd-btn-ghost" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '8px' }}>
                            View JD
                          </a>
                        )}
                        <button className="sd-btn-primary" style={{ flex: 1, padding: '8px' }}>
                          Apply Now
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Applied Companies Section */}
                <SectionHeader icon={Briefcase} title="My Applications" sub={`${appliedCompanies.length} tracked applications`} color="#f59e0b" />
                {appliedCompanies.length > 0 ? (
                  <div className="sd-list">
                    {appliedCompanies.map((item, i) => (
                      <motion.div key={item._id || i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="sd-list-item">
                        <div className="sd-list-avatar" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>{(item.companyId?.name || 'C').charAt(0)}</div>
                        <div className="sd-list-body">
                          <h4 className="sd-list-title">{item.companyId?.name || 'Company Drive'}</h4>
                          <p className="sd-list-sub">Role: <strong>{item.companyId?.jobRole || 'N/A'}</strong></p>
                        </div>
                        <StatusBadge status={item.status} />
                      </motion.div>
                    ))}
                  </div>
                ) : <EmptyCard text="You haven't applied to any companies yet." icon={Briefcase} />}
              </motion.div>
            )}
            {/* ════════ EVENTS ════════ */}
            {activeTab === 'events' && (
              <motion.div key="events" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                <SectionHeader icon={Calendar} title="My Registered Events" sub={`${registeredEvents.length} event${registeredEvents.length !== 1 ? 's' : ''}`} color="#10b981" />
                {registeredEvents.length > 0 ? (
                  <div className="sd-events-grid">
                    {registeredEvents.map((ev, i) => (
                      <motion.div key={ev._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="sd-event-card">
                        <div className="sd-event-top">
                          <span className="sd-event-chip">{ev.category || 'Technical'}</span>
                          <span className="sd-event-date">📅 {new Date(ev.date).toLocaleDateString()}</span>
                        </div>
                        <h3 className="sd-event-title">{ev.title}</h3>
                        <p className="sd-event-desc">{ev.description}</p>
                        <div className="sd-event-footer">
                          <span className="sd-event-org"><Star size={11} /> {ev.organizer}</span>
                          <button className="sd-event-btn"><ExternalLink size={12} /> Details</button>
                        </div>
                        <div className="sd-event-glow" />
                      </motion.div>
                    ))}
                  </div>
                ) : <EmptyCard text="You have not registered for any events yet." icon={Calendar} />}
              </motion.div>
            )}

            {/* ════════ TRAINING ════════ */}
            {activeTab === 'training' && (
              <motion.div key="training" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                <SectionHeader icon={Award} title="Training Log" sub={`${trainingAttendance.length} session${trainingAttendance.length !== 1 ? 's' : ''}`} color="#6366f1" />
                {trainingAttendance.length > 0 ? (
                  <div className="sd-list">
                    {trainingAttendance.map((session, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="sd-list-item">
                        <div className={`sd-training-icon ${session.attended ? 'sd-training-done' : 'sd-training-pending'}`}>
                          {session.attended ? <CheckCircle size={18} /> : <Clock size={18} />}
                        </div>
                        <div className="sd-list-body">
                          <h4 className="sd-list-title">{session.trainingType}</h4>
                          <p className="sd-list-sub">{new Date(session.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`sd-training-badge ${session.attended ? 'sd-training-badge-done' : 'sd-training-badge-pending'}`}>
                          {session.attended ? 'Attended' : 'Scheduled'}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : <EmptyCard text="No training sessions recorded." icon={Award} />}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

/* ─── Shared sub-components ─── */
const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || { cls: 'sd-badge-default', dot: '#94a3b8' };
  return (
    <span className={`sd-status-badge ${cfg.cls}`}>
      <span className="sd-badge-dot" style={{ background: cfg.dot }} />
      {status || 'Unknown'}
    </span>
  );
};
const EmptyState = ({ text }) => <div className="sd-empty-inline"><p>{text}</p></div>;
const EmptyCard  = ({ text, icon: Icon }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="sd-empty-card">
    <div className="sd-empty-icon"><Icon size={28} /></div>
    <p>{text}</p>
  </motion.div>
);
const SectionHeader = ({ icon: Icon, title, sub, color }) => (
  <div className="sd-section-header">
    <div className="sd-section-icon" style={{ '--ic': color }}><Icon size={20} /></div>
    <div>
      <h2 className="sd-section-title">{title}</h2>
      <p className="sd-section-sub">{sub}</p>
    </div>
  </div>
);
const CompanyRow = ({ item }) => (
  <div className="sd-mini-row">
    <div className="sd-mini-dot" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>{(item.companyId?.name || 'C').charAt(0)}</div>
    <div className="sd-mini-body">
      <p className="sd-mini-title">{item.companyId?.name || 'Company Drive'}</p>
      <p className="sd-mini-sub">{item.companyId?.jobRole || 'N/A'}</p>
    </div>
    <StatusBadge status={item.status} />
  </div>
);
const EventRow = ({ ev }) => (
  <div className="sd-mini-row">
    <div className="sd-mini-dot" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>{(ev.title || 'E').charAt(0)}</div>
    <div className="sd-mini-body">
      <p className="sd-mini-title">{ev.title}</p>
      <p className="sd-mini-sub">📅 {new Date(ev.date).toLocaleDateString()}</p>
    </div>
    <span className="sd-mini-chip">{ev.category || 'Event'}</span>
  </div>
);

/* ─────────────────────────────────────────────
   Modal-specific styles (injected inside the modal)
───────────────────────────────────────────── */
const MODAL_STYLES = `
  .pe-backdrop {
    position: fixed; inset: 0; z-index: 998;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(4px);
  }
  .sd-modal-portal {
  position: fixed; inset: 0; z-index: 997; pointer-events: none;
  display: flex; align-items: center; justify-content: center; padding: 16px;
}

 .pe-modal {
  position: relative; z-index: 999;
  width: 92%; max-width: 500px;
  border-radius: 24px;
  display: flex; flex-direction: column;
  max-height: 90vh; overflow: hidden;
  font-family: 'Inter', sans-serif;
}
  .sd-dark .pe-modal  { background: #131929; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 32px 80px rgba(0,0,0,0.6); }
  .sd-light .pe-modal { background: #ffffff;  border: 1px solid rgba(99,102,241,0.15); box-shadow: 0 32px 80px rgba(99,102,241,0.12); }

  .pe-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 24px 16px;
    border-bottom: 1px solid var(--border);
  }
  .pe-header-left { display: flex; align-items: center; gap: 14px; }
  .pe-avatar-big {
    width: 48px; height: 48px; border-radius: 14px;
    background: linear-gradient(135deg,#6366f1,#8b5cf6);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 800; color: #fff;
    box-shadow: 0 4px 14px rgba(99,102,241,0.35);
  }
  .pe-title    { font-size: 16px; font-weight: 700; color: var(--text-head); }
  .pe-subtitle { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
  .pe-close {
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--bg-card);
    display: flex; align-items: center; justify-content: center;
    color: var(--text-muted); cursor: pointer; transition: all 0.2s;
    flex-shrink: 0;
  }
  .pe-close:hover { border-color: var(--border-hov); color: var(--text-head); }

  /* Tabs */
  .pe-tabs {
    display: flex; gap: 4px;
    padding: 12px 24px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .pe-tab {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 10px;
    border: none; background: transparent;
    color: var(--text-muted); font-size: 12.5px; font-weight: 500;
    cursor: pointer; transition: all 0.2s;
  }
  .pe-tab:hover { background: var(--accent-soft); color: var(--accent-text); }
  .pe-tab-active { background: var(--accent-soft) !important; color: var(--accent-text) !important; font-weight: 600; }

  /* Body */
  .pe-body { flex: 1; overflow-y: auto; padding: 20px 24px; }
  .pe-tab-content { display: flex; flex-direction: column; gap: 16px; }

  /* Form fields */
  .pe-field { display: flex; flex-direction: column; gap: 6px; }
  .pe-label { font-size: 12px; font-weight: 600; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.05em; }
  .pe-input {
    padding: 10px 13px; border-radius: 11px;
    border: 1px solid var(--border);
    background: var(--bg-input);
    color: var(--text-head); font-size: 13.5px;
    outline: none; transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }
  .pe-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .pe-input-disabled { opacity: 0.5; cursor: not-allowed; }
  .pe-hint { font-size: 11px; color: var(--text-dim); }

  /* Tag input row */
  .pe-tag-input-row { display: flex; gap: 8px; }
  .pe-tag-input-row .pe-input { flex: 1; }
  .pe-add-btn {
    width: 40px; height: 40px; border-radius: 11px;
    border: 1px solid var(--border);
    background: var(--accent-soft);
    color: var(--accent-text); cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .pe-add-btn:hover { background: rgba(99,102,241,0.18); }

  /* Tags */
  .pe-tags-wrap { display: flex; flex-wrap: wrap; gap: 7px; min-height: 30px; }
  .pe-tag {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 10px 5px 12px; border-radius: 8px;
    font-size: 12px; font-weight: 600;
  }
  .pe-tag-purple { background: rgba(99,102,241,0.1); color: var(--accent-text); border: 1px solid rgba(99,102,241,0.2); }
  .pe-tag-blue   { background: rgba(14,165,233,0.1);  color: #0ea5e9;           border: 1px solid rgba(14,165,233,0.2); }
  .pe-tag-del {
    width: 16px; height: 16px; border-radius: 50%;
    border: none; background: rgba(0,0,0,0.12);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.15s; color: inherit; padding: 0;
  }
  .pe-tag-del:hover { background: rgba(0,0,0,0.25); }

  /* Resume upload */
  .pe-resume-current {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px; border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--bg-card);
  }
  .pe-resume-new { border-color: rgba(99,102,241,0.3); background: var(--accent-soft); }
  .pe-resume-icon { color: var(--accent-text); flex-shrink: 0; }
  .pe-resume-info { flex: 1; min-width: 0; }
  .pe-resume-name { font-size: 13px; font-weight: 600; color: var(--text-head); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pe-resume-hint { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  .pe-resume-download {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: 8px;
    background: var(--accent-soft); color: var(--accent-text);
    font-size: 12px; font-weight: 600; text-decoration: none;
    border: 1px solid rgba(99,102,241,0.2); transition: all 0.2s; flex-shrink: 0;
  }
  .pe-resume-download:hover { background: rgba(99,102,241,0.18); }
  .pe-resume-remove {
    width: 30px; height: 30px; border-radius: 8px;
    border: none; background: rgba(248,113,113,0.1);
    color: #f87171; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .pe-resume-remove:hover { background: rgba(248,113,113,0.2); }

  .pe-upload-zone {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 32px 20px; border-radius: 14px;
    border: 2px dashed var(--border-hov);
    cursor: pointer; transition: all 0.25s;
    text-align: center;
  }
  .pe-upload-zone:hover, .pe-upload-filled { border-color: var(--accent); background: var(--accent-soft); }
  .pe-upload-icon { color: var(--text-dim); transition: color 0.2s; }
  .pe-upload-zone:hover .pe-upload-icon { color: var(--accent-text); }
  .pe-upload-title { font-size: 14px; font-weight: 600; color: var(--text-head); }
  .pe-upload-sub   { font-size: 12px; color: var(--text-muted); }

  /* Feedback */
  .pe-msg { margin: 0 24px; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 500; }
  .pe-msg-success { background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.25); }
  .pe-msg-error   { background: rgba(248,113,113,0.1); color: #dc2626; border: 1px solid rgba(248,113,113,0.25); }
  .sd-dark .pe-msg-success { color: #34d399; }
  .sd-dark .pe-msg-error   { color: #fca5a5; }

  /* Footer */
  .pe-footer {
    display: flex; gap: 10px; justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
  .pe-btn-cancel {
    padding: 9px 18px; border-radius: 10px;
    border: 1px solid var(--border);
    background: transparent; color: var(--text-muted);
    font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  }
  .pe-btn-cancel:hover { background: var(--accent-soft); color: var(--text-head); }
  .pe-btn-save {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 20px; border-radius: 10px;
    background: linear-gradient(135deg,#6366f1,#8b5cf6);
    color: #fff; font-size: 13px; font-weight: 600;
    border: none; cursor: pointer; transition: opacity 0.2s;
  }
  .pe-btn-save:hover   { opacity: 0.88; }
  .pe-btn-save:disabled { opacity: 0.55; cursor: not-allowed; }
  @keyframes pe-spin { to { transform: rotate(360deg); } }
  .pe-spin { animation: pe-spin 0.8s linear infinite; }

  @media (max-width: 500px) {
    .pe-modal  { width: 96%; border-radius: 18px; }
    .pe-tabs   { gap: 2px; }
    .pe-tab    { padding: 6px 10px; font-size: 11.5px; }
  }
`;

/* ─────────────────────────────────────────────
   Dashboard styles (theme variables)
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
  .sd-modal-portal { position: fixed; inset: 0; z-index: 997; pointer-events: none; }
  .sd-modal-portal > * { pointer-events: all; }

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
  .sd-avatar-clickable {
    cursor: pointer; position: relative;
  }
  .sd-avatar-clickable:hover { border-color: var(--accent) !important; background: var(--accent-soft) !important; }
  .sd-avatar-edit-hint {
    margin-left: auto; flex-shrink: 0;
    color: var(--text-dim); opacity: 0;
    transition: opacity 0.2s;
  }
  .sd-avatar-clickable:hover .sd-avatar-edit-hint { opacity: 1; color: var(--accent-text); }

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

  .sd-resume-link {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 12px; border-radius: 11px; margin-bottom: 8px;
    border: 1px solid rgba(16,185,129,0.2);
    background: rgba(16,185,129,0.07);
    color: #10b981; font-size: 13px; font-weight: 500;
    text-decoration: none; transition: all 0.2s;
  }
  .sd-resume-link:hover { background: rgba(16,185,129,0.14); border-color: rgba(16,185,129,0.4); }

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
  .sd-hero-meta { display: flex; flex-wrap: wrap; gap: 8px; }
  .sd-meta-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px; border-radius: 10px;
    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2);
    font-size: 12px; color: var(--text-sub); font-weight: 500; backdrop-filter: blur(4px);
  }
  .sd-light .sd-meta-pill { background: rgba(99,102,241,0.07); border-color: rgba(99,102,241,0.15); }
  .sd-hero-illustration { position: relative; z-index: 2; display: flex; align-items: flex-end; justify-content: center; }
  .sd-hero-img { width: 200px; object-fit: contain; }
  .sd-hero-img-glow {
    position: absolute; width: 200px; height: 200px; border-radius: 50%;
    background: rgba(99,102,241,0.18); filter: blur(50px);
    bottom: -40px; left: 50%; transform: translateX(-50%);
  }

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
  .sd-count-badge { margin-left: auto; padding: 3px 9px; border-radius: 99px; background: var(--accent-soft); font-size: 11px; font-weight: 600; color: var(--text-muted); }
  .sd-count-blue  { background: rgba(14,165,233,0.08); color: #0ea5e9; }
  .sd-view-all {
    margin-left: auto; display: flex; align-items: center; gap: 3px;
    font-size: 11px; font-weight: 600; color: var(--accent);
    background: none; border: none; cursor: pointer; transition: gap 0.2s;
  }
  .sd-view-all:hover { gap: 6px; }

  .sd-tags-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
  .sd-tag { padding: 6px 13px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: default; transition: all 0.2s; }
  .sd-tag-purple { background: rgba(99,102,241,0.08); color: var(--accent-text); border: 1px solid rgba(99,102,241,0.18); }
  .sd-tag-purple:hover { background: rgba(99,102,241,0.15); }
  .sd-tag-blue   { background: rgba(14,165,233,0.08); color: #0ea5e9; border: 1px solid rgba(14,165,233,0.2); }
  .sd-tag-blue:hover { background: rgba(14,165,233,0.15); }

  .sd-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  /* List */
  .sd-list { display: flex; flex-direction: column; gap: 10px; }
  .sd-list-item {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px; border-radius: 14px;
    background: var(--bg-card); border: 1px solid var(--border); transition: all 0.2s;
  }
  .sd-list-item:hover { border-color: var(--border-hov); background: var(--bg-card-hov); }
  .sd-list-avatar {
    width: 38px; height: 38px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .sd-list-body { flex: 1; min-width: 0; }
  .sd-list-title { font-size: 13.5px; font-weight: 600; color: var(--text-head); }
  .sd-list-sub   { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

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
  .sd-mini-chip  { padding: 3px 8px; border-radius: 8px; background: var(--accent-soft); font-size: 10px; font-weight: 600; color: var(--text-muted); white-space: nowrap; }

  /* Status badges */
  .sd-status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 99px;
    font-size: 11.5px; font-weight: 600; white-space: nowrap;
  }
  .sd-badge-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .sd-badge-blue    { background: rgba(96,165,250,0.1);   color: #3b82f6; border: 1px solid rgba(96,165,250,0.25); }
  .sd-badge-amber   { background: rgba(251,191,36,0.1);   color: #d97706; border: 1px solid rgba(251,191,36,0.25); }
  .sd-badge-emerald { background: rgba(52,211,153,0.1);   color: #059669; border: 1px solid rgba(52,211,153,0.25); }
  .sd-badge-rose    { background: rgba(248,113,113,0.1);  color: #dc2626; border: 1px solid rgba(248,113,113,0.25); }
  .sd-badge-default { background: rgba(148,163,184,0.08); color: #64748b; border: 1px solid rgba(148,163,184,0.2); }
  .sd-dark .sd-badge-blue    { color: #93c5fd; }
  .sd-dark .sd-badge-amber   { color: #fcd34d; }
  .sd-dark .sd-badge-emerald { color: #6ee7b7; }
  .sd-dark .sd-badge-rose    { color: #fca5a5; }

  /* Training */
  .sd-training-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .sd-training-done    { background: rgba(52,211,153,0.1); color: #10b981; }
  .sd-training-pending { background: rgba(251,191,36,0.1); color: #f59e0b; }
  .sd-training-badge { padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
  .sd-training-badge-done    { background: rgba(52,211,153,0.1); color: #059669; border: 1px solid rgba(52,211,153,0.2); }
  .sd-training-badge-pending { background: rgba(251,191,36,0.1); color: #d97706; border: 1px solid rgba(251,191,36,0.2); }
  .sd-dark .sd-training-badge-done    { color: #6ee7b7; }
  .sd-dark .sd-training-badge-pending { color: #fcd34d; }

  /* Events grid */
  .sd-events-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); gap: 16px; }
  .sd-event-card {
    position: relative; overflow: hidden;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 18px; padding: 20px;
    display: flex; flex-direction: column; gap: 10px;
    transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .sd-event-card:hover { border-color: rgba(16,185,129,0.3); transform: translateY(-3px); box-shadow: 0 16px 40px rgba(16,185,129,0.06); }
  .sd-event-top   { display: flex; justify-content: space-between; align-items: center; }
  .sd-event-chip  { padding: 4px 10px; border-radius: 8px; background: rgba(16,185,129,0.08); color: #059669; border: 1px solid rgba(16,185,129,0.2); font-size: 10.5px; font-weight: 600; }
  .sd-dark .sd-event-chip { color: #34d399; }
  .sd-event-date  { font-size: 11px; color: var(--text-muted); }
  .sd-event-title { font-size: 15px; font-weight: 700; color: var(--text-head); }
  .sd-event-desc  { font-size: 12px; color: var(--text-sub); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .sd-event-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--border); margin-top: auto; }
  .sd-event-org   { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); }
  .sd-event-btn   { display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px; background: rgba(16,185,129,0.07); color: #059669; border: 1px solid rgba(16,185,129,0.18); font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .sd-dark .sd-event-btn { color: #34d399; }
  .sd-event-btn:hover { background: rgba(16,185,129,0.14); }
  .sd-event-glow { position: absolute; right: -40px; bottom: -40px; width: 120px; height: 120px; border-radius: 50%; background: rgba(16,185,129,0.05); filter: blur(40px); pointer-events: none; }

  /* Section header */
  .sd-section-header { display: flex; align-items: center; gap: 14px; }
  .sd-section-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center; color: var(--ic); flex-shrink: 0; }
  .sd-section-title { font-size: 18px; font-weight: 700; color: var(--text-head); }
  .sd-section-sub   { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

  /* Empty states */
  .sd-empty-inline { width: 100%; padding: 20px 16px; border: 1px dashed var(--border-hov); border-radius: 12px; text-align: center; }
  .sd-empty-inline p { font-size: 12.5px; color: var(--text-dim); }
  .sd-empty-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 60px 40px; border: 1px dashed var(--border-hov); border-radius: 20px; text-align: center; }
  .sd-empty-icon { color: var(--text-dim); }
  .sd-empty-card p { font-size: 14px; color: var(--text-dim); }

  /* Loading / Error */
  .sd-loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: var(--bg); gap: 16px; font-family: 'Inter', sans-serif; transition: background 0.4s; }
  .sd-loader { width: 44px; height: 44px; border-radius: 50%; border: 3px solid rgba(99,102,241,0.15); border-top-color: #6366f1; }
  .sd-loading-text { font-size: 13px; color: var(--text-muted); }
  .sd-error-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--bg); padding: 24px; font-family: 'Inter', sans-serif; transition: background 0.4s; }
  .sd-error-card { background: var(--bg-card); border: 1px solid rgba(248,113,113,0.2); border-radius: 24px; padding: 40px; max-width: 420px; width: 100%; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .sd-error-icon { width: 60px; height: 60px; border-radius: 50%; background: rgba(248,113,113,0.1); color: #f87171; display: flex; align-items: center; justify-content: center; }
  .sd-error-title { font-size: 20px; font-weight: 700; color: var(--text-head); }
  .sd-error-msg   { font-size: 13px; color: var(--text-muted); }
  .sd-error-actions { display: flex; gap: 10px; }
  .sd-btn-primary { padding: 9px 20px; border-radius: 10px; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: opacity 0.2s; }
  .sd-btn-primary:hover { opacity: 0.85; }
  .sd-btn-ghost { padding: 9px 20px; border-radius: 10px; background: var(--accent-soft); border: 1px solid var(--border-hov); color: var(--text-muted); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .sd-btn-ghost:hover { background: var(--border-hov); }

  /* Responsive */
  @media (max-width: 900px) {
    .sd-sidebar { display: none; }
    .sd-two-col { grid-template-columns: 1fr; }
    .sd-stats-row { grid-template-columns: repeat(2,1fr); }
    .sd-hero { flex-direction: column; align-items: flex-start; }
    .sd-hero-content { max-width: 100%; }
    .sd-hero-illustration { display: none; }
    .sd-hero-heading { font-size: 26px; }
    .sd-content { padding: 20px 16px; }
    .sd-topbar { padding: 14px 20px; }
  }
  @media (max-width: 560px) {
    .sd-stats-row { grid-template-columns: 1fr; }
    .sd-hero { padding: 28px 24px; }
    .sd-toggle-label { display: none; }
  }
`;

export default StudentDashboard;