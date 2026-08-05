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
  ExternalLink,
  Plus,
  Tag,
  LogOut
} from 'lucide-react';
import axios from 'axios'; // Adjust relative path if needed
import { useAuth } from '../context/AuthContext';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('/student/dashboard');
        if (response.data.success) {
          setDashboardData(response.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>{error}</p>
        <button 
          onClick={logout}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition"
        >
          Logout
        </button>
      </div>
    );
  }

  const { profile, stats, registeredEvents, appliedCompanies, trainingAttendance } = dashboardData;

  // Status badge styling helper
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
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <span className="font-bold text-slate-800 text-lg">CampusConnect</span>
        <button 
          onClick={logout} 
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg transition duration-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* 1. Header & Profile Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md shadow-indigo-100">
            {(profile?.username || user?.username || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{profile?.username || user?.username}</h1>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
                {profile?.role || 'Student'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              USN: <span className="font-semibold text-slate-700">{profile?.usn || 'N/A'}</span> | Email: {profile?.email || user?.email}
            </p>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center min-w-[100px]">
            <p className="text-2xl font-bold text-slate-900">{stats?.eventsCount || 0}</p>
            <p className="text-xs text-slate-500 font-medium">Events Registered</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center min-w-[100px]">
            <p className="text-2xl font-bold text-indigo-600">{stats?.appliedCompaniesCount || 0}</p>
            <p className="text-xs text-slate-500 font-medium">Applications</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center min-w-[100px]">
            <p className="text-2xl font-bold text-emerald-600">{stats?.trainingsAttendedCount || 0}</p>
            <p className="text-xs text-slate-500 font-medium">Trainings Done</p>
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
            {profile?.skills && profile.skills.length > 0 ? (
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
            {profile?.interests && profile.interests.length > 0 ? (
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

      {/* 3. Placement Application Tracker & Registered Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Applied Companies Section (2 Cols) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" /> Applied Companies
          </h2>

          {appliedCompanies && appliedCompanies.length > 0 ? (
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

        {/* Training & Placement Readiness Log (1 Col) */}
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
            {trainingAttendance && trainingAttendance.length > 0 ? (
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

      {/* 4. Registered Technical Events Feed */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
      >
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" /> My Registered Events
        </h2>

        {registeredEvents && registeredEvents.length > 0 ? (
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