import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Signup from './pages/SignUp.jsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "react-hot-toast";




createRoot(document.getElementById('root')).render(
  <StrictMode>
     <Toaster
        position="top-right"
        reverseOrder={false}
      />
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />  
        <Route path='/' element={<Home />} />
        <Route path="/signup" element={<Signup />} />
    
      </Routes>
    </Router>
  </StrictMode>,
)
