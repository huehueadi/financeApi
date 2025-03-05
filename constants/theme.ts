import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0066CC',
    secondary: '#4CAF50',
    error: '#F44336',
    background: '#f5f5f5',
    surface: '#FFFFFF',
    text: '#333333',
  },
  fonts: {
    ...MD3LightTheme.fonts,
    regular: {
      fontFamily: 'Inter-Regular',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'Inter-Medium',
      fontWeight: 'normal',
    },
    light: {
      fontFamily: 'Inter-Regular',
      fontWeight: 'normal',
    },
    thin: {
      fontFamily: 'Inter-Regular',
      fontWeight: 'normal',
    },
  },
};