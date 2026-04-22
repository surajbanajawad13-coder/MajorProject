import React, { useState } from 'react';
import { Eye, EyeOff, UserPlus, Code, Heart } from 'lucide-react';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Basic Info, Step 2: Skills/Interests

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl flex flex-col md:flex-row max-w-5xl w-full overflow-hidden transition-all duration-500">
        
        {/* Left Side: Theme Graphic */}
        <div className="md:w-5/12 bg-indigo-600 p-10 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-4">Start your journey.</h2>
            <p className="text-indigo-100">
              Create your account to access exclusive placement drives and society workshops.
            </p>
          </div>
          
          <div className="mt-8 flex justify-center">
            <div className="bg-blue-400/30 w-64 h-64 rounded-full flex items-center justify-center border border-white/20 overflow-hidden">

              <img
                src="/signup.png"
                alt="Login Illustration"
                className="w-full h-full object-cover"
              />

            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm bg-white/10 p-3 rounded-2xl">
              <div className="bg-green-400 h-2 w-2 rounded-full"></div>
              Real-time Placement Notifications
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-7/12 p-10 md:p-14">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="bg-orange-500 p-1.5 rounded-lg text-white">
                <UserPlus size={20} />
              </div>
              <span className="text-xl font-bold text-slate-800">CampusConnect</span>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step} of 2</span>
          </div>

          <form className="space-y-5">
            {step === 1 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input type="text" placeholder="John Doe" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">USN</label>
                    <input type="text" placeholder="4CB21CS000" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input type="email" placeholder="john@canara.edu" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-9 text-slate-400">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <button 
                  type="button" 
                  onClick={() => setStep(2)}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition shadow-lg"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                      <Code size={18} className="text-indigo-500" /> Technical Skills
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['React', 'Node.js', 'Python', 'Java', 'C++', 'SQL'].map(skill => (
                        <button key={skill} type="button" className="px-4 py-2 rounded-full border border-slate-200 text-sm hover:bg-indigo-50 hover:border-indigo-200 transition">
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                      <Heart size={18} className="text-orange-500" /> Interests
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Web Dev', 'App Dev', 'UI/UX', 'Cloud', 'Data Science'].map(interest => (
                        <button key={interest} type="button" className="px-4 py-2 rounded-full border border-slate-200 text-sm hover:bg-orange-50 hover:border-orange-200 transition">
                          + {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setStep(1)} className="w-1/3 border border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition">
                    Back
                  </button>
                  <button type="submit" className="w-2/3 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
                    Create Account
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="text-center mt-8 text-slate-500 text-sm">
            Already have an account? <a href="/login" className="text-indigo-600 font-bold hover:underline">Login</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;