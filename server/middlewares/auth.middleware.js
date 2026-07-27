const { verifyAccessToken } = require('../utils/tokenUtils');
const userRepository = require('../repositories/user.repository');
const Admin = require('../models/Admin');

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
          status: 401,
        },
      });
    }

    const decoded = verifyAccessToken(token);

    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Admin not found.',
            status: 401,
          },
        });
      }

      if (admin.status === 'suspended') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'ACCOUNT_SUSPENDED',
            message: 'Your account has been suspended.',
            status: 401,
          },
        });
      }

      req.user = { id: admin._id, role: admin.role, status: admin.status };
      return next();
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found.',
          status: 401,
        },
      });
    }

    if (user.status === 'suspended') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended.',
          status: 401,
        },
      });
    }

    req.user = { id: user._id, role: user.role, status: user.status };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired.',
          status: 401,
        },
      });
    }
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid authentication token.',
        status: 401,
      },
    });
  }
};

module.exports = authMiddleware;
