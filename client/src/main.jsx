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
import { AuthProvider } from './context/AuthContext.jsx'
import  ProtectedRoute  from './ProtectedRoute.jsx';
import PublicRoute from './PublicRoute.jsx'




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

    </Routes>
  </Router>

</AuthProvider>
  </StrictMode>,
)
