import React, { useState } from 'react';
import { Eye, EyeOff, LayoutDashboard } from 'lucide-react';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Student');
  const handleSubmit = async (e) => {
    e.preventDefault();
    const loginData = { email, password, role }; // Role from your dropdown
    
    try {
        const { data } = await axios.post('http://localhost:5000/api/auth/login', loginData);
        localStorage.setItem('profile', JSON.stringify(data)); 
        
        // Redirect based on role
        if(data.result.role === 'Student') navigate('/dashboard');
        else if(data.result.role === 'Placement Officer') navigate('/tpo-admin');
    } catch (err) {
        alert(err.response.data.message);
    }
};

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {/* Main Container */}
      <div className="bg-white rounded-3xl shadow-xl flex flex-col md:flex-row max-w-4xl w-full overflow-hidden">

        {/* Left Side: Branding & Graphics */}
        <div className="md:w-1/2 bg-blue-500 p-10 flex flex-col justify-between text-white relative">
          <div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Simplify campus management with our dashboard.
            </h1>
            <p className="text-blue-100 text-lg">
              One unified platform for events, societies, and real-time placement tracking.
            </p>
          </div>

          {/* 3D Character Placeholder Area */}
          <div className="mt-8 flex justify-center">
            <div className="bg-blue-400/30 w-64 h-64 rounded-full flex items-center justify-center border border-white/20 overflow-hidden">

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
        <div className="md:w-1/2 p-10 md:p-16">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-orange-500 p-2 rounded-lg text-white">
              <LayoutDashboard size={24} />
            </div>
            <span className="text-2xl font-bold text-slate-800">CampusConnect</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
          <p className="text-slate-500 mb-8">Please login to your account</p>

          <form className="space-y-5">
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
                <option value="Society Admin">Society Admin</option>
              </select>
            </div>

            {/* Email/USN Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email or USN</label>
              <input
                type="text"
                placeholder="e.g. 4CB21CS001"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
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

            <button className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
              onClick={handleSubmit}
            >
              Login
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