export interface Theme {
  palette: {
    bg: string;
    surface: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    secondary: string;
    secondaryText: string;
    danger: string;
    dangerText: string;
    success: string;
    successText: string;
    border: string;
    blue: string;
    gray_10: string;
    gray_30: string;
    gray_100: string;
    brown_50: string;
    green: string;
    white: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadow: {
    sm: string;
    md: string;
  };
  typography: {
    h1: {
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
    };
    h2: {
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
    };
    body: {
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
    };
    small: {
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
    };
  };
}

const pallete = {
  blue: "#0D2231",
  gray_10: "#E3EDF5",
  gray_30: "#B4C2C6",
  gray_100: "#8C99A2",
  brown_50: "#B1B6AE",
  green: "#53D46B",
  white: "#ecf3f5"
};

export const lightTheme: Theme = {
  palette: {
    bg: pallete.blue,
    surface: "#1A3A4A",
    text: "#ffffff",
    textMuted: "#94A3B8",
    primary: pallete.green,
    primaryText: "#0D2231",
    secondary: "#2A4A5A",
    secondaryText: "#ffffff",
    danger: "#E53E3E",
    dangerText: "#ffffff",
    success: pallete.green,
    successText: "#0D2231",
    border: "#2A4A5A",
    ...pallete
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "20px",
    xl: "24px"
  },
  radius: {
    sm: "4px",
    md: "8px",
    lg: "12px"
  },
  shadow: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.1)",
    md: "0 2px 4px rgba(0, 0, 0, 0.1)"
  },
  typography: {
    h1: {
      fontSize: "24px",
      fontWeight: "bold",
      lineHeight: "1.2"
    },
    h2: {
      fontSize: "20px",
      fontWeight: "600",
      lineHeight: "1.3"
    },
    body: {
      fontSize: "16px",
      fontWeight: "400",
      lineHeight: "1.5"
    },
    small: {
      fontSize: "14px",
      fontWeight: "400",
      lineHeight: "1.4"
    }
  }
};

export const darkTheme: Theme = {
  palette: {
    bg: "#1a1a1a",
    surface: "#2d2d2d",
    text: "#ffffff",
    textMuted: "#999999",
    primary: "#007bff",
    primaryText: "#ffffff",
    secondary: "#6c757d",
    secondaryText: "#ffffff",
    danger: "#dc3545",
    dangerText: "#ffffff",
    success: "#28a745",
    successText: "#ffffff",
    border: "#404040",
    ...pallete
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "20px",
    xl: "24px"
  },
  radius: {
    sm: "4px",
    md: "8px",
    lg: "12px"
  },
  shadow: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.3)",
    md: "0 2px 4px rgba(0, 0, 0, 0.3)"
  },
  typography: {
    h1: {
      fontSize: "24px",
      fontWeight: "bold",
      lineHeight: "1.2"
    },
    h2: {
      fontSize: "20px",
      fontWeight: "600",
      lineHeight: "1.3"
    },
    body: {
      fontSize: "16px",
      fontWeight: "400",
      lineHeight: "1.5"
    },
    small: {
      fontSize: "14px",
      fontWeight: "400",
      lineHeight: "1.4"
    }
  }
};

function hexToRgb(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16
      )}`
    : null;
}

export function getThemeFromTelegram(telegramThemeParams?: any): Theme | null {
  if (!telegramThemeParams) return null;

  const isDark = telegramThemeParams.color_scheme === "dark";
  const baseTheme = isDark ? darkTheme : lightTheme;

  const bgColor = telegramThemeParams.bg_color
    ? `#${telegramThemeParams.bg_color.toString(16).padStart(6, "0")}`
    : null;
  const textColor = telegramThemeParams.text_color
    ? `#${telegramThemeParams.text_color.toString(16).padStart(6, "0")}`
    : null;
  const hintColor = telegramThemeParams.hint_color
    ? `#${telegramThemeParams.hint_color.toString(16).padStart(6, "0")}`
    : null;
  const linkColor = telegramThemeParams.link_color
    ? `#${telegramThemeParams.link_color.toString(16).padStart(6, "0")}`
    : null;
  const buttonColor = telegramThemeParams.button_color
    ? `#${telegramThemeParams.button_color.toString(16).padStart(6, "0")}`
    : null;

  if (!bgColor || !textColor) return null;

  return {
    ...baseTheme,
    palette: {
      ...baseTheme.palette,
      bg: bgColor,
      text: textColor,
      textMuted: hintColor || baseTheme.palette.textMuted,
      primary: linkColor || buttonColor || baseTheme.palette.primary,
      surface: isDark ? "#2d2d2d" : "#1A3A4A",
      ...pallete
    }
  };
}
