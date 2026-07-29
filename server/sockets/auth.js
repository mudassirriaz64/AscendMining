const { verifyAccessToken } = require('../utils/tokenUtils');
const userRepository = require('../repositories/user.repository');
const Admin = require('../models/Admin');

module.exports = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
      || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return next(new Error('Authentication required.'));
    const decoded = verifyAccessToken(token);
    if (decoded.role === 'admin' || decoded.role === 'support_agent') {
      const admin = await Admin.findById(decoded.id).select('_id role status');
      if (!admin || admin.status === 'suspended') return next(new Error('Unauthorized.'));
      socket.user = { id: admin._id.toString(), role: admin.role };
    } else {
      const user = await userRepository.findById(decoded.id);
      if (!user || user.status === 'suspended') return next(new Error('Unauthorized.'));
      socket.user = { id: user._id.toString(), role: 'investor' };
    }
    return next();
  } catch (error) {
    return next(new Error('Invalid authentication token.'));
  }
};
