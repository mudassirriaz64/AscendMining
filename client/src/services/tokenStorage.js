export const getAccessToken = () => {
  return sessionStorage.getItem('accessToken');
};

export const getRefreshToken = () => {
  return sessionStorage.getItem('refreshToken');
};

export const setTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) {
    sessionStorage.setItem('accessToken', accessToken);
  }
  if (refreshToken) {
    sessionStorage.setItem('refreshToken', refreshToken);
  }
};

export const clearTokens = () => {
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
};

export default {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
};
