const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(res, req.body);
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const result = await authService.adminLogin(res, req.body);
    res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      data: {
        admin: result.admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!rawRefreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is required.',
          status: 401,
        },
      });
    }
    await authService.refreshAccessToken(res, rawRefreshToken);
    res.status(200).json({
      success: true,
      message: 'Token refreshed.',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(res);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const checkAvailability = async (req, res, next) => {
  try {
    const { email, username } = req.query;
    const result = await authService.checkAvailability({ email, username });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  refreshToken,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  checkAvailability,
};
