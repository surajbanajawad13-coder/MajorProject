import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  GraduationCap,
  Users,
  Zap,
  Briefcase,
  Trophy,
  // InstagramIcon,
  // Linkedin,
  Mail,
  Phone,
  MapPin,
  Star,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f5f7fb] text-slate-900 overflow-hidden font-sans">
      {/* ================= NAVBAR ================= */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-xl shadow-md">
              <Zap size={20} fill="white" className="text-white" />
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                CampusConnect
              </h1>

              <p className="text-xs text-slate-500">
                Canara Engineering College
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-slate-700">
            <a href="#home" className="hover:text-blue-600 transition">
              Home
            </a>

            <a href="#features" className="hover:text-blue-600 transition">
              Features
            </a>

            <a href="#placements" className="hover:text-blue-600 transition">
              Placements
            </a>

            <a href="#events" className="hover:text-blue-600 transition">
              Events
            </a>

            <a href="#contact" className="hover:text-blue-600 transition">
              Contact
            </a>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-blue-200 transition"
            >
              Join Now
            </button>
          </div>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section
        id="home"
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          backgroundImage: "url('/college.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Light Overlay */}
        <div className="absolute inset-0 bg-white/75"></div>

        {/* Gradient Blur */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300/30 blur-3xl rounded-full"></div>

        <div className="absolute bottom-10 right-10 w-72 h-72 bg-orange-200/30 blur-3xl rounded-full"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-32 w-full">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* LEFT CONTENT */}
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 px-4 py-2 rounded-full text-orange-600 text-sm font-semibold mb-6">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                Live Campus Updates
              </div>

              <h1 className="text-5xl md:text-7xl font-black leading-tight text-slate-900 mb-6">
                Never Miss a{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Career Beat
                </span>{" "}
                Again.
              </h1>

              <p className="text-slate-600 text-lg leading-relaxed max-w-xl mb-10">
                The ultimate platform for Canara Engineering College students
                to track placements, workshops, hackathons, club events, and
                specialized training programs in one place.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate("/signup")}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 transition hover:scale-105"
                >
                  Get Started
                  <ArrowRight size={20} />
                </button>

                <button className="border border-slate-300 bg-white hover:bg-slate-100 px-8 py-4 rounded-2xl font-semibold transition">
                  Explore Events
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-14">
                <div>
                  <h2 className="text-3xl font-black text-blue-600">250+</h2>

                  <p className="text-slate-500 text-sm">Placements</p>
                </div>

                <div>
                  <h2 className="text-3xl font-black text-orange-500">
                    120+
                  </h2>

                  <p className="text-slate-500 text-sm">Events</p>
                </div>

                <div>
                  <h2 className="text-3xl font-black text-green-500">
                    3000+
                  </h2>

                  <p className="text-slate-500 text-sm">Students</p>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE IMAGE */}
            <div className="relative hidden md:block">
              <div className="bg-white/70 backdrop-blur-md border border-white rounded-[2rem] p-5 shadow-2xl">
                <img
                  src="/canaraHome.webp"
                  alt="Canara Engineering College"
                  className="rounded-[1.5rem] h-[500px] w-full object-cover"
                />
              </div>

              {/* Floating Card 1 */}
              <div className="absolute -top-6 -left-8 bg-white shadow-xl border border-slate-200 p-5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-3 rounded-xl text-white">
                    <Briefcase size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800">
                      Placement Drive
                    </h3>

                    <p className="text-sm text-slate-500">
                      Infosys • Tomorrow
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Card 2 */}
              <div className="absolute bottom-0 -right-8 bg-white shadow-xl border border-slate-200 p-5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 p-3 rounded-xl text-white">
                    <Trophy size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800">
                      Hackathon 2026
                    </h3>

                    <p className="text-sm text-slate-500">
                      Registrations Open
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center mb-20">
            <p className="text-blue-600 font-bold uppercase tracking-widest mb-4">
              Features
            </p>

            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
              Everything You Need
            </h2>

            <p className="text-slate-500 max-w-2xl mx-auto">
              One platform to manage campus life, placements, technical clubs,
              workshops, and student engagement.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* CARD 1 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg hover:scale-105 transition duration-300">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Calendar size={30} />
              </div>

              <h3 className="text-2xl font-bold mb-4 text-slate-900">
                Event Tracking
              </h3>

              <p className="text-slate-500 leading-relaxed">
                Stay updated with workshops, coding contests, seminars,
                hackathons, and technical events happening across campus.
              </p>
            </div>

            {/* CARD 2 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg hover:scale-105 transition duration-300">
              <div className="bg-orange-100 text-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <GraduationCap size={30} />
              </div>

              <h3 className="text-2xl font-bold mb-4 text-slate-900">
                Placement Management
              </h3>

              <p className="text-slate-500 leading-relaxed">
                Track placement drives, interview schedules, aptitude tests,
                company details, and job opportunities easily.
              </p>
            </div>

            {/* CARD 3 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg hover:scale-105 transition duration-300">
              <div className="bg-green-100 text-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Users size={30} />
              </div>

              <h3 className="text-2xl font-bold mb-4 text-slate-900">
                Student Community
              </h3>

              <p className="text-slate-500 leading-relaxed">
                Connect students, clubs, trainers, and coordinators together in
                a unified digital campus ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PLACEMENT STATS ================= */}
      <section id="placements" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-blue-50 p-10 rounded-3xl">
              <h2 className="text-5xl font-black text-blue-600 mb-3">
                250+
              </h2>

              <p className="text-slate-500">Placement Offers</p>
            </div>

            <div className="bg-orange-50 p-10 rounded-3xl">
              <h2 className="text-5xl font-black text-orange-500 mb-3">
                40+
              </h2>

              <p className="text-slate-500">Companies Visited</p>
            </div>

            <div className="bg-green-50 p-10 rounded-3xl">
              <h2 className="text-5xl font-black text-green-500 mb-3">
                ₹24LPA
              </h2>

              <p className="text-slate-500">Highest Package</p>
            </div>

            <div className="bg-pink-50 p-10 rounded-3xl">
              <h2 className="text-5xl font-black text-pink-500 mb-3">
                95%
              </h2>

              <p className="text-slate-500">Placement Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">
              What Students Say
            </h2>

            <p className="text-slate-500">
              Real experiences from our campus students
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg"
              >
                <div className="flex gap-1 text-yellow-400 mb-4">
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                </div>

                <p className="text-slate-600 leading-relaxed mb-6">
                  CampusConnect helped me stay updated with placement drives and
                  technical events. I never missed important opportunities.
                </p>

                <div>
                  <h3 className="font-bold text-slate-900">Student Name</h3>

                  <p className="text-sm text-slate-500">
                    Computer Science Engineering
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-5xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Transform Campus Life?
          </h2>

          <p className="text-lg text-blue-100 mb-10">
            Join thousands of students using CampusConnect every day.
          </p>

          <button
            onClick={() => navigate("/signup")}
            className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black hover:scale-105 transition"
          >
            Join CampusConnect
          </button>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer
        id="contact"
        className="bg-white border-t border-slate-200 py-16"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-4 gap-12">
            {/* About */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-orange-500 p-2 rounded-xl">
                  <Zap size={18} fill="white" className="text-white" />
                </div>

                <h2 className="text-xl font-black text-slate-900">
                  CampusConnect
                </h2>
              </div>

              <p className="text-slate-500 leading-relaxed">
                Smart campus platform for placements, events, and student
                engagement at Canara Engineering College.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-5 text-slate-900">
                Quick Links
              </h3>

              <div className="space-y-3 text-slate-500">
                <p className="hover:text-blue-600 cursor-pointer">Home</p>
                <p className="hover:text-blue-600 cursor-pointer">Events</p>
                <p className="hover:text-blue-600 cursor-pointer">
                  Placements
                </p>
                <p className="hover:text-blue-600 cursor-pointer">Training</p>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-lg mb-5 text-slate-900">
                Contact
              </h3>

              <div className="space-y-4 text-slate-500">
                <div className="flex items-center gap-3">
                  <Mail size={18} />
                  <span>campusconnect@gmail.com</span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={18} />
                  <span>+91 9876543210</span>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={18} />
                  <span>Canara Engineering College, Mangalore</span>
                </div>
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-bold text-lg mb-5 text-slate-900">
                Follow Us
              </h3>

              <div className="flex gap-4">
                <div className="bg-slate-100 p-3 rounded-xl hover:bg-blue-600 hover:text-white transition cursor-pointer">
                  {/* <InstagramIcon size={20} /> */}
                </div>

                <div className="bg-slate-100 p-3 rounded-xl hover:bg-blue-600 hover:text-white transition cursor-pointer">
                  {/* <Linkedin size={20} /> */}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-slate-200 mt-16 pt-8 text-center text-slate-500 text-sm">
            © 2026 CampusConnect • Designed for Canara Engineering College
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;