import { createElement, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CalendarDays, Code2, GraduationCap, Menu, Sparkles, Trophy, Users, X, Zap } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API from '../api';


const demoEvents = [
  { _id: 'demo-react-workshop', title: 'React & Modern Web Development Workshop', type: 'Training', category: 'Workshop', description: 'Learn React, component-based development and modern frontend practices.', organizer: 'CampusConnect', date: '2026-11-29T10:00:00.000Z', targetDepartment: ['CSE', 'ISE'] },
  { _id: 'demo-hackathon-2026', title: 'Campus Hackathon 2026', type: 'Event', category: 'Hackathon', description: 'Build innovative solutions and compete with students across campus.', organizer: 'Technical Club', date: '2026-11-20T09:00:00.000Z', targetDepartment: ['All'] },
  { _id: 'demo-coding-bootcamp', title: 'Coding Bootcamp', type: 'Training', category: 'Coding Bootcamp', description: 'Strengthen your programming and problem-solving skills.', organizer: 'Training Cell', date: '2026-12-05T09:00:00.000Z', targetDepartment: ['CSE', 'ISE', 'AIML'] },
  { _id: 'demo-ai-seminar', title: 'AI & Machine Learning Seminar', type: 'Event', category: 'Seminar', description: 'Explore current trends in Artificial Intelligence and Machine Learning.', organizer: 'AI Club', date: '2026-12-10T10:00:00.000Z', targetDepartment: ['All'] }
];

const categories = ['All Categories', 'Workshop', 'Hackathon', 'Coding Bootcamp', 'Seminar'];

export default function ExploreEvents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [events, setEvents] = useState(demoEvents);
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : undefined;
    axios.get(`${API}/api/events`, { headers })
      .then(response => {
        if (active && response.data?.success && Array.isArray(response.data.data)) setEvents(response.data.data);
      })
      .catch(() => {
        // This endpoint is protected; public visitors use the page's sample programs.
        if (active) setEvents(demoEvents);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.token]);

  const filteredEvents = useMemo(() => events.filter(event =>
    (typeFilter === 'All' || event.type === typeFilter) &&
    (categoryFilter === 'All Categories' || event.category === categoryFilter)
  ), [events, typeFilter, categoryFilter]);

  const handleRegister = event => {
    if (!user?.token) {
      setShowLoginModal(true);
      return;
    }
    if (user?.result?.role === 'Student') {
      navigate('/student_dashboard', { state: { openEvents: true, selectedEventId: event._id } });
      return;
    }
    setShowLoginModal(true);
  };

  const typeTabs = ['All', 'Event', 'Training'];

  return <main className="cc-events min-h-screen bg-[#f5f7fb] font-sans text-slate-900">
    <nav className="fixed left-0 top-0 z-40 w-full border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-3 text-left" aria-label="CampusConnect home">
          <span className="rounded-xl bg-orange-500 p-2 text-white shadow-md"><Zap size={20} fill="white" /></span>
          <span><strong className="block text-lg font-extrabold tracking-tight">CampusConnect</strong><small className="block text-xs text-slate-500">Canara Engineering College</small></span>
        </button>
        <div className="hidden items-center gap-8 text-sm font-semibold text-slate-700 md:flex">
          <a href="/#home" className="transition hover:text-blue-600">Home</a><a href="/#features" className="transition hover:text-blue-600">Features</a><a href="/#placements" className="transition hover:text-blue-600">Placements</a><a href="#events" className="text-blue-600">Events</a><a href="/#contact" className="transition hover:text-blue-600">Contact</a>
        </div>
        <div className="hidden items-center gap-3 md:flex"><button onClick={() => navigate('/login')} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:text-blue-600">Login</button><button onClick={() => navigate('/signup')} className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">Join Now</button></div>
        <motion.button whileTap={{ scale: 0.94 }} className="rounded-lg p-2 text-slate-700 md:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(value => !value)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</motion.button>
      </div>
      <AnimatePresence initial={false}>
        {menuOpen && <motion.div
          initial={{ opacity: 0, height: 0, y: reduceMotion ? 0 : -6 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: reduceMotion ? 0 : -4 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-1 overflow-hidden border-t border-slate-100 bg-white px-5 py-3 md:hidden"
        ><a onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm" href="/#home">Home</a><a onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm" href="/#features">Features</a><a onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm" href="/#placements">Placements</a><a onClick={() => setMenuOpen(false)} className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700" href="#events">Events</a><a onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm" href="/#contact">Contact</a><div className="flex gap-2 pt-2"><button onClick={() => navigate('/login')} className="flex-1 rounded-xl border border-slate-200 py-2">Login</button><button onClick={() => navigate('/signup')} className="flex-1 rounded-xl bg-blue-600 py-2 font-bold text-white">Join Now</button></div></motion.div>}
      </AnimatePresence>
    </nav>

    <section className="px-5 pb-12 pt-32 md:px-10 md:pb-16 md:pt-40">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600"><Sparkles size={16} /> Campus Events & Training</span>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl">Discover What&apos;s Happening <span className="text-blue-600">on Campus</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">Explore workshops, hackathons, training programs and events designed to help you learn, connect and grow.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><a href="#events" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-3.5 font-bold text-white shadow-xl shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700">Explore Events <ArrowRight size={18} /></a><button onClick={() => navigate('/signup')} className="rounded-2xl border border-slate-300 bg-white px-7 py-3.5 font-bold text-slate-800 transition hover:bg-slate-50">Join CampusConnect</button></div>
        </motion.div>
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 sm:gap-5"><MiniStat icon={CalendarDays} value={`${events.length}+`} label="Programs" color="blue"/><MiniStat icon={Users} value="All" label="Campus community" color="orange"/><MiniStat icon={GraduationCap} value="Learn" label="Something new" color="green"/></div>
      </div>
    </section>

    <section id="events" className="scroll-mt-24 px-5 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 font-bold uppercase tracking-widest text-blue-600">Find your next opportunity</p><h2 className="text-3xl font-black md:text-4xl">Upcoming Campus Programs</h2><p className="mt-2 text-slate-500">Discover something to learn, build, or be part of.</p></div><div className="flex flex-wrap gap-2" aria-label="Filter programs by type">{typeTabs.map(type => <button key={type} onClick={() => setTypeFilter(type)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${typeFilter === type ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'}`}>{type === 'All' ? 'All' : `${type}s`}</button>)}</div></div>
        <div className="mb-7 flex flex-wrap items-center gap-2"><span className="mr-1 text-sm font-semibold text-slate-500">Category</span>{categories.map(category => <button key={category} onClick={() => setCategoryFilter(category)} className={`rounded-full px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${categoryFilter === category ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-orange-600'}`}>{category}</button>)}</div>
        {loading && <p className="mb-4 text-sm text-slate-500" role="status">Loading campus programs…</p>}
        {filteredEvents.length ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"><AnimatePresence mode="popLayout" initial={false}>{filteredEvents.map((event, index) => <EventCard key={event._id || `${event.title}-${index}`} event={event} index={index} onRegister={() => handleRegister(event)} reduceMotion={reduceMotion} />)}</AnimatePresence></div> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><CalendarDays className="mx-auto text-slate-400" size={36}/><h3 className="mt-4 text-lg font-bold">No programs match these filters</h3><p className="mt-1 text-sm text-slate-500">Try another type or category.</p></div>}
      </div>
    </section>

    <section className="px-5 py-14 md:px-10 md:py-20"><div className="mx-auto max-w-6xl rounded-3xl bg-blue-600 px-6 py-12 text-center shadow-xl shadow-blue-200 md:px-12"><h2 className="text-3xl font-black text-white md:text-4xl">Want to participate in campus programs?</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">Join CampusConnect and never miss an important workshop, training session or hackathon.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => navigate('/login')} className="rounded-2xl bg-white px-8 py-3.5 font-bold text-slate-900 transition hover:bg-blue-50">Login</button><button onClick={() => navigate('/signup')} className="rounded-2xl bg-orange-500 px-8 py-3.5 font-bold text-white transition hover:bg-orange-600">Join Now</button></div></div></section>

    <footer id="contact" className="border-t border-slate-200 bg-white px-5 py-12 md:px-10"><div className="mx-auto grid max-w-7xl gap-9 md:grid-cols-3"><div><div className="flex items-center gap-3"><span className="rounded-xl bg-orange-500 p-2 text-white"><Zap size={18} fill="white" /></span><strong className="text-xl font-black">CampusConnect</strong></div><p className="mt-4 max-w-sm leading-6 text-slate-500">Smart campus platform for placements, events, and student engagement at Canara Engineering College.</p></div><div><h3 className="mb-4 font-bold">Quick Links</h3><div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500"><a className="hover:text-blue-600" href="/#home">Home</a><a className="hover:text-blue-600" href="/#features">Features</a><a className="hover:text-blue-600" href="/#placements">Placements</a><a className="hover:text-blue-600" href="#events">Events</a></div></div><div><h3 className="mb-4 font-bold">Contact</h3><p className="text-sm leading-7 text-slate-500">campusconnect@gmail.com<br/>+91 9876543210<br/>Canara Engineering College, Mangalore</p></div></div><div className="mx-auto mt-10 max-w-7xl border-t border-slate-200 pt-6 text-center text-sm text-slate-500">© 2026 CampusConnect • Designed for Canara Engineering College</div></footer>

    <AnimatePresence>{showLoginModal && <motion.div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => { if (event.target === event.currentTarget) setShowLoginModal(false); }}><motion.div role="dialog" aria-modal="true" aria-labelledby="login-required-title" className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><GraduationCap size={25}/></div><h2 id="login-required-title" className="text-2xl font-black">{user?.token ? 'Student account required' : 'Login Required'}</h2><p className="mt-3 leading-6 text-slate-600">Please login as a student to register for campus events and training sessions. You can explore programs here; registration takes place in the Student Dashboard.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><button onClick={() => navigate('/login')} className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700">Login</button><button onClick={() => navigate('/signup')} className="flex-1 rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50">Create Account</button></div><button onClick={() => setShowLoginModal(false)} className="mt-4 w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-800">Continue exploring</button></motion.div></motion.div>}</AnimatePresence>
  </main>;
}

function MiniStat({ icon: Icon, value, label, color }) {
  const tone = { blue: 'bg-blue-50 text-blue-600', orange: 'bg-orange-50 text-orange-600', green: 'bg-green-50 text-green-600' }[color];
  return <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-lg sm:p-5"><div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>{createElement(Icon, { size: 18 })}</div><p className="mt-2 text-lg font-black sm:text-2xl">{value}</p><p className="text-[10px] text-slate-500 sm:text-xs">{label}</p></div>;
}

function EventCard({ event, index, onRegister, reduceMotion }) {
  const EventIcon = event.type === 'Training' ? Code2 : event.category === 'Hackathon' ? Trophy : CalendarDays;
  const departments = Array.isArray(event.targetDepartment) ? event.targetDepartment : event.department === 'All Departments' ? ['All'] : String(event.department || 'All').split(',').map(item => item.trim());
  const departmentLabel = departments.includes('All') ? 'All Departments' : departments.join(', ');
  const date = event.date ? new Date(event.date) : null;
  return <motion.article layout initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }} transition={{ duration: reduceMotion ? 0.12 : 0.24, delay: Math.min(index * 0.045, 0.18), ease: [0.22, 1, 0.36, 1] }} whileHover={reduceMotion ? undefined : { y: -2 }} className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
    <div className="mb-5 flex items-start justify-between gap-3"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${event.type === 'Training' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{createElement(EventIcon, { size: 23 })}</div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${event.type === 'Training' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>{event.type || 'Event'}</span></div>
    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{event.category || 'Campus Program'}</div><h3 className="text-xl font-extrabold leading-snug text-slate-900">{event.title}</h3><p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{event.description}</p>
    <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm"><p className="flex items-center gap-2 text-slate-600"><Users size={15} className="text-slate-400"/><span><strong className="text-slate-700">Organizer:</strong> {event.organizer || 'CampusConnect'}</span></p><p className="flex items-center gap-2 text-slate-600"><CalendarDays size={15} className="text-slate-400"/><span><strong className="text-slate-700">Date:</strong> {date && !Number.isNaN(date.valueOf()) ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date to be announced'}</span></p><p className="flex items-start gap-2 text-slate-600"><GraduationCap size={15} className="mt-0.5 shrink-0 text-slate-400"/><span><strong className="text-slate-700">For:</strong> {departmentLabel}</span></p></div>
    <motion.button type="button" onClick={onRegister} whileTap={{ scale: 0.98 }} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700">Register <ArrowRight size={17}/></motion.button>
  </motion.article>;
}
