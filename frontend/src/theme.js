import { createTheme } from '@mui/material/styles';

// ---- Design tokens ----
// bg      #0A0E14  near-black, blue-tinted base
// panel   #10151D  raised surface
// line    #1E2733  hairline borders
// signal  #22D3EE  primary accent (scan/signal cyan)
// pulse   #6366F1  secondary accent (indigo)
// safe    #34D399  semantic: secure / ok
// warn    #FBBF24  semantic: medium risk
// danger  #F43F5E  semantic: high risk / critical
// text    #E7EDF3  primary text
// muted   #8A97A8  secondary text

export const tokens = {
  bg: '#0A0E14',
  panel: '#10151D',
  panelAlt: '#0D1218',
  line: '#1E2733',
  signal: '#22D3EE',
  pulse: '#6366F1',
  safe: '#34D399',
  warn: '#FBBF24',
  danger: '#F43F5E',
  text: '#E7EDF3',
  muted: '#8A97A8',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: tokens.bg, paper: tokens.panel },
    primary: { main: tokens.signal, contrastText: '#04141A' },
    secondary: { main: tokens.pulse },
    success: { main: tokens.safe },
    warning: { main: tokens.warn },
    error: { main: tokens.danger },
    text: { primary: tokens.text, secondary: tokens.muted },
    divider: tokens.line,
  },
  typography: {
    fontFamily: "'Inter', Helvetica, Arial, sans-serif",
    h1: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
    h2: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
    h3: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 },
    h4: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 },
    h5: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 },
    h6: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});

export default theme;
