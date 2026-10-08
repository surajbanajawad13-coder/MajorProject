import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Signup from './pages/SignUp.jsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "react-hot-toast";
import StudentDashboard from './student_Dashboard/StudentDashboard.jsx'
import SocietyDashboard from './Society_admin/SocietyDashboard.jsx'
import TPODashboard from './TPO_admin/TPODashboard.jsx'
import AdminDashboard from './Admin_dashboard/AdminDashboard.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import  ProtectedRoute  from './ProtectedRoute.jsx';
import PublicRoute from './PublicRoute.jsx'
import FacultyDashboard from './pages/FacultyDashboard.jsx'
import RoleDashboard from './pages/RoleDashboard.jsx'
import DepartmentCoordinatorDashboard from './pages/DepartmentCoordinatorDashboard.jsx'
import CoordinatorDashboard from './pages/CoordinatorDashboard.jsx'
import ExploreEvents from './pages/ExploreEvents.jsx'




createRoot(document.getElementById('root')).render(
  <StrictMode>
     <Toaster
        position="top-right"
        reverseOrder={false}
      />
    <AuthProvider>

  <Router>
    <Routes>

      <Route
        path="/login"
        element={
        <PublicRoute>
          <Login />
        </PublicRoute>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />

      <Route
        path="/"
        element={
        <PublicRoute>
        <Home />
        </PublicRoute>
      }
      />

      <Route path="/explore-events" element={<ExploreEvents />} />

      

      <Route
        path="/student_dashboard"
        element={
          <ProtectedRoute
            allowedRole="Student"
          >
            <StudentDashboard />
          </ProtectedRoute>
        }
      />


      <Route
        path="/society-admin"
        element={
          <ProtectedRoute
            allowedRole="Society Admin"
          >
            <SocietyDashboard />
          </ProtectedRoute>
        }
      />

    
      <Route
        path="/tpo-admin"
        element={
          <ProtectedRoute
            allowedRole="Placement Officer"
          >
            <TPODashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/faculty-dashboard" element={<ProtectedRoute allowedRole="Faculty"><FacultyDashboard /></ProtectedRoute>} />
      <Route path="/department-coordinator" element={<ProtectedRoute allowedRole="Department Placement Coordinator"><DepartmentCoordinatorDashboard /></ProtectedRoute>} />
      <Route path="/event-coordinator" element={<ProtectedRoute allowedRole={['Event Coordinator', 'Admin']}><CoordinatorDashboard /></ProtectedRoute>} />
      <Route path="/admin-dashboard" element={<ProtectedRoute allowedRole="Admin"><RoleDashboard role="Admin" /></ProtectedRoute>} />

    </Routes>
  </Router>

</AuthProvider>
  </StrictMode>,
)
