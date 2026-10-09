import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import AdminDashboard from './Admin_dashboard/AdminDashboard.jsx';
import SocietyDashboard from './Society_admin/SocietyDashboard.jsx';
import TPODashboard from './TPO_admin/TPODashboard.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import PublicRoute from './PublicRoute.jsx';
import CareerGuidance from './pages/CareerGuidance.jsx';
import CoordinatorDashboard from './pages/CoordinatorDashboard.jsx';
import DepartmentCoordinatorDashboard from './pages/DepartmentCoordinatorDashboard.jsx';
import ExploreEvents from './pages/ExploreEvents.jsx';
import FacultyDashboard from './pages/FacultyDashboard.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/SignUp.jsx';
import StudentDashboard from './student_Dashboard/StudentDashboard.jsx';

export default function AnimatedRoutes() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="cc-route-transition"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
        transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
          <Route path="/explore-events" element={<ExploreEvents />} />
          <Route path="/career-guidance" element={<ProtectedRoute allowedRole="Student"><CareerGuidance /></ProtectedRoute>} />
          <Route path="/student_dashboard" element={<ProtectedRoute allowedRole="Student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/society-admin" element={<ProtectedRoute allowedRole="Society Admin"><SocietyDashboard /></ProtectedRoute>} />
          <Route path="/tpo-admin" element={<ProtectedRoute allowedRole="Placement Officer"><TPODashboard /></ProtectedRoute>} />
          <Route path="/faculty-dashboard" element={<ProtectedRoute allowedRole="Faculty"><FacultyDashboard /></ProtectedRoute>} />
          <Route path="/department-coordinator" element={<ProtectedRoute allowedRole="Department Placement Coordinator"><DepartmentCoordinatorDashboard /></ProtectedRoute>} />
          <Route path="/event-coordinator" element={<ProtectedRoute allowedRole={['Event Coordinator', 'Admin']}><CoordinatorDashboard /></ProtectedRoute>} />
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRole="Admin"><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
