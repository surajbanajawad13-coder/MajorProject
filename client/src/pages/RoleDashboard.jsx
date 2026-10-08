import { motion } from 'framer-motion';
import { Activity, CalendarDays, LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RoleDashboard({ role }) {
  const { user, logout } = useAuth();
  const isAdmin = role === 'Admin';
  const Icon = isAdmin ? ShieldCheck : CalendarDays;
  return <main className="role-portal">
    <style>{`
      .role-portal{min-height:100vh;background:#f5f7fc;color:#1b2440;font-family:Inter,system-ui,sans-serif;padding:30px clamp(18px,5vw,72px)}.role-head{max-width:1160px;margin:0 auto 30px;display:flex;align-items:center;justify-content:space-between}.role-brand{display:flex;align-items:center;gap:10px;font-weight:800}.role-brand-mark{width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#635bfa,#a855f7);color:white;display:grid;place-items:center}.role-signout{border:1px solid #e4e7f0;background:white;border-radius:10px;padding:10px 14px;color:#68728b;display:flex;gap:8px;align-items:center;cursor:pointer}.role-body{max-width:1160px;margin:auto}.role-hero{padding:38px;border-radius:24px;background:linear-gradient(115deg,#6259e8,#8c6df5);color:white;display:flex;align-items:center;justify-content:space-between;box-shadow:0 18px 45px #675cf630}.role-hero p{font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.75}.role-hero h1{font-size:32px;margin:10px 0}.role-hero span{color:#e5e2ff}.role-hero-icon{width:72px;height:72px;border-radius:22px;background:#ffffff26;display:grid;place-items:center}.role-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px}.role-card{background:white;border:1px solid #e9ebf2;border-radius:18px;padding:22px}.role-card svg{color:#6b5ff1}.role-card h2{font-size:14px;margin:16px 0 6px}.role-card p{font-size:12px;color:#7d879d;line-height:1.6;margin:0}.role-note{margin-top:18px;padding:15px 18px;border-radius:13px;background:#eeecff;color:#675cf1;font-size:12px}@media(max-width:700px){.role-hero{padding:25px}.role-hero h1{font-size:24px}.role-cards{grid-template-columns:1fr}.role-hero-icon{display:none}}
    `}</style>
    <header className="role-head"><div className="role-brand"><span className="role-brand-mark">C</span>CampusConnect</div><button className="role-signout" onClick={logout}><LogOut size={16} /> Sign out</button></header>
    <section className="role-body">
      <motion.div className="role-hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><div><p>{role} portal</p><h1>Welcome, {user?.result?.username || role}</h1><span>Your CampusConnect workspace is ready.</span></div><div className="role-hero-icon"><Icon size={36} /></div></motion.div>
      <div className="role-cards">
        <article className="role-card"><LayoutDashboard size={22} /><h2>{isAdmin ? 'Campus overview' : 'Event workspace'}</h2><p>{isAdmin ? 'Your administrator access is active for campus operations.' : 'Your event coordinator access is active for campus programming.'}</p></article>
        <article className="role-card"><Users size={22} /><h2>{isAdmin ? 'Role scoped access' : 'Campus audience'}</h2><p>{isAdmin ? 'Use this account for administrative workflows.' : 'Coordinate student-facing campus activities from this role.'}</p></article>
        <article className="role-card"><Activity size={22} /><h2>Account details</h2><p>{user?.result?.email || user?.result?.usn || 'Signed in account'} · {role}</p></article>
      </div>
      <div className="role-note">Signed in with your {role} account.</div>
    </section>
  </main>;
}
