import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { LazyMotion, domMax } from 'framer-motion';
import store from './store/store';
import { ThemeProvider } from './theme/ThemeProvider';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <Provider store={store}>
        <LazyMotion features={domMax} strict>
          <App />
        </LazyMotion>
      </Provider>
    </ThemeProvider>
  </StrictMode>
);
