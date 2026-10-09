import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter as Router } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Toaster } from "react-hot-toast";
import { AuthProvider } from './context/AuthContext.jsx'
import AnimatedRoutes from './AnimatedRoutes.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <Toaster
        position="top-right"
        reverseOrder={false}
      />
    <AuthProvider>

  <Router>
    <MotionConfig reducedMotion="user">
      <AnimatedRoutes />
    </MotionConfig>
  </Router>

</AuthProvider>
  </StrictMode>,
)
