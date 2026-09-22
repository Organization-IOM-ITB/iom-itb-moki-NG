'use client';

import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useServerInsertedHTML } from 'next/navigation';
import { ReactNode, useState } from 'react';

interface ThemeRegistryProps {
  children: ReactNode;
}

// Palet & tipografi mengikuti app/iom-tokens.css (sumber kebenaran bersama
// untuk semua UI IOM-ITB). Sebelumnya tema ini sama sekali tidak punya
// palette, sehingga seluruh komponen MUI tampil memakai biru bawaan
// (#1976d2) dan bukan biru IOM.
const adminTheme = createTheme({
  palette: {
    primary: {
      main: '#003793',
      dark: '#002B73',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#EA8389',
      dark: '#BF4B52',
      contrastText: '#FFFFFF',
    },
    success: { main: '#0F9D58' },
    error: { main: '#EF4444' },
    warning: { main: '#F59E0B' },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
    divider: '#E2E8F0',
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: 'var(--font-dm-sans), sans-serif',
    fontWeightMedium: 600,
    fontWeightBold: 700,
    h1: { fontWeight: 600, letterSpacing: '-0.011em' },
    h2: { fontWeight: 600, letterSpacing: '-0.008em' },
    h3: { fontWeight: 600, letterSpacing: '-0.008em' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
  },
});

export default function ThemeRegistry({ children }: ThemeRegistryProps) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: 'mui' });
    cache.compat = true;

    const prevInsert = cache.insert;
    let inserted: string[] = [];

    cache.insert = (...args: Parameters<typeof prevInsert>) => {
      const serialized = args[1];

      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }

      return prevInsert(...args);
    };

    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };

    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();

    if (names.length === 0) {
      return null;
    }

    let styles = '';

    for (const name of names) {
      const style = cache.inserted[name];

      if (typeof style === 'string') {
        styles += style;
      }
    }

    return (
      <style
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={adminTheme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}
