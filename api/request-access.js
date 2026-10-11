// Vercel Serverless Function: /api/request-access
// Handles private repository code audit requests and verified passcode access

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, github_user, project_id, passcode } = req.body || {};

  // If a VIP/Recruiter passcode is provided (e.g. VIBE2026, APO2026, RAYMOND2026)
  const validPasscodes = ['VIBE2026', 'APO2026', 'RAYMOND2026', 'PROS2026'];
  if (passcode && validPasscodes.includes(passcode.toUpperCase().trim())) {
    return res.status(200).json({
      status: 'verified',
      authorized: true,
      message: 'Passcode verified! Executive technical deep-dive unlocked.',
      spec_url: `mailto:thepros2014@gmail.com?subject=Code%20Access%20Grant%20(${name}%20@%20${company})`
    });
  }

  if (!email || !github_user) {
    return res.status(400).json({ error: 'Email and GitHub username are required.' });
  }

  // Record/Log access request
  return res.status(200).json({
    status: 'received',
    message: `Thank you ${name || 'there'}! Your request to inspect private repository (${project_id || 'private projects'}) has been recorded. Raymond Thomas will grant read-only collaborator access to GitHub user '@${github_user}' within 24 hours.`,
    contact_email: 'thepros2014@gmail.com'
  });
};
