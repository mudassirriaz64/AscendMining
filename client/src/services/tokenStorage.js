export const getAccessToken = () => {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
};

export const setTokens = ({ accessToken, refreshToken, keepLoggedIn }) => {
  if (keepLoggedIn) {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

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
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export default {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
};
