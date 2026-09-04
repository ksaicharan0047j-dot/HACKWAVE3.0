import React, { useEffect, useState } from "react";
import "./Settings.css";

export default function Settings() {
  const [open, setOpen] = useState(false);

  const [voice, setVoice] = useState(true);
  const [camera, setCamera] = useState(false);
  const [screen, setScreen] = useState(false);

  useEffect(() => {
    const openSettings = () => {
      setOpen(true);
    };

    const closeSettings = () => {
      setOpen(false);
    };

    window.addEventListener(
      "jarvis:settings",
      openSettings
    );

    window.addEventListener(
      "jarvis:settings:close",
      closeSettings
    );

    return () => {
      window.removeEventListener(
        "jarvis:settings",
        openSettings
      );

      window.removeEventListener(
        "jarvis:settings:close",
        closeSettings
      );
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  if (!open) {
    return null;
  }

  const SettingToggle = ({
    icon,
    title,
    description,
    enabled,
    setEnabled,
  }) => {
    return (
      <div className="setting-card">

        <div className="setting-icon">
          {icon}
        </div>

        <div className="setting-info">

          <h3>{title}</h3>

          <p>{description}</p>

        </div>

        <button
          className={`setting-toggle ${
            enabled ? "active" : ""
          }`}
          onClick={() =>
            setEnabled((value) => !value)
          }
        >
          <span />
        </button>

      </div>
    );
  };

  return (
    <div className="settings-overlay">

      <div
        className="settings-backdrop"
        onClick={() => setOpen(false)}
      />

      <div className="settings-panel">

        <div className="settings-header">

          <div>
            <span className="settings-small-title">
              JARVIS SYSTEM
            </span>

            <h2>
              Settings
            </h2>
          </div>

          <button
            className="settings-close"
            onClick={() => setOpen(false)}
          >
            ×
          </button>

        </div>

        <div className="settings-line" />

        <div className="settings-section-title">
          SYSTEM CONTROLS
        </div>

        <SettingToggle
          icon="🎙️"
          title="Voice Control"
          description="Allow JARVIS to listen for voice commands."
          enabled={voice}
          setEnabled={setVoice}
        />

        <SettingToggle
          icon="📷"
          title="Camera Control"
          description="Enable camera-based interaction."
          enabled={camera}
          setEnabled={setCamera}
        />

        <SettingToggle
          icon="🖥️"
          title="Screen Control"
          description="Enable screen interaction features."
          enabled={screen}
          setEnabled={setScreen}
        />

        <div className="settings-footer">

          <span className="system-status-dot" />

          <span>
            SYSTEM CONFIGURATION
          </span>

          <span className="status-online">
            ONLINE
          </span>

        </div>

      </div>
    </div>
  );
}