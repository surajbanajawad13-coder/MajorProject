import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  BookOpen, 
  Briefcase, 
  Calendar, 
  Award, 
  CheckCircle, 
  Clock, 
  Tag,
  LogOut,
  AlertCircle
} from 'lucide-react';
import axios from 'axios'; 
import { useAuth } from '../context/AuthContext';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // 1. Get the profile string from Local Storage
        const profileString = localStorage.getItem('profile');
        
        // 2. Parse it and extract the token safely
        const profileData = profileString ? JSON.parse(profileString) : null;
        const token = profileData?.token; 

        console.log("My Token is:", token); // This should now print your long JWT string!

        if (!token) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          return; 
        }

        // 3. Make the request with the correctly extracted token
        const response = await axios.get('http://localhost:8000/api/student/dashboard', {
          headers: {
            Authorization: `Bearer ${token}` 
          }
        });

        if (response.data && response.data.success) {
          setDashboardData(response.data.data);
        } else {
          setError(response.data?.message || 'Failed to parse response data.');
        }
      } catch (err) {
        console.error('Dashboard Fetch Error:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-sm font-medium text-slate-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // 2. Error State (Graceful Fallback instead of crash)
  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Dashboard Unavailable</h2>
          <p className="text-sm text-slate-500">{error || 'Unable to fetch profile data.'}</p>
          <div className="flex gap-3 justify-center pt-2">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              Retry
            </button>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Safe Destructuring (Guaranteed non-null at this point)
  const { 
    profile = {}, 
    stats = { eventsCount: 0, appliedCompaniesCount: 0, trainingsAttendedCount: 0 }, 
    registeredEvents = [], 
    appliedCompanies = [], 
    trainingAttendance = [] 
  } = dashboardData;

  const getStatusBadge = (status) => {
    const styles = {
      Applied: 'bg-blue-100 text-blue-800 border-blue-200',
      Interviewing: 'bg-amber-100 text-amber-800 border-amber-200',
      Placed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Rejected: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8">
      {/* Logout Navigation Bar */}
      {/* Navbar */}
<div className="w-full bg-white border-b border-slate-100">
  <div className="max-w-7xl mx-auto px-6 md:px-8 h-[76px] flex items-center justify-between">

    {/* Logo */}
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#2F80ED] flex items-center justify-center text-white font-bold text-xl shadow-sm">
        C
      </div>

      <span className="text-xl font-bold text-[#172B4D] tracking-tight">
        CampusConnect
      </span>
    </div>

    {/* Navigation */}
    <div className="hidden md:flex items-center gap-8">
      <button className="text-sm text-[#2F80ED] font-semibold">
        Dashboard
      </button>

      <button className="text-sm font-medium text-slate-500 hover:text-[#2F80ED] transition">
        Sessions
      </button>

      <button className="text-sm font-medium text-slate-500 hover:text-[#2F80ED] transition">
        Homework
      </button>
    </div>

    {/* Profile + Logout */}
    <div className="flex items-center gap-4">

      <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-[#EAF3FF] text-[#2F80ED] font-bold">
        {(profile?.username || user?.username || 'S')
          .charAt(0)
          .toUpperCase()}
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                   border border-slate-200
                   text-slate-600
                   font-medium text-sm
                   hover:border-[#2F80ED]
                   hover:text-[#2F80ED]
                   transition"
      >
        <LogOut size={17} />
        <span className="hidden sm:block">Logout</span>
      </button>

    </div>
  </div>
</div>

{/* Welcome Hero Section */}
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="relative overflow-hidden bg-white rounded-[28px] border border-slate-100 shadow-[0_10px_35px_rgba(47,128,237,0.07)] min-h-[270px] md:min-h-[290px]"
>
  {/* =====================================================
      BACKGROUND DECORATION
  ====================================================== */}

  {/* Large soft blue circle */}
  <div className="absolute -right-[120px] -top-[150px] w-[430px] h-[430px] rounded-full bg-[#EEF6FF]" />

  {/* Bottom soft blue circle */}
  <div className="absolute right-[20px] -bottom-[190px] w-[330px] h-[330px] rounded-full bg-[#F6FAFF]" />

  {/* =====================================================
      CONTENT
  ====================================================== */}

  <div className="relative z-10 min-h-[280px] md:min-h-[310px] flex items-center px-7 sm:px-10 md:px-12 lg:px-14 py-8">
    
    {/* =================================================
        LEFT CONTENT
    ================================================== */}

    <div className="w-full md:w-[58%] lg:w-[60%] flex flex-col justify-center z-20">
      {/* Welcome */}
      <p className="text-sm md:text-base font-semibold text-[#2F80ED] mb-2">
        Welcome back
      </p>

      {/* Name */}
      <h1 className="text-3xl sm:text-4xl md:text-[42px] font-bold text-[#172B4D] tracking-tight leading-[1.1]">
        {profile?.username || user?.username || 'Student'}!
      </h1>

      {/* Student Information */}
      <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3">
        {/* USN */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EAF3FF] text-[#2F80ED] flex items-center justify-center text-[11px] font-bold">
            ID
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
              USN
            </p>
            <p className="text-sm font-semibold text-[#172B4D] mt-0.5">
              {profile?.usn || 'N/A'}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-8 w-px bg-slate-200" />

        {/* Email */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EAF3FF] text-[#2F80ED] flex items-center justify-center text-sm font-bold">
            @
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
              Email
            </p>
            <p className="text-sm font-semibold text-[#172B4D] mt-0.5 max-w-[240px] truncate">
              {profile?.email || user?.email}
            </p>
          </div>
        </div>

        {/* Student Badge */}
        <span className="px-3.5 py-1.5 rounded-full bg-[#EAF3FF] text-[#2F80ED] border border-[#D9EAFF] text-xs font-semibold">
          {profile?.role || 'Student'}
        </span>
      </div>

      {/* Description */}
      <p className="mt-5 text-sm md:text-[15px] text-slate-500 max-w-[560px] leading-6">
        Keep track of your academic journey, explore opportunities, and stay connected with everything happening on campus.
      </p>
    </div>

    {/* =================================================
        RIGHT ILLUSTRATION
    ================================================== */}

    <div className="absolute right-0 top-0 w-[43%] h-full hidden md:flex items-end justify-end overflow-hidden">
      {/* Large blue illustration background */}
      <div className="absolute right-[-85px] top-[-80px] w-[390px] h-[390px] rounded-full bg-[#EEF6FF]" />

      {/* Yellow sun / circle */}
      <div className="absolute right-[105px] bottom-[5px] w-[185px] h-[185px] rounded-full bg-[#FFF0B8] opacity-90" />

      {/* Illustration */}
      <img
        src="/images/student_dashboard.png"
        alt="Student learning illustration"
        className="relative z-10 w-[230px] lg:w-[280px] xl:w-[310px] h-auto object-contain mr-[15px] mb-[-2px] drop-shadow-[0_15px_20px_rgba(47,128,237,0.10)]"
      />

      {/* =================================================
          DECORATIVE DOTS
      ================================================== */}

      {/* Purple dot */}
      <span className="absolute z-20 top-[55px] right-[115px] w-3 h-3 rounded-full bg-[#8B83F1]" />

      {/* Light purple dot */}
      <span className="absolute z-20 top-[75px] right-[70px] w-5 h-5 rounded-full bg-[#B7B2FA]" />

      {/* Small blue dot */}
      <span className="absolute z-20 bottom-[55px] right-[65px] w-2.5 h-2.5 rounded-full bg-[#2F80ED]" />
    </div>

  </div>
</motion.div>



      {/* 2. Skills & Interests Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" /> Technical Skills
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.skills && profile.skills.length > 0 ? (
              profile.skills.map((skill, index) => (
                <span key={index} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg">
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-400">No skills added yet.</p>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Domain Interests
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.interests && profile.interests.length > 0 ? (
              profile.interests.map((interest, index) => (
                <span key={index} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-100">
                  {interest}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-400">No domain interests added yet.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* 3. Placement Application Tracker & Training Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" /> Applied Companies
          </h2>

          {appliedCompanies.length > 0 ? (
            <div className="space-y-4">
              {appliedCompanies.map((item, index) => (
                <div 
                  key={index} 
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between hover:border-slate-300 transition"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {item.companyId?.name || 'Company Drive'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Role: <span className="text-slate-700">{item.companyId?.jobRole || 'N/A'}</span>
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">You haven't applied to any companies yet.</p>
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" /> Training Log
          </h2>

          <div className="space-y-4">
            {trainingAttendance.length > 0 ? (
              trainingAttendance.map((session, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    {session.attended ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-800">{session.trainingType}</p>
                      <p className="text-xs text-slate-400">{new Date(session.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${session.attended ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {session.attended ? 'Attended' : 'Scheduled'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No training sessions recorded.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* 4. Registered Events */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
      >
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" /> My Registered Events
        </h2>

        {registeredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registeredEvents.map((event) => (
              <div key={event._id} className="p-4 rounded-xl border border-slate-200 hover:shadow-md transition bg-white space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-md">
                    {event.category || 'Technical'}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900">{event.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{event.description}</p>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                  <span className="font-medium text-slate-700">{event.organizer}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">You have not registered for any events yet.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentDashboard;