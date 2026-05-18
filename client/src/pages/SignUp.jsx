import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

import {
  Eye,
  EyeOff,
  UserPlus,
  Code,
  Heart,
  ArrowLeft,
  Check,
  X,
} from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();

  // =========================
  // STATES
  // =========================
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  // FORM DATA
  const [fullName, setFullName] = useState('');
  const [usn, setUsn] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // SKILLS & INTERESTS
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);

  // CUSTOM INPUTS
  const [customSkill, setCustomSkill] = useState('');
  const [customInterest, setCustomInterest] = useState('');

  // =========================
  // DEFAULT DATA
  // =========================
  const skills = [
    'React',
    'Node.js',
    'Python',
    'Java',
    'C++',
    'SQL',
    'MongoDB',
    'AI/ML',
    'Cloud',
    'UI/UX',
  ];

  const interests = [
    'Web Dev',
    'App Dev',
    'Data Science',
    'Cyber Security',
    'Cloud Computing',
    'Hackathons',
    'Competitive Coding',
    'UI/UX',
  ];

  // =========================
  // VALIDATION
  // =========================
  const handleContinue = () => {
    if (!fullName || !usn || !email || !password) {
      toast.error('Please fill all fields');
      return;
    }

    setStep(2);
  };

  // =========================
  // TOGGLE SKILLS
  // =========================
  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(
        selectedSkills.filter((item) => item !== skill)
      );
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // =========================
  // TOGGLE INTERESTS
  // =========================
  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(
        selectedInterests.filter((item) => item !== interest)
      );
    } else {
      setSelectedInterests([
        ...selectedInterests,
        interest,
      ]);
    }
  };

  // =========================
  // ADD CUSTOM SKILL
  // =========================
  const addCustomSkill = () => {
    if (
      customSkill.trim() !== '' &&
      !selectedSkills.includes(customSkill)
    ) {
      setSelectedSkills([
        ...selectedSkills,
        customSkill,
      ]);

      setCustomSkill('');
    }
  };

  // =========================
  // ADD CUSTOM INTEREST
  // =========================
  const addCustomInterest = () => {
    if (
      customInterest.trim() !== '' &&
      !selectedInterests.includes(customInterest)
    ) {
      setSelectedInterests([
        ...selectedInterests,
        customInterest,
      ]);

      setCustomInterest('');
    }
  };

  // =========================
  // REMOVE SKILL
  // =========================
  const removeSkill = (skill) => {
    setSelectedSkills(
      selectedSkills.filter((item) => item !== skill)
    );
  };

  // =========================
  // REMOVE INTEREST
  // =========================
  const removeInterest = (interest) => {
    setSelectedInterests(
      selectedInterests.filter(
        (item) => item !== interest
      )
    );
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = (e) => {


    e.preventDefault();

    try {
      const signupData = {
        fullName,
        usn,
        email,
        password,
      skills: selectedSkills,
      interests: selectedInterests,
    };
    console.log(signupData);
    const { data } = await axios.post('http://localhost:5000/api/auth/signup', signupData);
    toast.success('Account Created Successfully!');
  } catch (err) {
    toast.error('Signup failed. Please try again.');
  }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative">

      {/* ========================= */}
      {/* BACK BUTTON */}
      {/* ========================= */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 bg-white shadow-md border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-100 transition"
      >
        <ArrowLeft size={18} />
        <span className="font-medium text-slate-700">
          Back
        </span>
      </button>

      {/* ========================= */}
      {/* MAIN CONTAINER */}
      {/* ========================= */}
      <div className="bg-white rounded-3xl shadow-xl flex flex-col md:flex-row max-w-6xl w-full min-h-[760px] overflow-hidden">

        {/* ========================= */}
        {/* LEFT SIDE */}
        {/* ========================= */}
        <div className="md:w-5/12 bg-blue-500 p-10 text-white flex flex-col justify-center">

          <div>
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Start your journey with CampusConnect.
            </h2>

            <p className="text-blue-100 text-lg leading-relaxed">
              Access placement drives, workshops,
              hackathons, and student communities
              from one unified platform.
            </p>
          </div>

          {/* IMAGE */}
          <div className="my-12 flex justify-center">
            <div className="bg-blue-400/30 w-72 h-72 rounded-full flex items-center justify-center border border-white/20 overflow-hidden">

              <img
                src="/signup.png"
                alt="Signup Illustration"
                className="w-full h-full object-cover"
              />

            </div>
          </div>

          {/* FEATURE BOXES */}
          <div className="space-y-4">

            <div className="flex items-center gap-3 text-sm bg-white/10 p-4 rounded-2xl backdrop-blur-md">
              <div className="bg-green-400 h-2 w-2 rounded-full"></div>

              Real-time Placement Notifications
            </div>

            <div className="flex items-center gap-3 text-sm bg-white/10 p-4 rounded-2xl backdrop-blur-md">
              <div className="bg-orange-400 h-2 w-2 rounded-full"></div>

              Campus Events & Workshops
            </div>

          </div>
        </div>

        {/* ========================= */}
        {/* RIGHT SIDE */}
        {/* ========================= */}
        <div className="md:w-7/12 p-10 md:p-14 flex flex-col justify-center">

          {/* TOP */}
          <div className="flex items-center justify-between mb-10">

            <div className="flex items-center gap-3">

              <div className="bg-orange-500 p-2 rounded-xl text-white">
                <UserPlus size={22} />
              </div>

              <span className="text-3xl font-bold text-slate-800">
                CampusConnect
              </span>
            </div>

            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Step {step} of 2
            </span>
          </div>

          {/* ========================= */}
          {/* FORM */}
          {/* ========================= */}
          <form
            className="space-y-6"
            onSubmit={handleSubmit}
          >

            {/* ================================================= */}
            {/* STEP 1 */}
            {/* ================================================= */}
            {step === 1 ? (
              <>
                {/* NAME + USN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) =>
                        setFullName(e.target.value)
                      }
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      USN
                    </label>

                    <input
                      type="text"
                      value={usn}
                      onChange={(e) =>
                        setUsn(e.target.value)
                      }
                      placeholder="4CB21CS000"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="john@canara.edu"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* PASSWORD */}
                <div className="relative">

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-4 top-11 text-slate-400"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>

                {/* CONTINUE */}
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition shadow-lg shadow-blue-200"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                {/* ================================================= */}
                {/* STEP 2 */}
                {/* ================================================= */}

                {/* ================= SKILLS ================= */}
                <div>

                  <label className="flex items-center gap-2 text-lg font-bold text-slate-700 mb-5">
                    <Code
                      size={20}
                      className="text-blue-500"
                    />
                    Technical Skills
                  </label>

                  {/* DEFAULT PILLS */}
                  <div className="flex flex-wrap gap-3 mb-5">

                    {skills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() =>
                          toggleSkill(skill)
                        }
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition flex items-center gap-2
                          
                          ${
                            selectedSkills.includes(
                              skill
                            )
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white border-slate-200 hover:bg-blue-50 hover:border-blue-200'
                          }
                        `}
                      >
                        {selectedSkills.includes(
                          skill
                        ) && <Check size={14} />}

                        {skill}
                      </button>
                    ))}

                  </div>

                  {/* CUSTOM INPUT */}
                  <div className="flex gap-3">

                    <input
                      type="text"
                      value={customSkill}
                      onChange={(e) =>
                        setCustomSkill(
                          e.target.value
                        )
                      }
                      placeholder="Add your own skill"
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    <button
                      type="button"
                      onClick={addCustomSkill}
                      className="bg-blue-500 text-white px-6 rounded-xl font-semibold hover:bg-blue-600 transition"
                    >
                      Add
                    </button>
                  </div>

                  {/* SELECTED SKILLS */}
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-5">

                      {selectedSkills.map(
                        (skill) => (
                          <div
                            key={skill}
                            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium"
                          >
                            {skill}

                            <button
                              type="button"
                              onClick={() =>
                                removeSkill(
                                  skill
                                )
                              }
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )
                      )}

                    </div>
                  )}
                </div>

                {/* ================= INTERESTS ================= */}
                <div>

                  <label className="flex items-center gap-2 text-lg font-bold text-slate-700 mb-5">
                    <Heart
                      size={20}
                      className="text-orange-500"
                    />
                    Interests
                  </label>

                  {/* DEFAULT PILLS */}
                  <div className="flex flex-wrap gap-3 mb-5">

                    {interests.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() =>
                          toggleInterest(
                            interest
                          )
                        }
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition flex items-center gap-2
                          
                          ${
                            selectedInterests.includes(
                              interest
                            )
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white border-slate-200 hover:bg-orange-50 hover:border-orange-200'
                          }
                        `}
                      >
                        {selectedInterests.includes(
                          interest
                        ) && (
                          <Check size={14} />
                        )}

                        {interest}
                      </button>
                    ))}

                  </div>

                  {/* CUSTOM INPUT */}
                  <div className="flex gap-3">

                    <input
                      type="text"
                      value={customInterest}
                      onChange={(e) =>
                        setCustomInterest(
                          e.target.value
                        )
                      }
                      placeholder="Add your own interest"
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    />

                    <button
                      type="button"
                      onClick={addCustomInterest}
                      className="bg-orange-500 text-white px-6 rounded-xl font-semibold hover:bg-orange-600 transition"
                    >
                      Add
                    </button>
                  </div>

                  {/* SELECTED INTERESTS */}
                  {selectedInterests.length >
                    0 && (
                    <div className="flex flex-wrap gap-3 mt-5">

                      {selectedInterests.map(
                        (interest) => (
                          <div
                            key={interest}
                            className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium"
                          >
                            {interest}

                            <button
                              type="button"
                              onClick={() =>
                                removeInterest(
                                  interest
                                )
                              }
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )
                      )}

                    </div>
                  )}
                </div>

                {/* BUTTONS */}
                <div className="flex gap-4 pt-8">

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 border border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    className="w-2/3 bg-blue-500 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition shadow-lg shadow-blue-200"
                  >
                    Create Account
                  </button>

                </div>
              </>
            )}
          </form>

          {/* LOGIN LINK */}
          <p className="text-center mt-8 text-slate-500 text-sm">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-blue-600 font-bold hover:underline"
            >
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;