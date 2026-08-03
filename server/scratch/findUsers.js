const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const find = async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'mining' });
  const users = await User.find({}, 'fullName username email role');
  console.log('Users in database:', users);
  await mongoose.disconnect();
};

find();
