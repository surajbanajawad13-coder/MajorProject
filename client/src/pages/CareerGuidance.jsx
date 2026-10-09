import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Lightbulb, LoaderCircle, Target } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

export default function CareerGuidance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guidance, setGuidance] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState('');
  const userId = user?.result?._id;
  const sessionError = !userId || !user?.token
    ? 'Your session is missing learner information. Sign in again to view career guidance.'
    : '';

  useEffect(() => {
    if (!userId || !user?.token) return;

    const headers = { Authorization: `Bearer ${user.token}` };
    const requests = [
      axios.get(`${API}/api/career-guidance/${userId}`, { headers }),
      axios.get(`${API}/api/skill-gap/${userId}`, { headers }),
      axios.get(`${API}/api/recommendations/${userId}`, { headers }),
    ];
    Promise.allSettled(requests).then((results) => {
      const failedIndex = results.findIndex(result => result.status === 'rejected');
      if (failedIndex !== -1) {
        const failure = results[failedIndex];
        const endpoint = ['career guidance', 'skill gap', 'recommendations'][failedIndex];
        const message = failure.reason.response?.data?.message
          || failure.reason.message
          || 'request failed';
        setError(`Could not load ${endpoint}: ${message}`);
        return;
      }

      const [guidanceResult, skillGapResult, recommendationsResult] = results;
      const guidanceResponse = guidanceResult.value;
      const skillGapResponse = skillGapResult.value;
      const recommendationsResponse = recommendationsResult.value;
      setGuidance(guidanceResponse.data.data);
      setSkillGap(skillGapResponse.data.data);
      setRecommendations(recommendationsResponse.data.data);
    });
  }, [userId, user?.token]);

  if (error || sessionError) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 text-slate-800">
        <button onClick={() => navigate('/student_dashboard')} className="mb-6 flex items-center gap-2 text-sm font-semibold text-indigo-700">
          <ArrowLeft size={16} /> Back to dashboard
        </button>
        <p role="alert" className="rounded-xl border border-rose-200 bg-white p-5 text-rose-700">{error || sessionError}</p>
      </main>
    );
  }

  if (!guidance || !skillGap || !recommendations) {
    return <div className="flex min-h-screen items-center justify-center gap-3 text-slate-600"><LoaderCircle className="animate-spin" /> Preparing your guidance…</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <button onClick={() => navigate('/student_dashboard')} className="mb-6 flex items-center gap-2 text-sm font-semibold text-indigo-700">
          <ArrowLeft size={16} /> Back to dashboard
        </button>
        <header className="mb-7">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Career readiness</p>
          <h1 className="mt-2 text-3xl font-bold">Personalized career guidance</h1>
          <p className="mt-2 text-slate-600">Suggestions are based on your profile, resume, and current opportunities.</p>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-1">
            <p className="text-sm text-slate-500">Resume section coverage</p>
            <p className="mt-2 text-4xl font-bold text-indigo-700">{guidance.resumeScore}%</p>
            <div className="mt-4 space-y-2">
              {Object.entries(guidance.resumeSections).map(([section, present]) => (
                <div key={section} className="flex items-center justify-between text-sm capitalize">
                  <span>{section}</span>
                  <span className={present ? 'text-emerald-700' : 'text-amber-700'}>{present ? 'Present' : 'Add this section'}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Lightbulb size={19} className="text-amber-500" /> Recommended next steps</h2>
            {guidance.suggestions.length
              ? <ul className="mt-4 space-y-3">{guidance.suggestions.map((suggestion) => <li key={suggestion} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />{suggestion}</li>)}</ul>
              : <p className="mt-4 text-sm text-emerald-700">Your profile and resume look well prepared for current opportunities.</p>}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Target size={19} className="text-indigo-600" /> Skills to consider developing</h2>
            <p className="mt-1 text-sm text-slate-500">Skills absent from your profile/resume that appear in current opportunities.</p>
            {skillGap.missingSkills.length
              ? <div className="mt-4 flex flex-wrap gap-2">{skillGap.missingSkills.map(({ skill, opportunityCount }) => <span key={skill} className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-800">{skill} · {opportunityCount} opportunities</span>)}</div>
              : <p className="mt-4 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={17} />No current skill gaps identified.</p>}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-3">
            <h2 className="text-lg font-semibold">Recommended opportunities</h2>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {[
                ['Events and training', recommendations.events],
                ['Placement opportunities', recommendations.placements],
              ].map(([label, opportunities]) => (
                <section key={label}>
                  <h3 className="font-medium text-slate-700">{label}</h3>
                  {opportunities?.length
                    ? <ul className="mt-2 space-y-3">{opportunities.slice(0, 5).map(item => (
                      <li key={item.opportunity_id} className="rounded-lg bg-slate-50 p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-slate-600">{item.score}/14 points · {item.match_percentage}% · {item.rank_label}</span>
                        </div>
                        {item.breakdown && (
                          <div className="mt-3 border-t border-slate-200 pt-3">
                            <p className="font-semibold text-indigo-700">
                              Matching skill points: +{item.breakdown.skill_points}/3
                              {item.breakdown.matched_skills?.length
                                ? ` (${item.breakdown.matched_skills.join(', ')})`
                                : ' (no matching skills)'}
                            </p>
                            <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                              <span>Domain interest: +{item.breakdown.domain_points}/2</span>
                              <span>Project keywords: +{item.breakdown.project_points}/2</span>
                              <span>Branch/year eligibility: +{item.breakdown.eligibility_points}/3</span>
                              <span>Certifications: +{item.breakdown.certification_points}/1</span>
                              <span>CGPA condition: +{item.breakdown.cgpa_points}/3</span>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}</ul>
                    : <p className="mt-2 text-sm text-slate-500">No matching opportunities are available right now.</p>}
                </section>
              ))}
            </div>
          </article>

          <p className="text-sm text-slate-500 md:col-span-3">
            Compared against {guidance.opportunities.events} upcoming events/trainings and {guidance.opportunities.placements} placement opportunities.
          </p>
        </section>
      </div>
    </main>
  );
}
