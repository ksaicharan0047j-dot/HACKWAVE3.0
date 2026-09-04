import React, { useEffect, useState } from "react";
import "./themes.css";

const THEMES = {
  CYAN: {
    primary: "#00eaff",
    secondary: "#0077ff",
    background: "#020b12",
    panel: "#071923",
  },

  VIOLET: {
    primary: "#a970ff",
    secondary: "#6428ff",
    background: "#080412",
    panel: "#130a22",
  },

  PINK: {
    primary: "#ff65d8",
    secondary: "#ff237c",
    background: "#12030d",
    panel: "#220916",
  },

  GREEN: {
    primary: "#36ff9b",
    secondary: "#00a86b",
    background: "#02100a",
    panel: "#071c12",
  },

  ORANGE: {
    primary: "#ffad52",
    secondary: "#ff4d00",
    background: "#120903",
    panel: "#211108",
  },
};

export default function Themes() {
  const [open, setOpen] = useState(false);

  const [selected, setSelected] = useState(
    localStorage.getItem("vexorite-theme") || "CYAN"
  );

  useEffect(() => {
    const handler = () => {
      setSelected(
        localStorage.getItem("vexorite-theme") || "CYAN"
      );

      setOpen(true);
    };

    window.addEventListener(
      "vexorite:themes",
      handler
    );

    return () => {
      window.removeEventListener(
        "vexorite:themes",
        handler
      );
    };
  }, []);

  const chooseTheme = (name) => {
    const theme = THEMES[name];

    setSelected(name);

    localStorage.setItem(
      "vexorite-theme",
      name
    );

    document.documentElement.style.setProperty(
      "--vex-primary",
      theme.primary
    );

    document.documentElement.style.setProperty(
      "--vex-secondary",
      theme.secondary
    );

    document.documentElement.style.setProperty(
      "--vex-background",
      theme.background
    );

    document.documentElement.style.setProperty(
      "--vex-panel",
      theme.panel
    );

    window.dispatchEvent(
      new CustomEvent("vexorite:theme-changed", {
        detail: {
          name,
          ...theme,
        },
      })
    );
  };

  if (!open) return null;

  return (
    <div className="themes-overlay">

      <div className="themes-window">

        <button
          className="themes-close"
          onClick={() => setOpen(false)}
        >
          ×
        </button>

        <div className="themes-title">
          VEXORITE THEMES
        </div>

        <div className="themes-subtitle">
          CHANGE CORE VISUAL SYSTEM
        </div>

        <div className="themes-grid">

          {Object.entries(THEMES).map(
            ([name, theme]) => (
              <button
                key={name}
                className={`theme-card ${
                  selected === name
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  chooseTheme(name)
                }
              >
                <span
                  className="theme-preview-dot"
                  style={{
                    background: theme.primary,
                    boxShadow:
                      `0 0 25px ${theme.primary}`,
                  }}
                />

                <span>{name}</span>
              </button>
            )
          )}

        </div>

        <div className="themes-current">
          ACTIVE THEME:
          <strong>{selected}</strong>
        </div>

      </div>
    </div>
  );
}