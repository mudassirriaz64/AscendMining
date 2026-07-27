const Admin = require('../models/Admin');

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME || 'System Admin';

  if (!email || !password) {
    console.log('ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin seed.');
    return;
  }

  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  await Admin.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash: password,
    role: 'admin',
    status: 'active',
  });

  console.log(`Admin seeded successfully: ${email}`);
};

module.exports = seedAdmin;
