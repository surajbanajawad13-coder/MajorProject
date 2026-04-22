import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, GraduationCap, Users, Zap } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* 1. Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-1.5 rounded-lg text-white">
            <Zap size={20} fill="white" />
          </div>
          <span className="text-xl font-bold tracking-tight">CampusConnect</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#about" className="hover:text-blue-600 transition">About</a>
          <a href="#events" className="hover:text-blue-600 transition">Events</a>
          <a href="#placements" className="hover:text-blue-600 transition">Placements</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/login')} className="text-sm font-semibold hover:text-blue-600">Login</button>
          <button onClick={() => navigate('/signup')} className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
            Join Now
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="max-w-7xl mx-auto px-8 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
        <div className="md:w-1/2 space-y-8">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full text-orange-600 text-xs font-bold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            Live Campus Pulse
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] text-slate-900">
            Never miss a <span className="text-blue-600 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Career Beat</span> again.
          </h1>
          <p className="text-lg text-slate-500 max-w-md leading-relaxed">
            The ultimate hub for Canara Engineering College students to track society events, placement drives, and specialized training in one place.
          </p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/signup')} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition group">
              Get Started <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>

        {/* Hero Visual (Matches Login Side Graphic style) */}
        <div className="md:w-1/2 relative">
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="relative bg-white p-4 rounded-[2.5rem] shadow-2xl border border-slate-100 transform hover:scale-[1.02] transition duration-500">
            <div className="bg-blue-600 rounded-[2rem] h-80 w-full flex items-center justify-center overflow-hidden">
               <span className="text-white/50 italic text-sm text-center px-10">
                 [3D Student Illustration with Society Flyers & Placement Badges]
               </span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. About / Features Section */}
      <section id="about" className="max-w-7xl mx-auto px-8 py-20 border-t border-slate-200">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <Calendar size={24} />
            </div>
            <h3 className="text-xl font-bold">Society Hub</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Every club, from IEEE to Cultural, lists their events here. Register in one click.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-xl font-bold">Placement Tracker</h3>
            <p className="text-slate-500 text-sm leading-relaxed">See who's visiting today, download JDs, and track upcoming high-package drives.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold">Unified Training</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Specialized Wednesday sessions and 10-day bootcamps synced with your schedule.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;