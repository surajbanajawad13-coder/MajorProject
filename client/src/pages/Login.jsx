import React, { useState } from 'react';
import { Eye, EyeOff, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  // Added state variables for inputs
  const [usn, setUsn] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,setloading]=useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    if (!usn || !password) {
      toast.error('Please fill all fields');
      return;
    }

    e.preventDefault();
    const loginData = { usn, password, role };
    setloading(true);
    try {
        const { data } = await axios.post('http://localhost:8000/api/auth/login', loginData);
        login(data);
        setloading(false);

        if(data.result.role === 'Student') navigate('/student_dashboard');
        else if(data.result.role === 'Placement Officer') navigate('/tpo-admin');
        else if(data.result.role === 'Society Admin') navigate('/society-admin');
    } catch (err) {
        setloading(false);
        toast.error(err.response?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-2 bg-white shadow-md border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-100 transition z-50"
      >
        <ArrowLeft size={18} />
        <span className="font-medium text-slate-700">Back</span>
      </button>

      <div className="bg-white rounded-3xl shadow-xl flex flex-col md:flex-row max-w-6xl w-full min-h-[760px] overflow-hidden">
        {/* Left Side: Branding & Graphics */}
        <div className="md:w-1/2 bg-blue-500 p-10 flex flex-col justify-center text-white relative">
          <div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Simplify campus management with our dashboard.
            </h1>
            <p className="text-blue-100 text-lg">
              One unified platform for events, societies, and real-time placement tracking.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="bg-blue-400/30 w-72 h-72 rounded-full flex items-center justify-center border border-white/20 overflow-hidden">
              <img
                src="/loginlogo.jpg"
                alt="Login Illustration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="mt-auto pt-10">
            <p className="text-sm text-blue-200">© 2026 CampusConnect Engineering College</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:w-1/2 p-10 md:p-14 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-orange-500 p-2 rounded-lg text-white">
              <LayoutDashboard size={24} />
            </div>
            <span className="text-2xl font-bold text-slate-800">CampusConnect</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
          <p className="text-slate-500 mb-8">Please login to your account</p>

          {/* Moved onSubmit to the form level to catch 'Enter' key presses */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Login As</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              >
                <option value="Student">Student</option>
                <option value="Placement Officer">Placement Officer (TPO)</option>
                <option value="Department Faculty">Department Faculty</option>
                <option value="Event Coordinator">Event Coordinator</option>
              </select>
            </div>

            {/* USN Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">USN</label>
              <input
                type="text"
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
                placeholder="e.g. 4CB21CS001"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all hover:bg-blue-600 active:scale-[0.98]
             disabled:bg-blue-400 disabled:cursor-not-allowed disabled:pointer-events-none disabled:scale-100 disabled:shadow-none"
            >
              {loading? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-600">
            Don't have an account? <a href="/signup" className="text-blue-500 font-bold hover:underline">Signup</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
