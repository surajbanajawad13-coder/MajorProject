import React, { useEffect, useMemo, useRef, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import {
  LayoutDashboard,
  Briefcase,
  Users,
  Plus,
  Building,
  LogOut,
  Sun,
  Moon,
  X,
  Upload,
  Search,
  Activity,
  GraduationCap,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  UserCheck,
  RefreshCw
} from 'lucide-react';

import axios from 'axios';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';


const API = 'http://localhost:8000';


// ============================================================
// ANIMATED COUNTER
// ============================================================

function useCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const numericTarget = Number(target) || 0;

    if (numericTarget === 0) {
      setCount(0);
      return;
    }

    let start = 0;

    const step = Math.max(
      1,
      Math.ceil(numericTarget / (duration / 16))
    );

    const timer = setInterval(() => {
      start += step;

      if (start >= numericTarget) {
        setCount(numericTarget);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}


// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  icon: Icon,
  label,
  value,
  gradient,
  delay = 0
}) => {
  const animatedValue = useCounter(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        type: 'spring',
        stiffness: 120
      }}
      className="sd-stat-card"
    >
      <div
        className="sd-stat-icon-wrap"
        style={{ background: gradient }}
      >
        <Icon size={20} />
      </div>

      <div className="sd-stat-body">
        <span className="sd-stat-value">
          {animatedValue}
          {label === 'Placement Rate' ? '%' : ''}
        </span>

        <span className="sd-stat-label">
          {label}
        </span>
      </div>

      <div className="sd-stat-glow" />
    </motion.div>
  );
};


// ============================================================
// THEME TOGGLE
// ============================================================

const ThemeToggle = ({ isDark, onToggle }) => {
  return (
    <motion.button
      onClick={onToggle}
      className="sd-theme-toggle"
      whileTap={{ scale: 0.92 }}
      title={isDark ? 'Switch to Light' : 'Switch to Dark'}
    >
      <motion.div
        className="sd-toggle-track"
        animate={{
          background: isDark
            ? 'linear-gradient(135deg,#1e1b4b,#312e81)'
            : 'linear-gradient(135deg,#e0f2fe,#bae6fd)'
        }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="sd-toggle-thumb"
          animate={{
            x: isDark ? 2 : 26
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 28
          }}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.span
                key="moon"
                initial={{
                  rotate: -30,
                  opacity: 0
                }}
                animate={{
                  rotate: 0,
                  opacity: 1
                }}
                exit={{
                  rotate: 30,
                  opacity: 0
                }}
              >
                <Moon
                  size={12}
                  color="#818cf8"
                />
              </motion.span>
            ) : (
              <motion.span
                key="sun"
                initial={{
                  rotate: 30,
                  opacity: 0
                }}
                animate={{
                  rotate: 0,
                  opacity: 1
                }}
                exit={{
                  rotate: -30,
                  opacity: 0
                }}
              >
                <Sun
                  size={12}
                  color="#f59e0b"
                />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <span className="sd-toggle-label">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </motion.button>
  );
};


// ============================================================
// STATUS BADGE
// ============================================================

const statusConfig = {
  Upcoming: {
    cls: 'sd-badge-blue',
    dot: '#60a5fa'
  },

  Today: {
    cls: 'sd-badge-emerald',
    dot: '#34d399'
  },

  Visited: {
    cls: 'sd-badge-default',
    dot: '#94a3b8'
  }
};

const StatusBadge = ({ status }) => {
  const config =
    statusConfig[status] || {
      cls: 'sd-badge-default',
      dot: '#94a3b8'
    };

  return (
    <span
      className={`sd-status-badge ${config.cls}`}
    >
      <span
        className="sd-badge-dot"
        style={{
          background: config.dot
        }}
      />

      {status || 'Upcoming'}
    </span>
  );
};


// ============================================================
// POST DRIVE MODAL
// ============================================================

const PostDriveModal = ({
  onClose,
  isDark,
  onDrivePosted,
  userDept
}) => {
  const [formData, setFormData] = useState({
    name: '',
    jobRole: '',
    ctc: '',
    visitDate: '',
    cgpa: '',
    branches: userDept || '',
    visibility: 'department'
  });

  const [jdFile, setJdFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const fileRef = useRef(null);

  const theme = isDark
    ? 'sd-dark'
    : 'sd-light';


  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleVisibilityChange = (visibility) => {
    if (visibility === 'department') {
      setFormData(prev => ({
        ...prev,
        visibility: 'department',
        branches: userDept || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        visibility: 'all',
        branches: 'All'
      }));
    }
  };


  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('PDF size must be less than 5MB.');
      return;
    }

    setJdFile(file);
  };


  const handleSave = async () => {
    if (
      !formData.name.trim() ||
      !formData.jobRole.trim() ||
      !formData.ctc.trim() ||
      !formData.visitDate ||
      !formData.cgpa
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSaving(true);

    try {
      const data = new FormData();

      data.append(
        'name',
        formData.name.trim()
      );

      data.append(
        'jobRole',
        formData.jobRole.trim()
      );

      data.append(
        'ctc',
        formData.ctc.trim()
      );

      data.append(
        'visitDate',
        formData.visitDate
      );

      data.append(
        'cgpa',
        formData.cgpa
      );

      data.append(
        'branches',
        formData.visibility === 'department'
          ? userDept
          : 'All'
      );

      data.append(
        'visibility',
        formData.visibility
      );

      if (jdFile) {
        data.append('jdFile', jdFile);
      }

      const profileString =
        localStorage.getItem('profile');

      const token = profileString
        ? JSON.parse(profileString).token
        : null;

      const response = await axios.post(
        `${API}/api/department-coordinator/drive`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (
        response.data.success ||
        response.status === 201
      ) {
        toast.success(
          'Placement drive posted successfully!'
        );

        if (onDrivePosted) {
          await onDrivePosted();
        }

        onClose();
      }
    } catch (error) {
      console.error(
        'Post Drive Error:',
        error
      );

      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to post drive.'
      );
    } finally {
      setSaving(false);
    }
  };


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
        initial={{
          opacity: 0,
          scale: 0.92,
          y: 16
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0
        }}
        exit={{
          opacity: 0,
          scale: 0.92,
          y: 16
        }}
      >
        <div className="pe-header">
          <div className="pe-header-left">
            <div
              className="pe-avatar-big"
              style={{
                background:
                  'linear-gradient(135deg,#6366f1,#8b5cf6)'
              }}
            >
              <Building
                size={24}
                color="#fff"
              />
            </div>

            <div>
              <h2 className="pe-title">
                Post Placement Drive
              </h2>

              <p className="pe-subtitle">
                Target {userDept} or all departments
              </p>
            </div>
          </div>

          <button
            className="pe-close"
            onClick={onClose}
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>


        <div
          className="pe-body"
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2, minmax(0, 1fr))',
            gap: '16px'
          }}
        >
          <div
            className="pe-field"
            style={{
              gridColumn: 'span 2'
            }}
          >
            <label className="pe-label">
              Company Name *
            </label>

            <input
              className="pe-input"
              placeholder="e.g. TechNova"
              value={formData.name}
              onChange={e =>
                updateField(
                  'name',
                  e.target.value
                )
              }
            />
          </div>


          <div className="pe-field">
            <label className="pe-label">
              Job Role *
            </label>

            <input
              className="pe-input"
              placeholder="Software Engineer"
              value={formData.jobRole}
              onChange={e =>
                updateField(
                  'jobRole',
                  e.target.value
                )
              }
            />
          </div>


          <div className="pe-field">
            <label className="pe-label">
              Package (CTC) *
            </label>

            <input
              className="pe-input"
              placeholder="e.g. 8 LPA"
              value={formData.ctc}
              onChange={e =>
                updateField(
                  'ctc',
                  e.target.value
                )
              }
            />
          </div>


          <div className="pe-field">
            <label className="pe-label">
              Date of Visit *
            </label>

            <input
              className="pe-input"
              type="date"
              value={formData.visitDate}
              onChange={e =>
                updateField(
                  'visitDate',
                  e.target.value
                )
              }
            />
          </div>


          <div className="pe-field">
            <label className="pe-label">
              Minimum CGPA *
            </label>

            <input
              className="pe-input"
              type="number"
              min="0"
              max="10"
              step="0.1"
              placeholder="7.5"
              value={formData.cgpa}
              onChange={e =>
                updateField(
                  'cgpa',
                  e.target.value
                )
              }
            />
          </div>


          <div
            className="pe-field"
            style={{
              gridColumn: 'span 2'
            }}
          >
            <label className="pe-label">
              Eligible Branches
            </label>

            <input
              className="pe-input"
              value={formData.branches}
              disabled={
                formData.visibility ===
                'department'
              }
              onChange={e =>
                updateField(
                  'branches',
                  e.target.value
                )
              }
            />
          </div>


          <div
            className="pe-field"
            style={{
              gridColumn: 'span 2'
            }}
          >
            <label className="pe-label">
              Drive Visibility
            </label>

            <div className="visibility-options">
              <label className="visibility-option">
                <input
                  type="radio"
                  name="visibility"
                  value="department"
                  checked={
                    formData.visibility ===
                    'department'
                  }
                  onChange={() =>
                    handleVisibilityChange(
                      'department'
                    )
                  }
                />

                <span>
                  My Department ({userDept})
                </span>
              </label>

              <label className="visibility-option">
                <input
                  type="radio"
                  name="visibility"
                  value="all"
                  checked={
                    formData.visibility === 'all'
                  }
                  onChange={() =>
                    handleVisibilityChange('all')
                  }
                />

                <span>
                  All Departments
                </span>
              </label>
            </div>
          </div>


          <div
            className="pe-field"
            style={{
              gridColumn: 'span 2'
            }}
          >
            <label className="pe-label">
              Job Description (PDF)
            </label>

            <div
              className={`pe-upload-zone ${
                jdFile
                  ? 'pe-upload-filled'
                  : ''
              }`}
              onClick={() =>
                fileRef.current?.click()
              }
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                style={{
                  display: 'none'
                }}
                onChange={handleFileChange}
              />

              <Upload
                size={24}
                className="pe-upload-icon"
              />

              <p className="pe-upload-title">
                {jdFile
                  ? jdFile.name
                  : 'Upload JD Document'}
              </p>

              <p className="pe-upload-sub">
                Click to browse • PDF • Max 5MB
              </p>
            </div>
          </div>
        </div>


        <div className="pe-footer">
          <button
            className="pe-btn-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            className="pe-btn-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? 'Posting...'
              : 'Post Drive'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};


// ============================================================
// APPLICANTS MODAL
// ============================================================

const ApplicantsModal = ({
  company,
  onClose,
  isDark
}) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const theme = isDark
    ? 'sd-dark'
    : 'sd-light';

  // The placement API may return either _id or id.
  // Always use the real placement-drive id for API calls.
  const companyId =
    company?._id ||
    company?.id;

  useEffect(() => {
    let cancelled = false;

    const fetchApplicants = async () => {
      if (!companyId) {
        console.error(
          'Applicants Error: Placement drive id is missing.',
          company
        );
        setApplicants([]);
        setLoading(false);
        toast.error('Unable to identify this placement drive.');
        return;
      }

      try {
        setLoading(true);
        setApplicants([]);

        const profileString =
          localStorage.getItem('profile');

        const token = profileString
          ? JSON.parse(profileString).token
          : null;

        if (!token) {
          throw new Error('Authentication token not found.');
        }

        const response = await axios.get(
          `${API}/api/placements/${companyId}/applicants`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (cancelled) return;

        if (response.data?.success) {
          setApplicants(
            response.data.data ||
            response.data.applicants ||
            []
          );
        } else {
          throw new Error(
            response.data?.error ||
            response.data?.message ||
            'Failed to load applicants.'
          );
        }
      } catch (error) {
        if (cancelled) return;

        console.error(
          'Fetch Applicants Error:',
          error
        );

        toast.error(
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          'Failed to load applicants.'
        );

        setApplicants([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchApplicants();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const handleStatusChange = async (
    studentId,
    newStatus
  ) => {
    if (!companyId || !studentId) {
      toast.error('Unable to update applicant status.');
      return;
    }

    try {
      setUpdatingId(studentId);

      const profileString =
        localStorage.getItem('profile');

      const token = profileString
        ? JSON.parse(profileString).token
        : null;

      const response = await axios.put(
        `${API}/api/placements/${companyId}/applicant/${studentId}/status`,
        {
          status: newStatus
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data?.success) {
        toast.success(
          'Applicant status updated.'
        );

        setApplicants(prev =>
          prev.map(applicant =>
            applicant._id === studentId ||
            applicant.id === studentId
              ? {
                  ...applicant,
                  status: newStatus
                }
              : applicant
          )
        );
      } else {
        throw new Error(
          response.data?.error ||
          response.data?.message ||
          'Failed to update applicant status.'
        );
      }
    } catch (error) {
      console.error(
        'Update Applicant Status Error:',
        error
      );

      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to update applicant status.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

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
        className={`pe-modal applicants-modal ${theme}`}
        initial={{
          opacity: 0,
          scale: 0.92,
          y: 16
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0
        }}
        exit={{
          opacity: 0,
          scale: 0.92,
          y: 16
        }}
      >
        <div className="pe-header">
          <div className="pe-header-left">
            <div
              className="pe-avatar-big"
              style={{
                background:
                  'linear-gradient(135deg,#6366f1,#8b5cf6)'
              }}
            >
              <Users
                size={23}
                color="#fff"
              />
            </div>

            <div>
              <h2 className="pe-title">
                {company?.name || 'Company'} Applicants
              </h2>

              <p className="pe-subtitle">
                Manage applicants for{' '}
                {company?.jobRole || 'this drive'}
              </p>
            </div>
          </div>

          <button
            className="pe-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="pe-body applicants-body">
          {loading ? (
            <div className="modal-state">
              <RefreshCw
                size={22}
                className="spin"
              />

              <p>
                Loading applicants...
              </p>
            </div>
          ) : applicants.length === 0 ? (
            <div className="modal-state">
              <Users size={30} />

              <h3>
                No applicants yet
              </h3>

              <p>
                Students who apply for this
                drive will appear here.
              </p>
            </div>
          ) : (
            <div className="applicants-list">
              {applicants.map(applicant => {
                const applicantId =
                  applicant._id ||
                  applicant.id;

                return (
                  <motion.div
                    key={applicantId}
                    className="applicant-row"
                    initial={{
                      opacity: 0,
                      y: 8
                    }}
                    animate={{
                      opacity: 1,
                      y: 0
                    }}
                  >
                    <div className="applicant-info">
                      <div className="applicant-avatar">
                        {(
                          applicant.username ||
                          'S'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h4>
                          {applicant.username ||
                            'Student'}
                        </h4>

                        <p>
                          {applicant.usn ||
                            'USN not available'}
                        </p>

                        <p>
                          {applicant.department ||
                            'N/A'}
                          {' • '}
                          {applicant.cgpa || 0}
                          {' CGPA'}
                          {' • '}
                          {applicant.email ||
                            'No email'}
                        </p>

                        {applicant.resumeUrl && (
                          <a
                            href={`${API}/${String(
                              applicant.resumeUrl
                            ).replace(/^\/+/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="resume-link"
                          >
                            <FileText
                              size={13}
                            />
                            View Resume
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="applicant-action">
                      <select
                        value={
                          applicant.status ||
                          'Applied'
                        }
                        disabled={
                          updatingId === applicantId
                        }
                        onChange={e =>
                          handleStatusChange(
                            applicantId,
                            e.target.value
                          )
                        }
                        className="status-select"
                      >
                        <option value="Applied">
                          Applied
                        </option>

                        <option value="Interviewing">
                          Interviewing
                        </option>

                        <option value="Placed">
                          Placed
                        </option>

                        <option value="Rejected">
                          Rejected
                        </option>
                      </select>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};


// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function DepartmentCoordinatorDashboard() {
  const [activeTab, setActiveTab] =
    useState('overview');

  const [isDark, setIsDark] =
    useState(false);

  const { user, logout } =
    useAuth();

  const [isPostModalOpen, setIsPostModalOpen] =
    useState(false);

  const [selectedCompany, setSelectedCompany] =
    useState(null);

  const [analytics, setAnalytics] =
    useState(null);

  const [search, setSearch] =
    useState('');

  const [minCgpa, setMinCgpa] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);


  const userDept =
    user?.result?.department || '—';

  const username =
    user?.result?.username ||
    'Coordinator';
const [companies, setCompanies] = useState([]);

  // ==========================================================
  // FETCH DEPARTMENT DATA
  // ==========================================================


  const fetchCompanies = async () => {
  try {
    const profileString = localStorage.getItem('profile');
    const token = profileString
      ? JSON.parse(profileString).token
      : null;

    const res = await axios.get(`${API}/api/placements`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.data.success) {
      setCompanies(res.data.data || []);
    }
  } catch (err) {
    console.error('Fetch Placement Drives Error:', err);
  }
};
  const fetchData = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const profileString =
        localStorage.getItem('profile');

      const token = profileString
        ? JSON.parse(profileString).token
        : null;

      const response = await axios.get(
        `${API}/api/department-coordinator/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error(
          'Unable to load department data.'
        );
      }

      setAnalytics(
        response.data.data || null
      );

      setLoadError(false);
    } catch (error) {
      console.error(
        'Department Analytics Error:',
        error
      );

      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    fetchData();
     fetchCompanies();
  }, []);


  // ==========================================================
  // DATA
  // ==========================================================

const studentsList = analytics?.students || [];

// Placement drives returned from /api/placements
const departmentDrives = (companies || []).filter((drive) => {
  if (!drive) return false;

  const department = String(userDept || "")
    .trim()
    .toUpperCase();

  // Normalize any value into an array
  const normalizeBranches = (value) => {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item).trim().toUpperCase())
        .filter(Boolean);
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
    }

    return [];
  };

  // Check if drive is visible to all departments
  const visibility = String(drive.visibility || "")
    .trim()
    .toLowerCase();

  if (
    visibility === "all" ||
    visibility === "campus-wide" ||
    visibility === "campuswide"
  ) {
    return true;
  }

  // Get departments/branches from all possible fields
  const targetDepartments = normalizeBranches(
    drive.targetDepartment
  );

  const eligibilityBranches = normalizeBranches(
    drive.eligibilityCriteria?.branches
  );

  const branches = normalizeBranches(drive.branches);

  const eligibleBranches = normalizeBranches(
    drive.eligibleBranches
  );

  // Combine everything
  const allowedDepartments = [
    ...targetDepartments,
    ...eligibilityBranches,
    ...branches,
    ...eligibleBranches,
  ];

  // Also support "All"
  if (
    allowedDepartments.includes("ALL") ||
    allowedDepartments.includes("ALL DEPARTMENTS")
  ) {
    return true;
  }

  // Show only drives applicable to this coordinator's department
  return allowedDepartments.includes(department);
});

const filteredStudents = studentsList.filter((student) => {
  const searchText = String(search || '').trim().toLowerCase();

  const studentText = [
    student.username,
    student.usn,
    student.email,
    student.department
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const matchesSearch =
    !searchText || studentText.includes(searchText);

  const studentCgpa = Number(student.cgpa) || 0;
  const requiredCgpa = Number(minCgpa) || 0;

  const matchesCgpa = studentCgpa >= requiredCgpa;

  return matchesSearch && matchesCgpa;
});

const totalStudents =
  Number(analytics?.totalStudents) || 0;

const placedStudents =
  Number(analytics?.placedStudents) || 0;

const placementRate =
  Number(analytics?.placementRate) || 0;

const activeDrives =
  Number(analytics?.activeDrives) || departmentDrives.length || 0;

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard
    },

    {
      id: 'drives',
      label: 'Department Drives',
      icon: Briefcase
    },

    {
      id: 'students',
      label: 'Department Students',
      icon: Users
    }
  ];


  // ==========================================================
  // THEME
  // ==========================================================

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };


  const theme =
    isDark
      ? 'sd-dark'
      : 'sd-light';


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className={`sd-root ${theme}`}
    >
      <style>
        {STYLES}
      </style>


      {/* ======================================================
          POST DRIVE MODAL
      ====================================================== */}

      {isPostModalOpen && (
        <PostDriveModal
  onClose={() => setIsPostModalOpen(false)}
  isDark={isDark}
  onDrivePosted={fetchCompanies}
  userDept={userDept}
/>
      )}


      {/* ======================================================
          APPLICANTS MODAL
      ====================================================== */}

      {selectedCompany && (
        <ApplicantsModal
          company={selectedCompany}
          onClose={() =>
            setSelectedCompany(null)
          }
          isDark={isDark}
        />
      )}


      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sd-sidebar">

        <div className="sd-logo">
          <div className="sd-logo-icon">
            C
          </div>

          <span className="sd-logo-text">
            CampusConnect
          </span>
        </div>


        <div className="sd-avatar-wrap">
          <div className="sd-avatar">
            DC
          </div>

          <div className="sd-avatar-info">
            <p className="sd-avatar-name">
              {username}
            </p>

            <p className="sd-avatar-role">
              Dept Coordinator • {userDept}
            </p>
          </div>
        </div>


        <nav className="sd-nav">
          {navItems.map(
            ({
              id,
              label,
              icon: Icon
            }) => (
              <button
                key={id}
                onClick={() =>
                  setActiveTab(id)
                }
                className={`sd-nav-item ${
                  activeTab === id
                    ? 'sd-nav-active'
                    : ''
                }`}
              >
                <Icon size={18} />

                <span>
                  {label}
                </span>

                {activeTab === id && (
                  <div className="sd-nav-indicator" />
                )}
              </button>
            )
          )}
        </nav>


        <div className="sd-sidebar-spacer" />


        <button
          className="sd-logout-btn"
          onClick={logout}
        >
          <LogOut size={16} />

          <span>
            Logout
          </span>
        </button>
      </aside>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="sd-main">

        {/* TOP BAR */}

        <header className="sd-topbar">

          <div>
            <p className="sd-topbar-greeting">
              Good Morning, {username} 👋
            </p>

            <h1 className="sd-topbar-title">
              Department: {userDept}
            </h1>
          </div>


          <div className="sd-topbar-actions">

            <span className="sd-active-indicator">
              <span className="active-dot" />
              Active
            </span>

            <ThemeToggle
              isDark={isDark}
              onToggle={toggleTheme}
            />

            <button
              className="sd-topbar-bell"
              onClick={() =>
                fetchData(true)
              }
              title="Refresh dashboard"
            >
              <RefreshCw
                size={18}
                className={
                  refreshing
                    ? 'spin'
                    : ''
                }
              />
            </button>
          </div>
        </header>


        {/* CONTENT */}

        <div className="sd-content">

          <AnimatePresence mode="wait">

            {/* =================================================
                OVERVIEW
            ================================================= */}

            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{
                  opacity: 0,
                  y: 12
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: -12
                }}
                className="sd-section"
              >

                {/* HERO */}

                <div className="sd-hero">

                  <div className="sd-hero-glow sd-hero-glow-1" />

                  <div className="sd-hero-glow sd-hero-glow-2" />

                  <div className="sd-hero-content">

                    <span className="sd-hero-chip">
                      <Building size={12} />

                      {userDept}
                      {' '}
                      Department Portal
                    </span>


                    <h2 className="sd-hero-heading">
                      Welcome back,
                      <br />

                      <em>
                        {username
                          .split(' ')[0]}
                        !
                      </em>
                    </h2>


                    <p className="sd-hero-sub">
                      Manage department
                      placement drives,
                      monitor student
                      performance, and
                      review placement
                      applications.
                    </p>
                  </div>


                  <div className="sd-hero-side">
                    <div className="hero-side-icon">
                      <GraduationCap
                        size={42}
                      />
                    </div>

                    <span>
                      Department
                      Placement
                    </span>
                  </div>
                </div>


                {/* STATS */}

                {loading ? (
                  <div className="loading-card">
                    <RefreshCw
                      size={20}
                      className="spin"
                    />

                    <span>
                      Loading department
                      analytics...
                    </span>
                  </div>
                ) : loadError ? (
                  <div className="error-card">
                    <p>
                      Unable to load
                      department data.
                    </p>

                    <button
                      className="retry-btn"
                      onClick={() =>
                        fetchData()
                      }
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="sd-stats-row">

                    <StatCard
                      icon={Briefcase}
                      label="Active Drives"
                      value={activeDrives}
                      gradient="linear-gradient(135deg,#6366f1,#8b5cf6)"
                      delay={0.05}
                    />

                    <StatCard
                      icon={Users}
                      label="Branch Students"
                      value={totalStudents}
                      gradient="linear-gradient(135deg,#10b981,#059669)"
                      delay={0.1}
                    />

                    <StatCard
                      icon={GraduationCap}
                      label="Placed Students"
                      value={placedStudents}
                      gradient="linear-gradient(135deg,#3b82f6,#1d4ed8)"
                      delay={0.15}
                    />

                    <StatCard
                      icon={Activity}
                      label="Placement Rate"
                      value={placementRate}
                      gradient="linear-gradient(135deg,#f59e0b,#d97706)"
                      delay={0.2}
                    />

                  </div>
                )}


                {/* TWO COLUMN */}

                <div className="sd-two-col">

                  {/* RECENT DRIVES */}

                  <div className="sd-card">

                    <div className="sd-card-header">
                      <div
                        className="sd-card-icon"
                        style={{
                          '--icon-color':
                            '#6366f1'
                        }}
                      >
                        <Briefcase
                          size={17}
                        />
                      </div>

                      <div>
                        <h3 className="sd-card-title">
                          Recent Drives
                        </h3>

                        <p className="sd-card-sub">
                          Placement drives
                          available to your
                          department
                        </p>
                      </div>
                    </div>


                    {departmentDrives.length === 0 ? (
                      <div className="empty-mini-state">
                        <Briefcase
                          size={25}
                        />

                        <p>
                          No drives available
                          right now.
                        </p>
                      </div>
                    ) : (
                      departmentDrives
                        .slice(0, 5)
                        .map(
                          (
                            company,
                            index
                          ) => (
                            <div
                              className="sd-mini-row"
                              key={
                                company._id ||
                                index
                              }
                            >
                              <div className="sd-mini-dot">
                                {(
                                  company.name ||
                                  'C'
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="sd-mini-body">
                                <p className="sd-mini-title">
                                  {
                                    company.name
                                  }{' '}
                                  -{' '}
                                  {
                                    company.jobRole
                                  }
                                </p>

                                <p className="sd-mini-sub">
                                  {
                                    company.ctc
                                  }
                                  {' • '}
                                  Min CGPA:{' '}
                                  {
                                    company
                                      .eligibilityCriteria
                                      ?.cgpa ||
                                    0
                                  }
                                </p>
                              </div>

                              <StatusBadge
                                status={
                                  company.visitStatus
                                }
                              />
                            </div>
                          )
                        )
                    )}

                  </div>


                  {/* QUICK ACTIONS */}

                  <div className="sd-card">

                    <div className="sd-card-header">
                      <div
                        className="sd-card-icon"
                        style={{
                          '--icon-color':
                            '#10b981'
                        }}
                      >
                        <Activity
                          size={17}
                        />
                      </div>

                      <div>
                        <h3 className="sd-card-title">
                          Quick Actions
                        </h3>

                        <p className="sd-card-sub">
                          Department
                          administration
                        </p>
                      </div>
                    </div>


                    <button
                      className="quick-action primary"
                      onClick={() =>
                        setIsPostModalOpen(
                          true
                        )
                      }
                    >
                      <Plus size={17} />

                      <div>
                        <strong>
                          Post New Drive
                        </strong>

                        <span>
                          Create a placement
                          opportunity
                        </span>
                      </div>
                    </button>


                    <button
                      className="quick-action secondary"
                      onClick={() =>
                        setActiveTab(
                          'students'
                        )
                      }
                    >
                      <Users size={17} />

                      <div>
                        <strong>
                          View Students
                        </strong>

                        <span>
                          Check department
                          student profiles
                        </span>
                      </div>
                    </button>


                    <button
                      className="quick-action tertiary"
                      onClick={() =>
                        setActiveTab(
                          'drives'
                        )
                      }
                    >
                      <Briefcase
                        size={17}
                      />

                      <div>
                        <strong>
                          View Drives
                        </strong>

                        <span>
                          Manage placement
                          drives
                        </span>
                      </div>
                    </button>

                  </div>

                </div>

              </motion.div>
            )}


            {/* =================================================
                DEPARTMENT DRIVES
            ================================================= */}

            {activeTab === 'drives' && (
              <motion.div
                key="drives"
                initial={{
                  opacity: 0,
                  y: 12
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: -12
                }}
                className="sd-section"
              >

                <div className="page-heading-row">

                  <div>
                    <h2 className="page-title">
                      Department Placement
                      Drives
                    </h2>

                    <p className="page-subtitle">
                      Drives available to{' '}
                      <strong>
                        {userDept}
                      </strong>{' '}
                      students
                    </p>
                  </div>


                  <button
                    className="pe-btn-save"
                    onClick={() =>
                      setIsPostModalOpen(
                        true
                      )
                    }
                  >
                    <Plus size={16} />

                    Post Drive
                  </button>

                </div>


                {departmentDrives.length === 0 ? (
                  <div className="empty-large-card">

                    <div className="empty-large-icon">
                      <Briefcase
                        size={32}
                      />
                    </div>

                    <h3>
                      No placement drives
                    </h3>

                    <p>
                      No drives are currently
                      available for your
                      department.
                    </p>

                    <button
                      className="pe-btn-save"
                      onClick={() =>
                        setIsPostModalOpen(
                          true
                        )
                      }
                    >
                      <Plus size={16} />
                      Post First Drive
                    </button>

                  </div>
                ) : (
                  <div className="drive-grid">

                    {departmentDrives.map(
                      (
                        company,
                        index
                      ) => (
                        <motion.div
                          key={
                            company._id ||
                            company.id ||
                            index
                          }
                          className="sd-card drive-card"
                          initial={{
                            opacity: 0,
                            y: 15
                          }}
                          animate={{
                            opacity: 1,
                            y: 0
                          }}
                          transition={{
                            delay:
                              index * 0.04
                          }}
                        >

                          <div className="drive-card-header">

                            <div className="company-avatar">
                              {(
                                company.name ||
                                'C'
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>


                            <div className="company-heading">
                              <h3>
                                {
                                  company.name
                                }
                              </h3>

                              <p>
                                {
                                  company.jobRole
                                }
                              </p>
                            </div>


                            <StatusBadge
                              status={
                                company.visitStatus
                              }
                            />

                          </div>


                          <div className="drive-details">

                            <div className="detail-item">
                              <Briefcase
                                size={14}
                              />

                              <span>
                                <strong>
                                  Package
                                </strong>

                                {
                                  company.ctc ||
                                  'N/A'
                                }
                              </span>
                            </div>


                            <div className="detail-item">
                              <GraduationCap
                                size={14}
                              />

                              <span>
                                <strong>
                                  Minimum CGPA
                                </strong>

                                {
                                  company
                                    .eligibilityCriteria
                                    ?.cgpa ||
                                  0
                                }
                              </span>
                            </div>


                            <div className="detail-item">
                              <Users
                                size={14}
                              />

                              <span>
                                <strong>
                                  Branches
                                </strong>

                                {
                                  company
                                    .eligibilityCriteria
                                    ?.branches
                                    ?.join(', ') ||
                                  'All'
                                }
                              </span>
                            </div>


                            <div className="detail-item">
                              <Calendar
                                size={14}
                              />

                              <span>
                                <strong>
                                  Visit Date
                                </strong>

                                {company.visitDate
                                  ? new Date(
                                      company.visitDate
                                    ).toLocaleDateString()
                                  : 'N/A'}
                              </span>
                            </div>

                          </div>


                          {company
                            .jobDescription
                            ?.url && (
                            <a
                              href={`${API}/${company.jobDescription.url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="resume-link drive-jd-link"
                            >
                              <FileText
                                size={14}
                              />

                              View Job
                              Description
                            </a>
                          )}


                          <button
                            className="manage-applicants-btn"
                            onClick={() =>
                              setSelectedCompany({
                                ...company,
                                _id:
                                  company._id ||
                                  company.id
                              })
                            }
                          >
                            <UserCheck
                              size={16}
                            />

                            Manage Applicants
                          </button>

                        </motion.div>
                      )
                    )}

                  </div>
                )}

              </motion.div>
            )}


            {/* =================================================
                DEPARTMENT STUDENTS
            ================================================= */}

            {activeTab === 'students' && (
              <motion.div
                key="students"
                initial={{
                  opacity: 0,
                  y: 12
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: -12
                }}
                className="sd-section"
              >

                <div className="page-heading-row">

                  <div>
                    <h2 className="page-title">
                      Department Students
                    </h2>

                    <p className="page-subtitle">
                      Monitor student profiles,
                      academic metrics and
                      placement progress
                    </p>
                  </div>

                  <div className="student-count-pill">
                    <Users size={14} />

                    {filteredStudents.length}
                    {' '}
                    Students
                  </div>

                </div>


                {/* FILTERS */}

                <div className="student-filter-card">

                  <div className="filter-field search-filter">
                    <label>
                      Search Student
                    </label>

                    <div className="search-box">
                      <Search
                        size={16}
                      />

                      <input
                        value={search}
                        onChange={e =>
                          setSearch(
                            e.target.value
                          )
                        }
                        placeholder="Name, USN or email..."
                      />

                      {search && (
                        <button
                          onClick={() =>
                            setSearch('')
                          }
                          className="clear-search"
                        >
                          <X
                            size={14}
                          />
                        </button>
                      )}
                    </div>
                  </div>


                  <div className="filter-field">
                    <label>
                      Minimum CGPA
                    </label>

                    <input
                      className="pe-input"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      placeholder="e.g. 7.0"
                      value={minCgpa}
                      onChange={e =>
                        setMinCgpa(
                          e.target.value
                        )
                      }
                    />
                  </div>


                  <button
                    className="filter-reset"
                    onClick={() => {
                      setSearch('');
                      setMinCgpa('');
                    }}
                  >
                    <RefreshCw
                      size={15}
                    />

                    Reset
                  </button>

                </div>


                {/* STUDENT TABLE */}

                <div className="sd-card table-card">

                  <div className="table-scroll">

                    <table className="sd-table">

                      <thead>
                        <tr>
                          <th>
                            Name & USN
                          </th>

                          <th>
                            Department
                          </th>

                          <th>
                            CGPA
                          </th>

                          <th>
                            Applications
                          </th>

                          <th>
                            Placement Status
                          </th>

                          <th>
                            Resume
                          </th>
                        </tr>
                      </thead>


                      <tbody>

                        {loading ? (
                          <tr>
                            <td
                              colSpan="6"
                              className="table-message"
                            >
                              <RefreshCw
                                size={18}
                                className="spin"
                              />

                              Loading
                              students...
                            </td>
                          </tr>
                        ) : loadError ? (
                          <tr>
                            <td
                              colSpan="6"
                              className="table-message error-text"
                            >
                              Unable to load
                              students.
                            </td>
                          </tr>
                        ) : filteredStudents.length === 0 ? (
                          <tr>
                            <td
                              colSpan="6"
                              className="table-message"
                            >
                             

                              <span>
                                No matching
                                students found.
                              </span>
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map(
                            (
                              student,
                              index
                            ) => {
                              const status =
                                student.placementStatus ||
                                student.status ||
                                'Unplaced';

                              const statusClass =
                                status ===
                                'Placed'
                                  ? 'sd-badge-emerald'
                                  : status ===
                                      'In Progress' ||
                                    status ===
                                      'Interviewing'
                                  ? 'sd-badge-blue'
                                  : 'sd-badge-default';

                              return (
                                <motion.tr
                                  key={
                                    student._id ||
                                    index
                                  }
                                  initial={{
                                    opacity: 0
                                  }}
                                  animate={{
                                    opacity: 1
                                  }}
                                >
                                  <td>
                                    <div className="student-name-cell">
                                      <div className="student-table-avatar">
                                        {(
                                          student.username ||
                                          'S'
                                        )
                                          .charAt(
                                            0
                                          )
                                          .toUpperCase()}
                                      </div>

                                      <div>
                                        <p className="student-name">
                                          {
                                            student.username
                                          }
                                        </p>

                                        <p className="student-usn">
                                          {
                                            student.usn
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  </td>


                                  <td>
                                    {
                                      student.department ||
                                      userDept
                                    }
                                  </td>


                                  <td>
                                    <span className="cgpa-value">
                                      {
                                        student.cgpa ||
                                        0
                                      }
                                    </span>
                                  </td>


                                  <td>
                                    {
                                      student.applicationCount ||
                                      student.totalApplied ||
                                      0
                                    }{' '}
                                    Drives
                                  </td>


                                  <td>
                                    <span
                                      className={`sd-status-badge ${statusClass}`}
                                    >
                                      <span className="sd-badge-dot" />

                                      {status}
                                    </span>
                                  </td>


                                  <td>
                                    {student.resumeUrl ? (
                                      <a
                                        href={`${API}/${student.resumeUrl}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="resume-link"
                                      >
                                        <FileText
                                          size={13}
                                        />

                                        View Resume
                                      </a>
                                    ) : (
                                      <span className="no-resume">
                                        Not Uploaded
                                      </span>
                                    )}
                                  </td>
                                </motion.tr>
                              );
                            }
                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}


// ============================================================
// STYLES
// ============================================================

const STYLES = `

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');


*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}


.sd-light {
  --bg: #f0f4ff;
  --bg-sidebar: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hov: #fafbff;
  --bg-input: #f8faff;

  --border: rgba(99,102,241,0.1);
  --border-hov: rgba(99,102,241,0.28);

  --text-head: #1e1b4b;
  --text-body: #1e293b;
  --text-sub: #475569;
  --text-muted: #64748b;
  --text-dim: #94a3b8;

  --accent: #6366f1;
  --accent-soft: rgba(99,102,241,0.08);
  --accent-text: #4f46e5;

  --topbar-bg: rgba(240,244,255,0.9);

  --hero-bg:
    linear-gradient(
      135deg,
      #ede9fe 0%,
      #dbeafe 100%
    );

  --hero-border: rgba(99,102,241,0.18);

  --nav-active-bg:
    rgba(99,102,241,0.1);
}


.sd-dark {
  --bg: #0d1117;
  --bg-sidebar: #0f1623;
  --bg-card: rgba(255,255,255,0.03);
  --bg-card-hov: rgba(255,255,255,0.05);
  --bg-input: rgba(255,255,255,0.04);

  --border: rgba(255,255,255,0.07);
  --border-hov: rgba(255,255,255,0.14);

  --text-head: #f1f5f9;
  --text-body: #e2e8f0;
  --text-sub: #94a3b8;
  --text-muted: #64748b;
  --text-dim: #475569;

  --accent: #6366f1;
  --accent-soft: rgba(99,102,241,0.12);
  --accent-text: #818cf8;

  --topbar-bg: rgba(13,17,23,0.85);

  --hero-bg:
    linear-gradient(
      135deg,
      #0f172a 0%,
      #1e1b4b 100%
    );

  --hero-border: rgba(99,102,241,0.2);

  --nav-active-bg:
    rgba(99,102,241,0.12);
}


.sd-root {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
  font-family: 'Inter', sans-serif;
  color: var(--text-body);
}


/* ============================================================
   SIDEBAR
============================================================ */

.sd-sidebar {
  width: 240px;
  flex-shrink: 0;

  background: var(--bg-sidebar);

  border-right:
    1px solid var(--border);

  display: flex;
  flex-direction: column;

  padding: 24px 16px;

  position: sticky;
  top: 0;

  height: 100vh;
}


.sd-logo {
  display: flex;
  align-items: center;
  gap: 10px;

  margin-bottom: 32px;
  padding: 0 8px;
}


.sd-logo-icon {
  width: 36px;
  height: 36px;

  border-radius: 10px;

  background:
    linear-gradient(
      135deg,
      #6366f1,
      #8b5cf6
    );

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 18px;
  font-weight: 800;

  color: #fff;
}


.sd-logo-text {
  font-size: 15px;
  font-weight: 700;

  color: var(--text-head);
}


.sd-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;

  background: var(--bg-card);

  border:
    1px solid var(--border);

  border-radius: 16px;

  padding: 12px;

  margin-bottom: 28px;
}


.sd-avatar {
  width: 40px;
  height: 40px;

  border-radius: 12px;

  background:
    linear-gradient(
      135deg,
      #6366f1,
      #8b5cf6
    );

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 14px;
  font-weight: 700;

  color: #fff;

  flex-shrink: 0;
}


.sd-avatar-info {
  min-width: 0;
}


.sd-avatar-name {
  font-size: 13px;
  font-weight: 600;

  color: var(--text-head);

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.sd-avatar-role {
  font-size: 11px;
  color: var(--text-muted);

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.sd-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}


.sd-nav-item {
  position: relative;

  display: flex;
  align-items: center;
  gap: 10px;

  padding: 10px 12px;

  border-radius: 12px;
  border: none;

  background: transparent;

  color: var(--text-muted);

  font-size: 13.5px;
  font-weight: 500;

  cursor: pointer;

  text-align: left;

  width: 100%;

  transition:
    background 0.2s,
    color 0.2s,
    transform 0.2s;
}


.sd-nav-item:hover {
  background: var(--accent-soft);
  color: var(--accent-text);

  transform: translateX(2px);
}


.sd-nav-active {
  background:
    var(--nav-active-bg) !important;

  color:
    var(--accent-text) !important;

  font-weight: 600;
}


.sd-nav-indicator {
  position: absolute;

  right: 0;
  top: 50%;

  transform:
    translateY(-50%);

  width: 3px;
  height: 18px;

  border-radius: 99px;

  background:
    linear-gradient(
      135deg,
      #6366f1,
      #8b5cf6
    );
}


.sd-sidebar-spacer {
  flex: 1;
}


.sd-logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 10px 12px;

  border-radius: 12px;

  border:
    1px solid
    rgba(248,113,113,0.25);

  background:
    rgba(248,113,113,0.06);

  color: #f87171;

  font-size: 13px;
  font-weight: 500;

  cursor: pointer;

  width: 100%;

  transition:
    background 0.2s,
    transform 0.2s;
}


.sd-logout-btn:hover {
  background:
    rgba(248,113,113,0.12);

  transform: translateY(-1px);
}


/* ============================================================
   MAIN
============================================================ */

.sd-main {
  flex: 1;

  display: flex;
  flex-direction: column;

  min-width: 0;
}


.sd-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 18px 32px;

  border-bottom:
    1px solid var(--border);

  background:
    var(--topbar-bg);

  backdrop-filter: blur(12px);

  position: sticky;
  top: 0;

  z-index: 10;
}


.sd-topbar-greeting {
  font-size: 12px;
  color: var(--text-muted);

  margin-bottom: 2px;
}


.sd-topbar-title {
  font-size: 20px;
  font-weight: 700;

  color: var(--text-head);
}


.sd-topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}


.sd-active-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  color: #10b981;

  font-size: 12px;
  font-weight: 600;
}


.active-dot {
  width: 7px;
  height: 7px;

  border-radius: 50%;

  background: #10b981;

  box-shadow:
    0 0 0 4px
    rgba(16,185,129,0.1);
}


.sd-topbar-bell {
  position: relative;

  width: 38px;
  height: 38px;

  border-radius: 10px;

  border:
    1px solid var(--border);

  background:
    var(--bg-card);

  display: flex;
  align-items: center;
  justify-content: center;

  color: var(--accent-text);

  cursor: pointer;

  transition:
    border-color 0.2s,
    transform 0.2s;
}


.sd-topbar-bell:hover {
  border-color:
    var(--border-hov);

  transform: translateY(-1px);
}


/* ============================================================
   THEME TOGGLE
============================================================ */

.sd-theme-toggle {
  display: flex;
  align-items: center;
  gap: 8px;

  background: none;
  border: none;

  cursor: pointer;
}


.sd-toggle-track {
  width: 50px;
  height: 26px;

  border-radius: 99px;

  position: relative;

  padding: 3px;

  border:
    1px solid var(--border);

  display: flex;
  align-items: center;
}


.sd-toggle-thumb {
  width: 20px;
  height: 20px;

  border-radius: 50%;

  background: #fff;

  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow:
    0 2px 5px
    rgba(0,0,0,0.12);
}


.sd-toggle-label {
  font-size: 11px;
  font-weight: 600;

  color: var(--text-muted);
}


/* ============================================================
   CONTENT
============================================================ */

.sd-content {
  flex: 1;

  padding: 28px 32px;

  overflow-y: auto;
}


.sd-section {
  display: flex;
  flex-direction: column;
  gap: 22px;
}


/* ============================================================
   HERO
============================================================ */

.sd-hero {
  position: relative;

  overflow: hidden;

  border-radius: 24px;

  padding: 40px;

  background:
    var(--hero-bg);

  border:
    1px solid var(--hero-border);

  min-height: 220px;

  display: flex;
  align-items: center;

  justify-content: space-between;
}


.sd-hero-glow {
  position: absolute;

  border-radius: 50%;

  filter: blur(2px);

  pointer-events: none;
}


.sd-hero-glow-1 {
  width: 240px;
  height: 240px;

  right: -70px;
  top: -80px;

  background:
    rgba(99,102,241,0.12);
}


.sd-hero-glow-2 {
  width: 180px;
  height: 180px;

  right: 150px;
  bottom: -100px;

  background:
    rgba(14,165,233,0.08);
}


.sd-hero-content {
  position: relative;

  z-index: 2;

  max-width: 65%;
}


.sd-hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  padding: 5px 12px;

  border-radius: 99px;

  background:
    rgba(99,102,241,0.12);

  border:
    1px solid
    rgba(99,102,241,0.3);

  color:
    var(--accent-text);

  font-size: 11px;
  font-weight: 600;

  margin-bottom: 14px;
}


.sd-hero-heading {
  font-size: 34px;

  font-weight: 800;

  color: var(--text-head);

  line-height: 1.1;

  margin-bottom: 10px;
}


.sd-hero-heading em {
  font-style: normal;

  color:
    var(--accent-text);
}


.sd-hero-sub {
  font-size: 14px;

  color:
    var(--text-sub);

  line-height: 1.6;

  max-width: 650px;
}


.sd-hero-side {
  position: relative;

  z-index: 2;

  width: 140px;
  height: 140px;

  border-radius: 28px;

  background:
    rgba(255,255,255,0.18);

  border:
    1px solid
    rgba(99,102,241,0.16);

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 8px;

  color: var(--accent-text);

  backdrop-filter: blur(10px);
}


.hero-side-icon {
  width: 64px;
  height: 64px;

  border-radius: 20px;

  background:
    linear-gradient(
      135deg,
      #6366f1,
      #8b5cf6
    );

  color: #fff;

  display: flex;
  align-items: center;
  justify-content: center;
}


.sd-hero-side span {
  font-size: 10px;

  font-weight: 700;

  text-align: center;

  color: var(--text-sub);
}


/* ============================================================
   STATS
============================================================ */

.sd-stats-row {
  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 16px;
}


.sd-stat-card {
  position: relative;

  overflow: hidden;

  background:
    var(--bg-card);

  border:
    1px solid var(--border);

  border-radius: 20px;

  padding: 22px 20px;

  display: flex;
  align-items: center;

  gap: 16px;

  box-shadow:
    0 2px 10px
    rgba(0,0,0,0.02);
}


.sd-stat-icon-wrap {
  width: 48px;
  height: 48px;

  border-radius: 14px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #fff;

  flex-shrink: 0;
}


.sd-stat-body {
  flex: 1;

  position: relative;

  z-index: 2;
}


.sd-stat-value {
  display: block;

  font-size: 28px;

  font-weight: 800;

  color: var(--text-head);

  line-height: 1;
}


.sd-stat-label {
  display: block;

  font-size: 12px;

  color: var(--text-muted);

  margin-top: 6px;
}


.sd-stat-glow {
  position: absolute;

  right: -30px;
  bottom: -40px;

  width: 100px;
  height: 100px;

  border-radius: 50%;

  background:
    rgba(99,102,241,0.04);
}


/* ============================================================
   CARDS
============================================================ */

.sd-two-col {
  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: 20px;
}


.sd-card {
  background:
    var(--bg-card);

  border:
    1px solid var(--border);

  border-radius: 20px;

  padding: 22px;

  display: flex;
  flex-direction: column;

  gap: 16px;

  box-shadow:
    0 2px 10px
    rgba(0,0,0,0.02);
}


.sd-card-header {
  display: flex;

  align-items: center;

  gap: 12px;
}


.sd-card-icon {
  width: 38px;
  height: 38px;

  border-radius: 11px;

  background:
    var(--accent-soft);

  display: flex;

  align-items: center;
  justify-content: center;

  color:
    var(--icon-color);
}


.sd-card-title {
  font-size: 14px;

  font-weight: 700;

  color:
    var(--text-head);
}


.sd-card-sub {
  font-size: 11px;

  color:
    var(--text-dim);

  margin-top: 2px;
}


/* ============================================================
   MINI ROWS
============================================================ */

.sd-mini-row {
  display: flex;

  align-items: center;

  gap: 10px;

  padding: 10px 0;

  border-bottom:
    1px solid var(--border);
}


.sd-mini-row:last-child {
  border-bottom: none;
}


.sd-mini-dot {
  width: 32px;
  height: 32px;

  flex-shrink: 0;

  border-radius: 9px;

  display: flex;

  align-items: center;
  justify-content: center;

  font-size: 13px;

  font-weight: 700;

  color: #fff;

  background:
    linear-gradient(
      135deg,
      #6366f1,
      #8b5cf6
    );
}


.sd-mini-body {
  flex: 1;

  min-width: 0;
}


.sd-mini-title {
  font-size: 12.5px;

  font-weight: 600;

  color:
    var(--text-head);

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;
}


.sd-mini-sub {
  font-size: 11px;

  color:
    var(--text-muted);

  margin-top: 2px;
}


/* ============================================================
   STATUS BADGES
============================================================ */

.sd-status-badge {
  display: inline-flex;

  align-items: center;

  gap: 5px;

  padding: 4px 10px;

  border-radius: 99px;

  font-size: 11px;

  font-weight: 600;

  white-space: nowrap;
}


.sd-badge-dot {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background:
    currentColor;
}


.sd-badge-blue {
  background:
    rgba(96,165,250,0.1);

  color:
    #3b82f6;

  border:
    1px solid
    rgba(96,165,250,0.25);
}


.sd-badge-emerald {
  background:
    rgba(52,211,153,0.1);

  color:
    #059669;

  border:
    1px solid
    rgba(52,211,153,0.25);
}


.sd-badge-default {
  background:
    rgba(148,163,184,0.08);

  color:
    #64748b;

  border:
    1px solid
    rgba(148,163,184,0.2);
}


/* ============================================================
   QUICK ACTIONS
============================================================ */

.quick-action {
  width: 100%;

  display: flex;

  align-items: center;

  gap: 13px;

  padding: 13px 14px;

  border-radius: 13px;

  cursor: pointer;

  text-align: left;

  transition:
    transform 0.2s,
    border-color 0.2s,
    background 0.2s;
}


.quick-action:hover {
  transform:
    translateY(-2px);
}


.quick-action svg {
  flex-shrink: 0;
}


.quick-action div {
  display: flex;
  flex-direction: column;

  gap: 3px;
}


.quick-action strong {
  font-size: 12.5px;
}


.quick-action span {
  font-size: 10.5px;

  opacity: 0.7;
}


.quick-action.primary {
  border:
    1px dashed
    rgba(99,102,241,0.4);

  background:
    rgba(99,102,241,0.08);

  color:
    var(--accent-text);
}


.quick-action.secondary {
  border:
    1px dashed
    rgba(16,185,129,0.35);

  background:
    rgba(16,185,129,0.07);

  color:
    #059669;
}


.quick-action.tertiary {
  border:
    1px dashed
    rgba(245,158,11,0.35);

  background:
    rgba(245,158,11,0.07);

  color:
    #d97706;
}


/* ============================================================
   PAGE HEADINGS
============================================================ */

.page-heading-row {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;

  flex-wrap: wrap;
}


.page-title {
  font-size: 21px;

  font-weight: 800;

  color:
    var(--text-head);
}


.page-subtitle {
  margin-top: 5px;

  font-size: 13px;

  color:
    var(--text-muted);
}


.page-subtitle strong {
  color:
    var(--accent-text);
}


/* ============================================================
   DRIVE GRID
============================================================ */

.drive-grid {
  display: grid;

  grid-template-columns:
    repeat(
      auto-fill,
      minmax(310px, 1fr)
    );

  gap: 18px;
}


.drive-card {
  position: relative;

  transition:
    transform 0.2s,
    border-color 0.2s;
}


.drive-card:hover {
  transform:
    translateY(-3px);

  border-color:
    var(--border-hov);
}


.drive-card-header {
  display: flex;

  align-items: center;

  gap: 12px;
}


.company-avatar {
  width: 46px;
  height: 46px;

  border-radius: 13px;

  background:
    linear-gradient(
      135deg,
      #6366f1,
      #8b5cf6
    );

  display: flex;

  align-items: center;
  justify-content: center;

  color: #fff;

  font-size: 17px;

  font-weight: 800;

  flex-shrink: 0;
}


.company-heading {
  flex: 1;

  min-width: 0;
}


.company-heading h3 {
  font-size: 15px;

  font-weight: 700;

  color:
    var(--text-head);

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;
}


.company-heading p {
  font-size: 11px;

  color:
    var(--text-muted);

  margin-top: 3px;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;
}


.drive-details {
  display: flex;

  flex-direction: column;

  gap: 10px;

  padding-top: 4px;
}


.detail-item {
  display: flex;

  align-items: flex-start;

  gap: 9px;

  color:
    var(--text-muted);

  font-size: 12px;
}


.detail-item svg {
  color:
    var(--accent-text);

  margin-top: 1px;

  flex-shrink: 0;
}


.detail-item span {
  display: flex;

  gap: 5px;

  flex-wrap: wrap;
}


.detail-item strong {
  color:
    var(--text-sub);

  font-weight: 600;
}


.drive-jd-link {
  border-top:
    1px solid var(--border);

  padding-top: 12px;
}


.manage-applicants-btn {
  width: 100%;

  display: flex;

  align-items: center;
  justify-content: center;

  gap: 7px;

  padding: 10px 14px;

  border-radius: 10px;

  border: none;

  background:
    linear-gradient(
      135deg,
      #6366f1,
      #8b5cf6
    );

  color: #fff;

  font-size: 12px;

  font-weight: 600;

  cursor: pointer;

  transition:
    transform 0.2s,
    box-shadow 0.2s;
}


.manage-applicants-btn:hover {
  transform:
    translateY(-1px);

  box-shadow:
    0 8px 20px
    rgba(99,102,241,0.2);
}


/* ============================================================
   STUDENT FILTERS
============================================================ */

.student-filter-card {
  display: flex;

  align-items: flex-end;

  gap: 14px;

  padding: 16px;

  background:
    var(--bg-card);

  border:
    1px solid var(--border);

  border-radius: 16px;
}


.filter-field {
  display: flex;

  flex-direction: column;

  gap: 6px;

  min-width: 180px;
}


.filter-field label {
  font-size: 10.5px;

  font-weight: 700;

  color:
    var(--text-sub);

  text-transform: uppercase;

  letter-spacing: 0.04em;
}


.search-filter {
  flex: 1;
}


.search-box {
  min-height: 40px;

  display: flex;

  align-items: center;

  gap: 8px;

  padding: 0 12px;

  border:
    1px solid var(--border);

  border-radius: 11px;

  background:
    var(--bg-input);

  color:
    var(--text-muted);
}


.search-box input {
  width: 100%;

  border: none;
  outline: none;

  background: transparent;

  color:
    var(--text-head);

  font-size: 13px;
}


.search-box input::placeholder {
  color:
    var(--text-muted);
}


.clear-search {
  width: 22px;
  height: 22px;

  display: flex;

  align-items: center;
  justify-content: center;

  border: none;

  border-radius: 6px;

  background:
    var(--accent-soft);

  color:
    var(--accent-text);

  cursor: pointer;
}


.filter-reset {
  height: 40px;

  display: flex;

  align-items: center;

  gap: 6px;

  padding: 0 13px;

  border:
    1px solid var(--border);

  border-radius: 10px;

  background:
    var(--bg-input);

  color:
    var(--text-sub);

  font-size: 12px;

  font-weight: 600;

  cursor: pointer;
}


.filter-reset:hover {
  color:
    var(--accent-text);

  border-color:
    var(--border-hov);
}


.student-count-pill {
  display: inline-flex;

  align-items: center;

  gap: 6px;

  padding: 7px 11px;

  border-radius: 99px;

  background:
    var(--accent-soft);

  color:
    var(--accent-text);

  font-size: 11px;

  font-weight: 600;
}


/* ============================================================
   TABLE
============================================================ */

.table-card {
  padding: 0;

  overflow: hidden;
}


.table-scroll {
  width: 100%;

  overflow-x: auto;
}


.sd-table {
  width: 100%;

  min-width: 850px;

  border-collapse:
    collapse;

  text-align: left;

  font-size: 13px;
}


.sd-table th {
  padding: 14px 18px;

  background:
    var(--bg-card-hov);

  color:
    var(--text-muted);

  font-size: 10.5px;

  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.04em;

  border-bottom:
    1px solid var(--border);
}


.sd-table td {
  padding: 14px 18px;

  border-bottom:
    1px solid var(--border);

  color:
    var(--text-body);

  vertical-align: middle;
}


.sd-table tbody tr {
  transition:
    background 0.2s;
}


.sd-table tbody tr:hover {
  background:
    var(--bg-card-hov);
}


.student-name-cell {
  display: flex;

  align-items: center;

  gap: 10px;
}


.student-table-avatar {
  width: 34px;
  height: 34px;

  border-radius: 9px;

  display: flex;

  align-items: center;
  justify-content: center;

  background:
    linear-gradient(
      135deg,
      #6366f1,
      #8b5cf6
    );

  color: #fff;

  font-size: 12px;

  font-weight: 700;
}


.student-name {
  font-size: 12.5px;

  font-weight: 600;

  color:
    var(--text-head);
}


.student-usn {
  font-size: 10.5px;

  color:
    var(--text-muted);

  margin-top: 2px;
}


.cgpa-value {
  font-weight: 700;

  color:
    var(--text-head);
}


.resume-link {
  display: inline-flex;

  align-items: center;

  gap: 5px;

  color:
    var(--accent-text);

  text-decoration: none;

  font-size: 11.5px;

  font-weight: 600;
}


.resume-link:hover {
  text-decoration: underline;
}


.no-resume {
  color:
    var(--text-dim);

  font-size: 11px;
}


.table-message {
  height: 160px;

  text-align: center;

  color:
    var(--text-muted) !important;
}


.table-message > * {
  margin-right: 6px;
}


.error-text {
  color:
    #f87171 !important;
}


/* ============================================================
   EMPTY STATES
============================================================ */

.empty-mini-state {
  min-height: 120px;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  gap: 8px;

  color:
    var(--text-muted);

  font-size: 12px;
}


.empty-large-card {
  min-height: 320px;

  display: flex;

  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 12px;

  padding: 30px;

  background:
    var(--bg-card);

  border:
    1px solid var(--border);

  border-radius: 22px;

  text-align: center;

  color:
    var(--text-muted);
}


.empty-large-icon {
  width: 68px;
  height: 68px;

  border-radius: 20px;

  display: flex;

  align-items: center;
  justify-content: center;

  background:
    var(--accent-soft);

  color:
    var(--accent-text);
}


.empty-large-card h3 {
  color:
    var(--text-head);

  font-size: 17px;
}


.empty-large-card p {
  font-size: 12px;

  max-width: 350px;

  line-height: 1.6;
}


/* ============================================================
   LOADING / ERROR
============================================================ */

.loading-card,
.error-card {
  min-height: 100px;

  display: flex;

  align-items: center;
  justify-content: center;

  gap: 10px;

  border:
    1px solid var(--border);

  border-radius: 18px;

  background:
    var(--bg-card);

  color:
    var(--text-muted);

  font-size: 13px;
}


.error-card {
  flex-direction: column;

  color: #f87171;
}


.retry-btn {
  padding: 7px 13px;

  border:
    1px solid
    rgba(248,113,113,0.25);

  border-radius: 8px;

  background:
    rgba(248,113,113,0.08);

  color:
    #f87171;

  cursor: pointer;

  font-size: 11px;

  font-weight: 600;
}


/* ============================================================
   MODAL
============================================================ */

.pe-backdrop {
  position: fixed;

  inset: 0;

  z-index: 998;

  background:
    rgba(0,0,0,0.55);

  backdrop-filter:
    blur(4px);
}


.pe-modal {
  position: fixed;

  top: 50%;
  left: 50%;

  transform:
    translate(-50%, -50%) !important;

  z-index: 999;

  width: 92%;

  max-width: 650px;

  max-height: 90vh;

  overflow: hidden;

  border-radius: 24px;

  display: flex;

  flex-direction: column;

  font-family:
    'Inter',
    sans-serif;
}


.sd-dark .pe-modal {
  background:
    #131929;

  border:
    1px solid
    rgba(255,255,255,0.08);
}


.sd-light .pe-modal {
  background:
    #ffffff;

  border:
    1px solid
    rgba(99,102,241,0.15);
}


.applicants-modal {
  max-width: 850px;
}


.pe-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 22px 24px 16px;

  border-bottom:
    1px solid var(--border);
}


.pe-header-left {
  display: flex;

  align-items: center;

  gap: 14px;

  min-width: 0;
}


.pe-avatar-big {
  width: 48px;
  height: 48px;

  border-radius: 14px;

  display: flex;

  align-items: center;
  justify-content: center;

  flex-shrink: 0;
}


.pe-title {
  font-size: 18px;

  font-weight: 700;

  color:
    var(--text-head);
}


.pe-subtitle {
  font-size: 12px;

  color:
    var(--text-muted);

  margin-top: 3px;
}


.pe-close {
  width: 32px;
  height: 32px;

  border-radius: 8px;

  border:
    1px solid var(--border);

  background:
    var(--bg-card);

  display: flex;

  align-items: center;
  justify-content: center;

  color:
    var(--text-muted);

  cursor: pointer;

  flex-shrink: 0;
}


.pe-close:hover {
  color:
    var(--text-head);

  border-color:
    var(--border-hov);
}


.pe-body {
  flex: 1;

  overflow-y: auto;

  padding: 24px;
}


.pe-field {
  display: flex;

  flex-direction: column;

  gap: 6px;
}


.pe-label {
  font-size: 11px;

  font-weight: 700;

  color:
    var(--text-sub);

  text-transform: uppercase;

  letter-spacing: 0.03em;
}


.pe-input {
  min-height: 42px;

  padding: 10px 13px;

  border-radius: 11px;

  border:
    1px solid var(--border);

  background:
    var(--bg-input);

  color:
    var(--text-head);

  font-size: 13px;

  outline: none;

  width: 100%;

  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}


.pe-input:focus {
  border-color:
    var(--accent);

  box-shadow:
    0 0 0 3px
    var(--accent-soft);
}


.pe-input:disabled {
  opacity: 0.7;

  cursor: not-allowed;
}


.pe-input::placeholder {
  color:
    var(--text-muted);
}


.pe-footer {
  display: flex;

  gap: 10px;

  justify-content: flex-end;

  padding: 16px 24px;

  border-top:
    1px solid var(--border);
}


.pe-btn-cancel,
.pe-btn-save {
  min-height: 40px;

  padding: 9px 18px;

  border-radius: 10px;

  font-size: 12.5px;

  font-weight: 600;

  cursor: pointer;
}


.pe-btn-cancel {
  border:
    1px solid var(--border);

  background:
    transparent;

  color:
    var(--text-muted);
}


.pe-btn-save {
  border: none;

  background:
    linear-gradient(
      135deg,
      #6366f1,
      #8b5cf6
    );

  color: #fff;

  box-shadow:
    0 5px 14px
    rgba(99,102,241,0.15);

  display: inline-flex;    
  align-items: center;     
  justify-content: center; 
  gap: 8px;  
}


.pe-btn-save:hover {
  transform:
    translateY(-1px);
}


.pe-btn-save:disabled,
.pe-btn-cancel:disabled {
  opacity: 0.6;

  cursor: not-allowed;

  transform: none;
}


/* ============================================================
   UPLOAD
============================================================ */

.pe-upload-zone {
  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  gap: 7px;

  padding: 24px 20px;

  border-radius: 14px;

  border:
    2px dashed var(--border-hov);

  background:
    var(--bg-input);

  cursor: pointer;

  text-align: center;

  transition:
    border-color 0.2s,
    background 0.2s;
}


.pe-upload-zone:hover {
  border-color:
    var(--accent);

  background:
    var(--accent-soft);
}


.pe-upload-filled {
  border-color:
    var(--accent);

  background:
    var(--accent-soft);
}


.pe-upload-icon {
  color:
    var(--accent-text);
}


.pe-upload-title {
  font-size: 13px;

  font-weight: 600;

  color:
    var(--text-head);

  max-width: 100%;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;
}


.pe-upload-sub {
  font-size: 11px;

  color:
    var(--text-muted);
}


/* ============================================================
   VISIBILITY
============================================================ */

.visibility-options {
  display: flex;

  flex-wrap: wrap;

  gap: 12px;
}


.visibility-option {
  display: flex;

  align-items: center;

  gap: 7px;

  padding: 9px 12px;

  border:
    1px solid var(--border);

  border-radius: 10px;

  background:
    var(--bg-input);

  color:
    var(--text-sub);

  font-size: 12px;

  cursor: pointer;
}


.visibility-option:has(input:checked) {
  border-color:
    var(--accent);

  background:
    var(--accent-soft);

  color:
    var(--accent-text);
}


.visibility-option input {
  accent-color:
    var(--accent);
}


/* ============================================================
   APPLICANTS
============================================================ */

.applicants-body {
  min-height: 250px;
}


.applicants-list {
  display: flex;

  flex-direction: column;

  gap: 10px;
}


.applicant-row {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;

  padding: 14px;

  border:
    1px solid var(--border);

  border-radius: 14px;

  background:
    var(--bg-card);

  transition:
    border-color 0.2s,
    background 0.2s;
}


.applicant-row:hover {
  border-color:
    var(--border-hov);

  background:
    var(--bg-card-hov);
}


.applicant-info {
  display: flex;

  align-items: flex-start;

  gap: 11px;

  min-width: 0;
}


.applicant-avatar {
  width: 38px;
  height: 38px;

  border-radius: 11px;

  flex-shrink: 0;

  display: flex;

  align-items: center;
  justify-content: center;

  background:
    linear-gradient(
      135deg,
      #6366f1,
      #8b5cf6
    );

  color: #fff;

  font-size: 13px;

  font-weight: 700;
}


.applicant-info h4 {
  font-size: 13px;

  font-weight: 700;

  color:
    var(--text-head);

  margin-bottom: 3px;
}


.applicant-info p {
  font-size: 11px;

  color:
    var(--text-muted);

  margin-top: 2px;
}


.applicant-action {
  flex-shrink: 0;
}


.status-select {
  min-width: 140px;

  padding: 9px 11px;

  border-radius: 9px;

  border:
    1px solid var(--border);

  background:
    var(--bg-input);

  color:
    var(--text-head);

  font-size: 12px;

  outline: none;

  cursor: pointer;
}


.modal-state {
  min-height: 230px;

  display: flex;

  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 8px;

  color:
    var(--text-muted);

  text-align: center;
}


.modal-state h3 {
  color:
    var(--text-head);

  font-size: 15px;
}


.modal-state p {
  font-size: 12px;
}


/* ============================================================
   ANIMATIONS
============================================================ */

.spin {
  animation:
    spin 0.9s linear infinite;
}


@keyframes spin {
  from {
    transform:
      rotate(0deg);
  }

  to {
    transform:
      rotate(360deg);
  }
}


/* ============================================================
   RESPONSIVE
============================================================ */

@media (max-width: 1200px) {

  .sd-stats-row {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .sd-two-col {
    grid-template-columns:
      1fr;
  }

}


@media (max-width: 900px) {

  .sd-sidebar {
    width: 205px;
  }

  .sd-content {
    padding: 22px;
  }

  .sd-topbar {
    padding:
      16px 22px;
  }

  .sd-hero {
    padding: 30px;
  }

  .sd-hero-side {
    width: 110px;
    height: 110px;
  }

}


@media (max-width: 720px) {

  .sd-sidebar {
    display: none;
  }

  .sd-topbar {
    padding:
      15px 16px;
  }

  .sd-topbar-title {
    font-size: 17px;
  }

  .sd-active-indicator {
    display: none;
  }

  .sd-toggle-label {
    display: none;
  }

  .sd-content {
    padding: 16px;
  }

  .sd-hero {
    padding: 25px;

    min-height: 230px;
  }

  .sd-hero-content {
    max-width: 100%;
  }

  .sd-hero-side {
    display: none;
  }

  .sd-hero-heading {
    font-size: 28px;
  }

  .sd-stats-row {
    grid-template-columns:
      1fr;
  }

  .student-filter-card {
    flex-direction: column;

    align-items: stretch;
  }

  .filter-field {
    width: 100%;
  }

  .filter-reset {
    justify-content: center;
  }

  .page-heading-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-heading-row
  .pe-btn-save {
    width: 100%;
     display: flex;   
  }

  .drive-grid {
    grid-template-columns:
      1fr;
  }

  .pe-modal {
    width: 96%;

    max-height: 92vh;
  }

  .pe-body {
    padding: 18px;
  }

  .pe-footer {
    padding:
      14px 18px;
  }

}


@media (max-width: 560px) {

  .pe-body
  [style*="grid-template-columns"] {
    display: flex !important;

    flex-direction: column !important;
  }

  .pe-body
  [style*="grid-column"] {
    grid-column: auto !important;
  }

  .visibility-options {
    flex-direction: column;
  }

  .visibility-option {
    width: 100%;
  }

  .applicant-row {
    flex-direction: column;

    align-items: stretch;
  }

  .status-select {
    width: 100%;
  }

  .applicant-action {
    width: 100%;
  }

  .sd-topbar-actions {
    gap: 7px;
  }

  .sd-topbar-greeting {
    display: none;
  }

}

`;
