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
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api';


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
  Applied: { cls: 'sd-badge-blue', dot: '#60a5fa' },
  Interviewing: { cls: 'sd-badge-amber', dot: '#fbbf24' },
  Placed: { cls: 'sd-badge-emerald', dot: '#34d399' },
  Rejected: { cls: 'sd-badge-rose', dot: '#f87171' },
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
            : <motion.span key="sun" initial={{ rotate: 30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -30, opacity: 0 }} transition={{ duration: 0.2 }}><Sun size={12} color="#f59e0b" /></motion.span>
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
  const [tab, setTab] = useState('info');
  const [username, setUsername] = useState(profile.username || '');
  const [email, setEmail] = useState(profile.email || '');
  const [skills, setSkills] = useState(profile.skills || []);
  const [interests, setInterests] = useState(profile.interests || []);
  const [cgpa, setCgpa] = useState(profile.cgpa || '');
  const [department, setDepartment] = useState(profile.department || 'CSE');
  const [year, setYear] = useState(profile.year || '');
  const [certifications, setCertifications] = useState(profile.certifications || []);
  const [projects, setProjects] = useState((profile.projects || []).map(project => project.title || project));
  const [resumeFile, setResumeFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef();
  const theme = isDark ? 'sd-dark' : 'sd-light';

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const token = getToken();
      const fd = new FormData();
      fd.append('username', username.trim());
      fd.append('email', email.trim());
      fd.append('skills', JSON.stringify(skills));
      fd.append('interests', JSON.stringify(interests));
      fd.append('cgpa', cgpa);
      fd.append('department', department);
      fd.append('year', year);
      fd.append('certifications', JSON.stringify(certifications));
      fd.append('projects', JSON.stringify(projects.map(title => ({ title, keywords: [] }))));
      const res = await axios.put(`${API}/api/student/profile`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        let savedProfile = res.data.data;
        let analysisFailed = false;
        if (resumeFile) {
          const resumeForm = new FormData();
          resumeForm.append('resume', resumeFile);
          try {
            const analysis = await axios.post(`${API}/api/student/resume/analyze`, resumeForm, {
              headers: { Authorization: 'Bearer ' + token },
            });
            savedProfile = { ...savedProfile, ...analysis.data.data };
            toast.success('Resume uploaded and analyzed.');
          } catch (analysisError) {
            analysisFailed = true;
            toast.error(analysisError.response?.data?.message || 'Profile saved, but resume analysis failed.');
          }
        }
        setMsg({
          type: analysisFailed ? 'error' : 'success',
          text: analysisFailed ? 'Profile saved, but resume analysis failed.' : resumeFile ? 'Profile saved. Resume analysis is complete.' : 'Profile updated successfully! ✓',
        });
        onSaved(savedProfile);
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
      <motion.div
        className={`pe-backdrop ${theme}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className={`pe-modal ${theme}`}
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        <style>{MODAL_STYLES}</style>

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

        <div className="pe-tabs">
          {[
            { id: 'info', label: 'Profile Info', icon: User },
            { id: 'skills', label: 'Skills', icon: Tag },
            { id: 'resume', label: 'Resume', icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} className={`pe-tab ${tab === id ? 'pe-tab-active' : ''}`} onClick={() => setTab(id)}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        <div className="pe-body">
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
                    <option value="AIML">AIML</option>
                    <option value="CSB">CSB</option>
                    <option value="CSD">CSD</option>
                  </select>
                </div>
              </div>
              <div className="pe-field">
                <label className="pe-label">Year of study</label>
                <select className="pe-input" value={year} onChange={e => setYear(e.target.value)}>
                  <option value="">Choose year</option>
                  <option value="1">First year</option>
                  <option value="2">Second year</option>
                  <option value="3">Third year</option>
                  <option value="4">Fourth year</option>
                </select>
              </div>
            </motion.div>
          )}

          {tab === 'skills' && (
            <motion.div key="skills" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="pe-tab-content">
              <TagInput label="Technical Skills" values={skills} onChange={setSkills} color="pe-tag-purple" />
              <TagInput label="Domain Interests" values={interests} onChange={setInterests} color="pe-tag-blue" />
              <TagInput label="Certifications" values={certifications} onChange={setCertifications} color="pe-tag-blue" />
              <TagInput label="Projects" values={projects} onChange={setProjects} color="pe-tag-purple" />
            </motion.div>
          )}

          {tab === 'resume' && (
            <motion.div key="resume" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="pe-tab-content">
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
                  accept=".pdf,.docx"
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
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [availableDrives, setAvailableDrives] = useState([]);
  const [matchScores, setMatchScores] = useState({}); // { companyId: { score, max_possible_points, match_percentage, rank_label, breakdown } }
  const [matchScoreError, setMatchScoreError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.openEvents ? 'programs' : 'overview');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('sd-theme');
    return saved !== null ? saved === 'dark' : false;
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [applyingId, setApplyingId] = useState(null);
  const [broadcasts, setBroadcasts] = useState([]);
  const [eventTrainingPrograms, setEventTrainingPrograms] = useState([]);
  const [registeringProgramId, setRegisteringProgramId] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState('');

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('sd-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const fetchPlacementMatchScores = async () => {
    try {
      const token = getToken();
      if (!token) throw new Error('Your login session has expired. Please sign in again.');
      const scoreRes = await axios.get(`${API}/api/placements/match-scores`, {
        headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
      });
      if (!scoreRes.data?.success) {
        throw new Error(scoreRes.data?.message || 'Placement match scores were not returned.');
      }
      setMatchScores(scoreRes.data.data || {});
      setMatchScoreError('');
    } catch (scoreError) {
      console.error('Placement match score error:', scoreError);
      setMatchScores({});
      setMatchScoreError(scoreError.response?.data?.message || scoreError.message || 'Unable to calculate placement match scores.');
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) { setError('No authentication token found.'); setLoading(false); return; }

      const response = await axios.get(`${API}/api/student/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) setDashboardData(response.data.data);
      else setError(response.data?.message || 'Failed to parse response data.');

      const drivesRes = await axios.get(`${API}/api/placements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (drivesRes.data?.success) {
        setAvailableDrives(drivesRes.data.data || []);
        fetchPlacementMatchScores();
      }

      try {
        const programsRes = await axios.get(`${API}/api/events`, { headers: { Authorization: `Bearer ${token}` } });
        if (programsRes.data?.success) setEventTrainingPrograms(programsRes.data.data || []);
      } catch (programError) {
        toast.error(programError.response?.data?.message || 'Unable to load events and training.');
      }

    } catch (err) {
      console.error('Dashboard Fetch Error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTrainingPrograms = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await axios.get(`${API}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.success) setEventTrainingPrograms(response.data.data || []);
    } catch (programError) {
      console.error('Event and training refresh error:', programError);
      toast.error(programError.response?.data?.message || 'Unable to load events and training.');
    }
  };

  const fetchAiAnalysis = async () => {
    setAiAnalysisLoading(true);
    setAiAnalysisError('');
    try {
      const token = getToken();
      if (!token) throw new Error('Your login session has expired. Please sign in again.');
      const response = await axios.get(`${API}/api/recommendations/analysis`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data?.success) throw new Error(response.data?.message || 'AI analysis was not returned.');
      setAiAnalysis(response.data.data);
    } catch (analysisError) {
      console.error('Student AI analysis error:', analysisError);
      setAiAnalysisError(analysisError.response?.data?.message || analysisError.message || 'Unable to load AI analysis.');
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const openAiAnalysisTab = () => {
    setActiveTab('ai-analysis');
    fetchAiAnalysis();
  };

  const openEventTrainingTab = () => {
    setActiveTab('programs');
    fetchEventTrainingPrograms();
    fetchAiAnalysis();
  };

  const handleProgramRegistration = async (programId) => {
    if (registeringProgramId) return;
    setRegisteringProgramId(programId);
    try {
      const response = await axios.post(`${API}/api/events/${programId}/register`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      
      // Update local events and training lists so registrations appear instantly
      setEventTrainingPrograms(current => current.map(program => program._id === programId
        ? { ...program, isRegistered: true, canRegister: false, registrationCount: response.data.data.registrationCount }
        : program));
      
      toast.success(response.data.message || 'Registered successfully');
      
      // Refresh dashboard data to sync backend state updates and stats
      await fetchDashboard();
      if (activeTab === 'ai-analysis') await fetchAiAnalysis();
    } catch (registrationError) {
      toast.error(registrationError.response?.data?.message || 'Unable to register for this program.');
    } finally {
      setRegisteringProgramId(null);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const profileString = localStorage.getItem('profile');
      const token = profileString ? JSON.parse(profileString).token : null;
      const res = await axios.get(`${API}/api/placements/broadcasts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setBroadcasts(res.data.data);
    } catch (err) {
      console.error('Fetch Broadcasts Error', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await axios.get(`${API}/api/notifications`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      setNotifications(response.data.data || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error('Fetch Notifications Error:', err.response?.data?.message || err.message);
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      const token = getToken();
      await axios.put(`${API}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: 'Bearer ' + token },
      });
      setNotifications(current => current.map(item => item._id === notificationId ? { ...item, isRead: true } : item));
      setUnreadCount(count => Math.max(0, count - 1));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not mark notification as read.');
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const token = getToken();
      await axios.put(`${API}/api/notifications/read-all`, {}, {
        headers: { Authorization: 'Bearer ' + token },
      });
      setNotifications(current => current.map(item => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not mark notifications as read.');
    }
  };

  const handleProfileSaved = (updatedProfile) => {
    setDashboardData(prev => ({
      ...prev,
      profile: { ...prev.profile, ...updatedProfile },
    }));
    if (activeTab === 'ai-analysis' || activeTab === 'programs') fetchAiAnalysis();
  };

  const handleApply = async (companyId) => {
    if (applyingId) return;
    setApplyingId(companyId);
    try {
      const token = getToken();
      const res = await axios.post(`${API}/api/student/apply`, { companyId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success('Successfully applied!');
        await fetchDashboard();
      }
    } catch (err) {
      console.error("Application Error Details:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to apply.';
      toast.error(errorMessage);
    } finally {
      setApplyingId(null);
    }
  };

  useEffect(() => {
    fetchDashboard();
    if (location.state?.openEvents) fetchAiAnalysis();
    // Initial dashboard loading is keyed to route state, not render-created handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.openEvents]);

  useEffect(() => {
    fetchBroadcasts();
    fetchNotifications();
  }, []);

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
          <button onClick={logout} className="sd-btn-ghost">Logout</button>
        </div>
      </motion.div>
    </div>
  );

  const {
    profile = {},
    stats = { eventsCount: 0, appliedCompaniesCount: 0, trainingsAttendedCount: 0 },
    appliedCompanies = [],
  } = dashboardData;

  // Filter events/training programs that are marked as registered
  const registeredPrograms = eventTrainingPrograms.filter(p => p.isRegistered);

  const initials = (profile?.username || user?.username || 'S').slice(0, 2).toUpperCase();
  const username = profile?.username || user?.username || 'Student';

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'companies', label: 'Companies', icon: Briefcase },
    { id: 'programs', label: 'Events & Training', icon: Calendar },
    { id: 'ai-analysis', label: 'AI & Analysis', icon: Sparkles },
    { id: 'career-guidance', label: 'Career Guidance', icon: Lightbulb },
  ];

  return (
    <div className={`sd-root ${theme}`}>
      <style>{STYLES}</style>

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
            <button key={id} onClick={() => {
              if (id === 'career-guidance') navigate('/career-guidance');
              else if (id === 'programs') openEventTrainingTab();
              else if (id === 'ai-analysis') openAiAnalysisTab();
              else {
                setActiveTab(id);
                if (id === 'companies') fetchPlacementMatchScores();
              }
            }} className={`sd-nav-item ${activeTab === id ? 'sd-nav-active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
              {activeTab === id && <div className="sd-nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sd-sidebar-spacer" />

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
            <button className="sd-topbar-bell" onClick={() => setShowProfileModal(true)} title="Edit Profile">
              <Edit3 size={16} />
            </button>
            <div style={{ position: 'relative' }}>
              <button className="sd-topbar-bell" onClick={() => { setShowNotifications(!showNotifications); fetchNotifications(); }}>
                <Bell size={18} />
                {(broadcasts.length > 0 || unreadCount > 0) && <span className="sd-bell-dot" />}
              </button>

              <AnimatePresence initial={false}>
              {showNotifications && (
                <motion.div
                  key="student-notifications"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.99 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                  position: 'absolute', right: 0, top: '46px', width: '320px',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  zIndex: 100, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-head)' }}>Broadcast Alerts</h4>
                    <span style={{ fontSize: '10px', background: 'var(--accent-soft)', color: 'var(--accent-text)', padding: '2px 6px', borderRadius: '4px' }}>Active</span>
                  </div>

                  <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {broadcasts.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>No recent broadcasts</p>
                    ) : (
                      broadcasts.map(b => (
                        <div key={b._id} style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-head)' }}>{b.subject}</p>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-sub)', marginTop: '4px', lineHeight: '1.4' }}>{b.message}</p>
                          <p style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '6px' }}>{new Date(b.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-head)' }}>Notifications</h4>
                      {unreadCount > 0 && <button onClick={markAllNotificationsRead} style={{ fontSize: '11px', color: 'var(--accent-text)' }}>Mark all read</button>}
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {notifications.length === 0
                        ? <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>No notifications</p>
                        : notifications.map(item => (
                          <button key={item._id} onClick={() => !item.isRead && markNotificationRead(item._id)} style={{ textAlign: 'left', padding: '9px', borderRadius: '9px', background: item.isRead ? 'var(--bg-input)' : 'var(--accent-soft)', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-head)' }}>{item.title}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-sub)', marginTop: '3px' }}>{item.message}</p>
                            <p style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '5px' }}>{new Date(item.createdAt).toLocaleDateString()}</p>
                          </button>
                        ))}
                    </div>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
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
                  <StatCard icon={Calendar} label="Events Joined" value={stats.eventsCount || registeredPrograms.length} gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" delay={0.05} />
                  <StatCard icon={Briefcase} label="Companies Applied" value={stats.appliedCompaniesCount || 0} gradient="linear-gradient(135deg,#0ea5e9,#06b6d4)" delay={0.1} />
                  <StatCard icon={Activity} label="Trainings Attended" value={stats.trainingsAttendedCount || 0} gradient="linear-gradient(135deg,#10b981,#059669)" delay={0.15} />
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
                      <button onClick={() => { setActiveTab('companies'); fetchPlacementMatchScores(); }} className="sd-view-all">View all <ChevronRight size={13} /></button>
                    </div>
                    {appliedCompanies.slice(0, 3).length > 0
                      ? appliedCompanies.slice(0, 3).map((item, i) => <CompanyRow key={i} item={item} />)
                      : <EmptyState text="No applications yet." />}
                  </div>

                  <div className="sd-card">
                    <div className="sd-card-header">
                      <div className="sd-card-icon" style={{ '--icon-color': '#10b981' }}><Calendar size={16} /></div>
                      <div>
                        <h3 className="sd-card-title">Upcoming Registered Events</h3>
                        <p className="sd-card-sub">Your registered events</p>
                      </div>
                      <button onClick={openEventTrainingTab} className="sd-view-all">View all <ChevronRight size={13} /></button>
                    </div>
                    {registeredPrograms.slice(0, 3).length > 0
                      ? registeredPrograms.slice(0, 3).map((ev, i) => <EventRow key={i} ev={ev} />)
                      : <EmptyState text="No events registered." />}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════════ COMPANIES ════════ */}
            {activeTab === 'companies' && (
              <motion.div key="companies" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                <SectionHeader icon={Zap} title="New Opportunities" sub={`${availableDrives.length} active placement drives`} color="#6366f1" />
                {matchScoreError && (
                  <p role="status" style={{ marginBottom: '14px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    Match scores are temporarily unavailable: {matchScoreError}
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                  {availableDrives.map((comp, idx) => (
                    <motion.div key={comp._id || idx} className="sd-card" whileHover={{ translateY: -4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="pe-avatar-big" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', width: '42px', height: '42px', borderRadius: '12px', fontSize: '16px', textAlign: 'center', lineHeight: '42px', color: '#fff' }}>
                            {(comp.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-head)' }}>{comp.name}</h3>
                            <p style={{ fontSize: '12px', color: 'var(--accent)' }}>{comp.jobRole}</p>
                          </div>
                        </div>
                      </div>
                      {matchScores[comp._id] && (
                        <div style={{ marginTop: '8px', padding: '10px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                          <MatchBadge match={matchScores[comp._id]} />
                          <p style={{ marginTop: '7px', fontSize: '12px', fontWeight: 600, color: 'var(--text-head)' }}>
                            Total: {matchScores[comp._id].score}/14
                          </p>
                          {comp.jobDescription?.url && matchScores[comp._id].job_description_analyzed === false && (
                            <p style={{ marginTop: '7px', fontSize: '11px', color: 'var(--text-muted)' }}>
                              This job description could not be analyzed; its score uses the available profile and eligibility details.
                            </p>
                          )}
                          {matchScores[comp._id].breakdown && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 10px', marginTop: '8px', fontSize: '11px', color: 'var(--text-sub)' }}>
                              <span title={matchScores[comp._id].breakdown.matched_skills?.join(', ') || 'No matched skills'}>
                                Matching skill: +{matchScores[comp._id].breakdown.skill_points}
                                {matchScores[comp._id].breakdown.matched_skills?.length
                                  ? ` (${matchScores[comp._id].breakdown.matched_skills.join(', ')})`
                                  : ''}
                              </span>
                              <span title={matchScores[comp._id].breakdown.matched_interests?.join(', ') || 'No matched interests'}>
                                Domain interest: +{matchScores[comp._id].breakdown.domain_points}
                              </span>
                              <span title={matchScores[comp._id].breakdown.matched_project_keywords?.join(', ') || 'No matched project keywords'}>
                                Project keyword: +{matchScores[comp._id].breakdown.project_points}
                              </span>
                              <span>Branch/year eligibility: +{matchScores[comp._id].breakdown.eligibility_points}</span>
                              <span title={matchScores[comp._id].breakdown.matched_certifications?.join(', ') || 'No matched certifications'}>
                                Certification: +{matchScores[comp._id].breakdown.certification_points}
                              </span>
                              <span>CGPA condition: +{matchScores[comp._id].breakdown.cgpa_points}</span>
                            </div>
                          )}
                          {matchScores[comp._id].breakdown?.missing_skills?.length > 0 && (
                            <p style={{ marginTop: '7px', fontSize: '11px', color: 'var(--text-muted)' }}>
                              JD skills not found in your profile: {matchScores[comp._id].breakdown.missing_skills.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', marginTop: '4px' }}>
                        <p style={{ color: 'var(--text-sub)' }}><strong>Package:</strong> {comp.ctc}</p>
                        <p style={{ color: 'var(--text-sub)' }}><strong>Eligibility:</strong> {comp.eligibilityCriteria?.cgpa || 0} CGPA</p>
                        <p style={{ color: 'var(--text-sub)' }}><strong>Deadline:</strong> {new Date(comp.visitDate).toLocaleDateString()}</p>
                        {comp.canApply === false && comp.eligibilityReason && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{comp.eligibilityReason}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        {comp.jobDescription?.url && (
                          <a href={`${API}/${comp.jobDescription.url}`} target="_blank" rel="noreferrer" className="sd-btn-ghost" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '8px' }}>
                            View JD
                          </a>
                        )}
                        <button
                          className="sd-btn-primary"
                          style={{
                            flex: 1,
                            padding: '8px',
                            opacity: comp.canApply === false || appliedCompanies.some(ac => ac.companyId?._id === comp._id) ? 0.6 : 1,
                            cursor: comp.canApply === false || appliedCompanies.some(ac => ac.companyId?._id === comp._id) ? 'not-allowed' : 'pointer'
                          }}
                          onClick={() => handleApply(comp._id)}
                          disabled={comp.canApply === false || applyingId === comp._id || appliedCompanies.some(ac => ac.companyId?._id === comp._id)}
                        >
                          {applyingId === comp._id ? 'Applying...' : appliedCompanies.some(ac => ac.companyId?._id === comp._id) ? 'Applied ✓' : comp.canApply === false ? 'Not eligible' : 'Apply Now'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

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

            {/* ════════ EVENTS & TRAINING ════════ */}
            {activeTab === 'ai-analysis' && (
              <motion.div key="ai-analysis" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <SectionHeader icon={Sparkles} title="AI & Analysis Results" sub="Resume-based relevance, skill matches, and eligibility for each opportunity." color="#8b5cf6" />
                  <button type="button" className="sd-btn-ghost" onClick={fetchAiAnalysis} disabled={aiAnalysisLoading}>
                    {aiAnalysisLoading ? 'Analyzing…' : 'Refresh analysis'}
                  </button>
                </div>
                <p style={{ margin: '12px 0 18px', color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.6 }}>
                  Company relevance uses your profile skills, interests, projects, certifications, and academic eligibility against each opportunity’s extracted requirements.
                </p>

                {aiAnalysisError && <p role="alert" style={{ marginBottom: '16px', color: '#f87171', fontSize: '13px' }}>{aiAnalysisError}</p>}
                {aiAnalysisLoading && !aiAnalysis && <div className="sd-loading-screen"><Loader2 className="pe-spin" /><p className="sd-loading-text">Analyzing your profile and opportunities…</p></div>}
                {!aiAnalysisLoading && aiAnalysis && (
                  <>
                    <div className="sd-card sd-analysis-signals">
                      <div className="sd-analysis-signals-header">
                        <div>
                          <h3 className="sd-card-title">Resume &amp; profile signals</h3>
                          <p className="sd-card-sub">
                            {aiAnalysis.resume ? `Analyzed resume: ${aiAnalysis.resume.fileName}` : 'No analyzed resume yet. Upload one from your profile to improve matching.'}
                          </p>
                        </div>
                        {aiAnalysis.resume && <span className="sd-count-badge sd-count-blue">{aiAnalysis.resume.keywordScore} keywords</span>}
                      </div>
                      <div className="sd-analysis-signals-grid">
                        {[
                          ['Skills', [...new Set([...(aiAnalysis.profileSkills || []), ...(aiAnalysis.resume?.skills || [])])]],
                          ['Programming languages', aiAnalysis.resume?.programmingLanguages || []],
                          ['Tools & frameworks', aiAnalysis.resume?.tools || []],
                          ['Role interests', [...new Set([...(aiAnalysis.profileInterests || []), ...(aiAnalysis.resume?.roleInterests || [])])]],
                          ['Projects', aiAnalysis.resume?.projects || []],
                          ['Project keywords', aiAnalysis.resume?.projectKeywords || []],
                          ['Certifications', aiAnalysis.resume?.certifications || []],
                        ].map(([label, values]) => (
                          <section key={label} className="sd-analysis-signal">
                            <div className="sd-analysis-signal-heading">
                              <strong>{label}</strong>
                              <span>{values.length}</span>
                            </div>
                            <div className="sd-analysis-signal-tags">
                              {values.length
                                ? values.map((value, index) => (
                                  <span
                                    key={`${label}-${index}`}
                                    className="sd-tag sd-tag-blue"
                                    title={String(value)}
                                  >
                                    {value}
                                  </span>
                                ))
                                : <span className="sd-analysis-none">None found</span>}
                            </div>
                          </section>
                        ))}
                        {aiAnalysis.resume?.education && (
                          <section className="sd-analysis-signal sd-analysis-education">
                            <div className="sd-analysis-signal-heading"><strong>Education</strong></div>
                            <p>{aiAnalysis.resume.education}</p>
                          </section>
                        )}
                      </div>
                    </div>

                    <SectionHeader icon={Calendar} title="Event & Training Relevance" sub={`${aiAnalysis.events?.length || 0} programs analyzed · registration eligibility shown`} color="#10b981" />
                    {aiAnalysis.events?.length
                      ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px', margin: '14px 0 24px' }}>
                          {aiAnalysis.events.map(item => (
                            <AnalysisOpportunityCard key={item.opportunity_id} item={item} kind="event" onRegister={handleProgramRegistration} registeringId={registeringProgramId} />
                          ))}
                        </div>
                      : <EmptyCard text="No upcoming events or training programs are available for your department." icon={Calendar} />}

                    <SectionHeader icon={Briefcase} title="Company Relevance" sub={`${aiAnalysis.placements?.length || 0} placement opportunities analyzed`} color="#6366f1" />
                    {aiAnalysis.placements?.length
                      ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px', marginTop: '14px' }}>
                          {aiAnalysis.placements.map(item => (
                            <AnalysisOpportunityCard key={item.opportunity_id} item={item} kind="placement" />
                          ))}
                        </div>
                      : <EmptyCard text="No current placement opportunities to analyze." icon={Briefcase} />}
                  </>
                )}
              </motion.div>
            )}

            {/* ════════ EVENTS & TRAINING ════════ */}
            {activeTab === 'programs' && (
              <motion.div key="programs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="sd-section">
                <SectionHeader icon={Calendar} title="Events & Training" sub={`${eventTrainingPrograms.length} available program${eventTrainingPrograms.length !== 1 ? 's' : ''} for your department`} color="#10b981" />
                {aiAnalysisLoading && <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '-12px 0 14px' }}>Calculating resume match scores…</p>}
                {aiAnalysisError && <p role="status" style={{ color: '#f87171', fontSize: '12px', margin: '-12px 0 14px' }}>Event match scores are unavailable: {aiAnalysisError}</p>}
                
                {eventTrainingPrograms.length > 0 ? (
                  <div className="sd-events-grid">
                    {eventTrainingPrograms.map((program, index) => (
                      <motion.article key={program._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="sd-event-card">
                        <div className="sd-event-top">
                          <span className="sd-event-chip">{program.type} · {program.category}</span>
                          <span className="sd-event-date">{new Date(program.date).toLocaleString()}</span>
                        </div>
                        <EventMatchBadge programId={program._id} events={aiAnalysis?.events} />
                        <h3 className="sd-event-title">{program.title}</h3>
                        <p className="sd-event-desc">{program.description}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0' }}>
                          <span className="sd-event-org"><Star size={11} /> Organizer: {program.organizer}</span>
                          <span className="sd-event-org">Department: {program.targetDepartment?.includes('All') ? 'All Departments' : (program.targetDepartment || []).join(', ')}</span>
                        </div>
                        <div className="sd-event-footer">
                          <span className="sd-event-date">{program.registrationCount || 0} registered</span>
                          <button
                            type="button"
                            className="sd-event-btn"
                            disabled={program.isRegistered || program.canRegister === false || !program.registrationOpen || registeringProgramId === program._id}
                            onClick={() => handleProgramRegistration(program._id)}
                          >
                            {program.isRegistered ? 'Registered ✓' : registeringProgramId === program._id ? 'Registering…' : !program.registrationOpen ? 'Registration closed' : program.canRegister === false ? 'Not eligible' : 'Register'}
                          </button>
                        </div>
                        <div className="sd-event-glow" />
                      </motion.article>
                    ))}
                  </div>
                ) : (
                  <EmptyCard text="No upcoming events or training sessions are available for your department." icon={Calendar} />
                )}

                <div className="sd-panel-spacer" />
                <SectionHeader icon={CheckCircle} title="My Registered Events & Training" sub={`${registeredPrograms.length} registrations`} color="#6366f1" />
                
                {registeredPrograms.length > 0 ? (
                  <div className="sd-events-grid">
                    {registeredPrograms.map((program, i) => (
                      <motion.div key={program._id || i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="sd-event-card">
                        <div className="sd-event-top">
                          <span className="sd-event-chip">{program.type} · {program.category}</span>
                          <span className="sd-event-date">📅 {new Date(program.date).toLocaleDateString()}</span>
                        </div>
                        <EventMatchBadge programId={program._id} events={aiAnalysis?.events} />
                        <h3 className="sd-event-title">{program.title}</h3>
                        <p className="sd-event-desc">{program.description}</p>
                        <div className="sd-event-footer">
                          <span className="sd-event-org"><Star size={11} /> {program.organizer || 'Campus venue'}</span>
                          <span className="sd-badge-emerald sd-status-badge"><span className="sd-badge-dot" style={{ background: '#34d399' }} />Registered ✓</span>
                        </div>
                        <div className="sd-event-glow" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="You have not registered for any events or training sessions yet." />
                )}
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

// Shows the fixed-rubric score and relevance on each placement card.
const matchRankConfig = {
  'highly recommended': { cls: 'sd-match-high', label: 'Highly Recommended' },
  'recommended': { cls: 'sd-match-mid', label: 'Recommended' },
  'low priority': { cls: 'sd-match-low', label: 'Low Priority' },
};
const EventMatchBadge = ({ programId, events = [] }) => {
  const match = events.find(item => String(item.opportunity_id) === String(programId));
  if (!match) return null;

  return (
    <div title="Resume/profile relevance based on matched skills, interests, project keywords, and eligibility" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', width: 'fit-content', padding: '6px 10px', borderRadius: '999px', background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '12px', marginTop: '9px' }}>
      <Sparkles size={13} />
      <strong>{match.match_percentage}% match</strong>
      <span style={{ color: 'var(--text-sub)' }}>{match.score}/14 pts · {match.rank_label}</span>
    </div>
  );
};

const MatchBadge = ({ match }) => {
  if (!match) return null;
  const cfg = matchRankConfig[match.rank_label] || { cls: 'sd-match-low', label: match.rank_label };
  return (
    <span className={`sd-match-badge ${cfg.cls}`} title="Company score based on your profile skills, interests, projects, certifications, and eligibility">
      <Star size={11} /> {match.score}/14 pts · {match.match_percentage}% · {cfg.label}
    </span>
  );
};

const AnalysisOpportunityCard = ({ item, kind, onRegister, registeringId }) => {
  const breakdown = item.breakdown || {};
  const canTakeAction = kind === 'event' ? item.canRegister : item.canApply;
  const actionReason = kind === 'event' ? item.registrationReason : item.eligibilityReason;
  const alreadyRegistered = kind === 'event' && item.isRegistered;
  const [showDescription, setShowDescription] = useState(false);
  const hasLongDescription = (item.description || '').length > 260;

  return (
    <article className="sd-card sd-analysis-opportunity">
      <div className="sd-analysis-opportunity-heading">
        <div>
          <span className="sd-analysis-opportunity-kind">
            {kind === 'event' ? `${item.type || 'Event'} · ${item.category || 'Program'}` : item.jobRole || 'Placement'}
          </span>
          <h3 className="sd-analysis-opportunity-title">
            {kind === 'event' ? item.title : item.companyName || item.title}
          </h3>
        </div>
        <div className="sd-analysis-score">
          <strong>{item.match_percentage}%</strong>
          <span>{item.score}/14 · {item.rank_label}</span>
        </div>
      </div>
      <div className="sd-analysis-score-track" aria-label={`${item.match_percentage}% match`}>
        <div style={{ width: `${item.match_percentage}%` }} />
      </div>
      {item.description && (
        <div className="sd-analysis-description">
          <p className={showDescription ? '' : 'sd-analysis-description-collapsed'}>{item.description}</p>
          {hasLongDescription && (
            <button type="button" onClick={() => setShowDescription(value => !value)}>
              {showDescription ? 'Show less' : 'Read full description'}
            </button>
          )}
        </div>
      )}
      <div className="sd-analysis-breakdown">
        {[
          ['Matching skill', breakdown.skill_points, 3, breakdown.matched_skills],
          ['Domain interest', breakdown.domain_points, 2, breakdown.matched_interests],
          ['Project keyword', breakdown.project_points, 2, breakdown.matched_project_keywords],
          ['Branch/year eligibility', breakdown.eligibility_points, 3],
          ['Certification', breakdown.certification_points, 1, breakdown.matched_certifications],
          ['CGPA condition', breakdown.cgpa_points, 3],
        ].map(([label, points, max, matches]) => (
          <div key={label} className="sd-analysis-breakdown-item" title={matches?.join(', ') || undefined}>
            <span>{label}</span>
            <strong>+{points || 0}<small>/{max}</small></strong>
          </div>
        ))}
      </div>
      {breakdown.missing_skills?.length > 0 && (
        <details className="sd-analysis-missing-skills">
          <summary>Skills to consider developing ({breakdown.missing_skills.length})</summary>
          <p>{breakdown.missing_skills.join(', ')}</p>
        </details>
      )}
      {kind === 'event' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
          <span style={{ color: canTakeAction || alreadyRegistered ? '#10b981' : 'var(--text-muted)', fontSize: '11px' }}>
            {alreadyRegistered ? 'Already registered' : actionReason}
          </span>
          <button
            type="button"
            className="sd-event-btn"
            disabled={!canTakeAction || alreadyRegistered || registeringId === item.opportunity_id}
            onClick={() => onRegister(item.opportunity_id)}
          >
            {alreadyRegistered ? 'Registered ✓' : registeringId === item.opportunity_id ? 'Registering…' : canTakeAction ? 'Register' : 'Not eligible'}
          </button>
        </div>
      )}
      {kind === 'placement' && (
        <p style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', color: canTakeAction ? '#10b981' : 'var(--text-muted)', fontSize: '11px' }}>
          {canTakeAction ? 'You meet placement eligibility.' : item.eligibilityReason}
          {item.jobDescriptionAnalyzed === false && ' Job description could not be analyzed.'}
        </p>
      )}
    </article>
  );
};

const EmptyCard = ({ text, icon: Icon }) => (
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
   Modal-specific styles
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
  .sd-modal-portal > * { pointer-events: all; }

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

  .pe-body { flex: 1; overflow-y: auto; padding: 20px 24px; }
  .pe-tab-content { display: flex; flex-direction: column; gap: 16px; }

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

  .pe-tags-wrap { display: flex; flex-wrap: wrap; gap: 7px; min-height: 30px; }
  .pe-tag {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 10px 5px 12px; border-radius: 8px;
    font-size: 12px; font-weight: 600;
  }
  .pe-tag-purple { background: rgba(99,102,241,0.1); color: var(--accent-text); border: 1px solid rgba(99,102,241,0.2); }
  .pe-tag-blue   { background: rgba(14,165,233,0.1);  color: #0ea5e9;            border: 1px solid rgba(14,165,233,0.2); }
  .pe-tag-del {
    width: 16px; height: 16px; border-radius: 50%;
    border: none; background: rgba(0,0,0,0.12);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.15s; color: inherit; padding: 0;
  }
  .pe-tag-del:hover { background: rgba(0,0,0,0.25); }

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

  .pe-msg { margin: 0 24px; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 500; }
  .pe-msg-success { background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.25); }
  .pe-msg-error   { background: rgba(248,113,113,0.1); color: #dc2626; border: 1px solid rgba(248,113,113,0.25); }
  .sd-dark .pe-msg-success { color: #34d399; }
  .sd-dark .pe-msg-error   { color: #fca5a5; }

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
   Dashboard styles
───────────────────────────────────────────── */
const STYLES = `
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
  .sd-avatar-clickable { cursor: pointer; position: relative; }
  .sd-avatar-clickable:hover { border-color: var(--accent) !important; background: var(--accent-soft) !important; }
  .sd-avatar-edit-hint {
    margin-left: auto; flex-shrink: 0; color: var(--text-dim); opacity: 0; transition: opacity 0.2s;
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
    display: flex; align-items: center; transition: border-color 0.4s;
  }
  .sd-toggle-thumb {
    width: 20px; height: 20px; border-radius: 50%; background: #fff;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 6px rgba(0,0,0,0.25); flex-shrink: 0;
  }
  .sd-toggle-label { font-size: 12px; font-weight: 600; color: var(--text-muted); min-width: 32px; }

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
  }

  /* Notification dropdown */
  .sd-notif-panel {
    position: absolute; top: 46px; right: 0; width: 320px; max-height: 400px;
    background: var(--bg-sidebar, var(--bg-card)); border: 1px solid var(--border);
    border-radius: 14px; box-shadow: 0 12px 32px rgba(0,0,0,0.25); z-index: 50;
    display: flex; flex-direction: column; overflow: hidden;
  }
  .sd-notif-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 14px; border-bottom: 1px solid var(--border);
    font-size: 13px; font-weight: 700; color: var(--text-head);
  }
  .sd-notif-mark-read { background: none; border: none; color: var(--accent-text); font-size: 11px; font-weight: 600; cursor: pointer; }
  .sd-notif-list { overflow-y: auto; max-height: 340px; }
  .sd-notif-empty { padding: 24px; text-align: center; color: var(--text-muted); font-size: 12.5px; }
  .sd-notif-item { padding: 10px 14px; border-bottom: 1px solid var(--border); }
  .sd-notif-item:last-child { border-bottom: none; }
  .sd-notif-unread { background: var(--accent-soft); }
  .sd-notif-title { font-size: 12.5px; font-weight: 700; color: var(--text-head); margin-bottom: 2px; }
  .sd-notif-message { font-size: 11.5px; color: var(--text-sub); line-height: 1.4; }
  .sd-notif-time { font-size: 10px; color: var(--text-muted); margin-top: 4px; }

  .sd-content { flex: 1; padding: 28px 32px; overflow-y: auto; }
  .sd-section { display: flex; flex-direction: column; gap: 22px; }

  /* Hero */
  .sd-hero {
    position: relative; overflow: hidden; border-radius: 24px;
    padding: 40px 40px 40px 44px; background: var(--hero-bg);
    border: 1px solid var(--hero-border);
    display: flex; align-items: center; justify-content: space-between;
    min-height: 230px;
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
    font-size: 12px; color: var(--text-sub); font-weight: 500;
  }
  .sd-light .sd-meta-pill { background: rgba(99,102,241,0.07); border-color: rgba(99,102,241,0.15); }
  .sd-hero-illustration { position: relative; z-index: 2; display: flex; align-items: flex-end; justify-content: center; }
  .sd-hero-img { width: 200px; object-fit: contain; }

  /* Stats */
  .sd-stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
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

  /* Cards */
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
  .sd-analysis-signals { padding: 20px; margin-bottom: 20px; }
  .sd-analysis-signals-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
  .sd-analysis-signals-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
  .sd-analysis-signal { min-width: 0; padding: 12px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg-input); }
  .sd-analysis-signal-heading { display: flex; justify-content: space-between; align-items: center; gap: 8px; color: var(--text-sub); font-size: 11px; }
  .sd-analysis-signal-heading > span { color: var(--text-muted); font-variant-numeric: tabular-nums; }
  .sd-analysis-signal-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
  .sd-analysis-signal-tags .sd-tag { max-width: 100%; overflow-wrap: anywhere; }
  .sd-analysis-none { color: var(--text-muted); font-size: 11px; }
  .sd-analysis-education { grid-column: 1 / -1; }
  .sd-analysis-education p { margin-top: 8px; color: var(--text-body); font-size: 12px; line-height: 1.6; white-space: pre-line; overflow-wrap: anywhere; }
  .sd-analysis-opportunity { min-width: 0; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
  .sd-analysis-opportunity-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .sd-analysis-opportunity-kind { color: var(--accent); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
  .sd-analysis-opportunity-title { margin-top: 4px; color: var(--text-head); font-size: 16px; font-weight: 700; overflow-wrap: anywhere; }
  .sd-analysis-score { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; gap: 2px; text-align: right; }
  .sd-analysis-score strong { color: var(--accent); font-size: 20px; line-height: 1.1; }
  .sd-analysis-score span { color: var(--text-muted); font-size: 10px; text-transform: capitalize; }
  .sd-analysis-score-track { height: 6px; border-radius: 99px; background: var(--border); overflow: hidden; }
  .sd-analysis-score-track > div { height: 100%; border-radius: inherit; background: linear-gradient(90deg,#6366f1,#10b981); }
  .sd-analysis-description { color: var(--text-sub); font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
  .sd-analysis-description-collapsed { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 4; }
  .sd-analysis-description button { margin-top: 6px; padding: 0; border: 0; background: transparent; color: var(--accent-text); font-size: 11px; font-weight: 600; cursor: pointer; }
  .sd-analysis-breakdown { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; padding-top: 10px; border-top: 1px solid var(--border); }
  .sd-analysis-breakdown-item { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; min-width: 0; padding: 7px 8px; border-radius: 8px; background: var(--bg-input); color: var(--text-sub); font-size: 10px; }
  .sd-analysis-breakdown-item > span { overflow-wrap: anywhere; }
  .sd-analysis-breakdown-item > strong { flex-shrink: 0; color: var(--text-head); font-size: 12px; }
  .sd-analysis-breakdown-item small { color: var(--text-muted); font-size: 9px; font-weight: 500; }
  .sd-analysis-missing-skills { color: var(--text-muted); font-size: 11px; }
  .sd-analysis-missing-skills summary { cursor: pointer; font-weight: 600; }
  .sd-analysis-missing-skills p { margin-top: 6px; line-height: 1.5; overflow-wrap: anywhere; }
  .sd-count-badge { margin-left: auto; padding: 3px 9px; border-radius: 99px; background: var(--accent-soft); font-size: 11px; font-weight: 600; color: var(--text-muted); }
  .sd-count-blue  { background: rgba(14,165,233,0.08); color: #0ea5e9; }
  .sd-view-all {
    margin-left: auto; display: flex; align-items: center; gap: 3px;
    font-size: 11px; font-weight: 600; color: var(--accent); background: none; border: none; cursor: pointer;
  }

  .sd-tags-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
  .sd-tag { padding: 6px 13px; border-radius: 10px; font-size: 12px; font-weight: 600; }
  .sd-tag-purple { background: rgba(99,102,241,0.08); color: var(--accent-text); border: 1px solid rgba(99,102,241,0.18); }
  .sd-tag-blue   { background: rgba(14,165,233,0.08); color: #0ea5e9; border: 1px solid rgba(14,165,233,0.2); }

  .sd-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  /* List & Mini rows */
  .sd-list { display: flex; flex-direction: column; gap: 10px; }
  .sd-list-item {
    display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 14px;
    background: var(--bg-card); border: 1px solid var(--border);
  }
  .sd-list-avatar {
    width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .sd-list-body { flex: 1; min-width: 0; }
  .sd-list-title { font-size: 13.5px; font-weight: 600; color: var(--text-head); }
  .sd-list-sub   { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

  .sd-mini-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .sd-mini-row:last-child { border-bottom: none; }
  .sd-mini-dot {
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff;
  }
  .sd-mini-body { flex: 1; min-width: 0; }
  .sd-mini-title { font-size: 12.5px; font-weight: 600; color: var(--text-head); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sd-mini-sub   { font-size: 11px; color: var(--text-muted); }
  .sd-mini-chip  { padding: 3px 8px; border-radius: 8px; background: var(--accent-soft); font-size: 10px; font-weight: 600; color: var(--text-muted); }

  /* Status badges */
  .sd-status-badge {
    display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 99px; font-size: 11.5px; font-weight: 600; white-space: nowrap;
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

  /* Events grid & cards */
  .sd-events-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); gap: 16px; }
  .sd-event-card {
    position: relative; overflow: hidden;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 18px; padding: 20px;
    display: flex; flex-direction: column; gap: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .sd-event-top   { display: flex; justify-content: space-between; align-items: center; }
  .sd-event-chip  { padding: 4px 10px; border-radius: 8px; background: rgba(16,185,129,0.08); color: #059669; border: 1px solid rgba(16,185,129,0.2); font-size: 10.5px; font-weight: 600; }
  .sd-dark .sd-event-chip { color: #34d399; }
  .sd-event-date  { font-size: 11px; color: var(--text-muted); }
  .sd-event-title { font-size: 15px; font-weight: 700; color: var(--text-head); }
  .sd-event-desc  { font-size: 12px; color: var(--text-sub); line-height: 1.6; }
  .sd-event-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--border); margin-top: auto; }
  .sd-event-org   { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); }
  .sd-event-btn   { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 8px; background: rgba(16,185,129,0.07); color: #059669; border: 1px solid rgba(16,185,129,0.18); font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .sd-dark .sd-event-btn { color: #34d399; }
  .sd-event-btn:hover { background: rgba(16,185,129,0.14); }
  .sd-event-glow { position: absolute; right: -40px; bottom: -40px; width: 120px; height: 120px; border-radius: 50%; background: rgba(16,185,129,0.05); filter: blur(40px); pointer-events: none; }

  /* Section header */
  .sd-section-header { display: flex; align-items: center; gap: 14px; }
  .sd-panel-spacer { height: 20px; }
  .sd-section-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center; color: var(--ic); flex-shrink: 0; }
  .sd-section-title { font-size: 18px; font-weight: 700; color: var(--text-head); }
  .sd-section-sub   { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

  /* Empty states */
  .sd-empty-inline { width: 100%; padding: 20px 16px; border: 1px dashed var(--border-hov); border-radius: 12px; text-align: center; }
  .sd-empty-inline p { font-size: 12.5px; color: var(--text-dim); }
  .sd-empty-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 60px 40px; border: 1px dashed var(--border-hov); border-radius: 20px; text-align: center; }
  .sd-empty-icon { color: var(--text-dim); }
  .sd-empty-card p { font-size: 14px; color: var(--text-dim); }

  /* Loading & Error screens */
  .sd-loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: var(--bg); gap: 16px; font-family: 'Inter', sans-serif; }
  .sd-loader { width: 44px; height: 44px; border-radius: 50%; border: 3px solid rgba(99,102,241,0.15); border-top-color: #6366f1; }
  .sd-loading-text { font-size: 13px; color: var(--text-muted); }
  .sd-error-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--bg); padding: 24px; font-family: 'Inter', sans-serif; }
  .sd-error-card { background: var(--bg-card); border: 1px solid rgba(248,113,113,0.2); border-radius: 24px; padding: 40px; max-width: 420px; width: 100%; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .sd-error-icon { width: 60px; height: 60px; border-radius: 50%; background: rgba(248,113,113,0.1); color: #f87171; display: flex; align-items: center; justify-content: center; }
  .sd-error-title { font-size: 20px; font-weight: 700; color: var(--text-head); }
  .sd-error-msg   { font-size: 13px; color: var(--text-muted); }
  .sd-error-actions { display: flex; gap: 10px; }
  .sd-btn-primary { padding: 9px 20px; border-radius: 10px; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; font-size: 13px; font-weight: 600; border: none; cursor: pointer; }
  .sd-btn-ghost { padding: 9px 20px; border-radius: 10px; background: var(--accent-soft); border: 1px solid var(--border-hov); color: var(--text-muted); font-size: 13px; font-weight: 600; cursor: pointer; }

  @media (max-width: 900px) {
    .sd-sidebar { display: none; }
    .sd-two-col { grid-template-columns: 1fr; }
    .sd-stats-row { grid-template-columns: repeat(2,1fr); }
    .sd-analysis-signals-grid { grid-template-columns: 1fr; }
    .sd-analysis-education { grid-column: auto; }
    .sd-hero { flex-direction: column; align-items: flex-start; }
    .sd-hero-content { max-width: 100%; }
    .sd-hero-illustration { display: none; }
  }
`;

export default StudentDashboard;
