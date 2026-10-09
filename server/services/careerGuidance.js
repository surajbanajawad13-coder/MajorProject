const normalize = values => (values || [])
  .map(value => String(value || '').trim().toLowerCase())
  .filter(Boolean);

const buildSkillGap = (opportunitySkillLists, knownSkillList) => {
  const known = new Set(normalize(knownSkillList));
  const demand = new Map();

  for (const skills of opportunitySkillLists) {
    for (const skill of new Set(normalize(skills))) {
      demand.set(skill, (demand.get(skill) || 0) + 1);
    }
  }

  return [...demand]
    .filter(([skill]) => !known.has(skill))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([skill, opportunityCount]) => ({ skill, opportunityCount }));
};

const summarizeResumeSections = extractedText => {
  const checks = [
    ['education', /\beducation\b/i],
    ['skills', /\b(technical\s+)?skills\b/i],
    ['projects', /\bprojects?\b/i],
    ['certifications', /\b(certifications?|licenses?)\b/i],
  ];
  const sections = Object.fromEntries(checks.map(([name, pattern]) => [name, pattern.test(extractedText || '')]));
  const missingSections = Object.entries(sections)
    .filter(([, present]) => !present)
    .map(([name]) => name);
  const score = Math.round(((checks.length - missingSections.length) / checks.length) * 100);

  return { sections, missingSections, score };
};

const buildCareerSuggestions = ({ resume, missingSections, missingSkills, student }) => {
  const suggestions = [];
  if (!resume) suggestions.push('Upload a PDF or DOCX resume to receive resume-specific feedback.');
  if (missingSections.length) {
    suggestions.push(`Add or clearly label these resume sections: ${missingSections.join(', ')}.`);
  }
  if (missingSkills.length) {
    suggestions.push(`Consider developing ${missingSkills.slice(0, 3).map(item => item.skill).join(', ')}, which appear in current opportunities.`);
  }
  if (!student.projects?.length && !resume?.parsedProjects?.titles?.length) {
    suggestions.push('Add one or more projects with a clear outcome and the technologies you used.');
  }
  if (!student.certifications?.length && !resume?.certifications?.length) {
    suggestions.push('Consider adding relevant certifications to your profile or resume.');
  }
  return suggestions;
};

module.exports = {
  normalize,
  buildSkillGap,
  summarizeResumeSections,
  buildCareerSuggestions,
};
