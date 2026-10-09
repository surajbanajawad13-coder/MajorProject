function getRequiredInitialPassword(variableName) {
  const password = process.env[variableName];
  if (!password || !password.trim()) {
    throw new Error(`Set ${variableName} in the environment before running this seed script.`);
  }
  return password;
}

module.exports = { getRequiredInitialPassword };
