import { useState, useEffect, createContext, useContext } from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

function MyApp({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Component {...pageProps} />
    </ThemeContext.Provider>
  );
}

export default MyApp;

export const useTheme = () => useContext(ThemeContext);
