import React, { useEffect, useState } from "react";
import "./settings.css";

export default function Settings() {
  const [open, setOpen] = useState(false);
  const [voice, setVoice] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [autoVerify, setAutoVerify] = useState(true);

  useEffect(() => {
    const handler = () => setOpen(true);

    window.addEventListener(
      "jarvis:settings",
      handler
    );

    return () => {
      window.removeEventListener(
        "jarvis:settings",
        handler
      );
    };
  }, []);

  if (!open) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-window">

        <button
          className="settings-close"
          onClick={() => setOpen(false)}
        >
          ×
        </button>

        <div className="settings-title">
          VEXORITE SETTINGS
        </div>

        <div className="settings-subtitle">
          AGENT CONFIGURATION
        </div>

        <div className="settings-list">

          <label className="setting-row">
            <div>
              <strong>VOICE INPUT</strong>
              <span>
                Enable microphone interaction
              </span>
            </div>

            <input
              type="checkbox"
              checked={voice}
              onChange={(e) =>
                setVoice(e.target.checked)
              }
            />
          </label>

          <label className="setting-row">
            <div>
              <strong>ORBIT ANIMATION</strong>
              <span>
                Enable visual agent animation
              </span>
            </div>

            <input
              type="checkbox"
              checked={animations}
              onChange={(e) =>
                setAnimations(e.target.checked)
              }
            />
          </label>

          <label className="setting-row">
            <div>
              <strong>AUTO VERIFICATION</strong>
              <span>
                Verify generated websites
              </span>
            </div>

            <input
              type="checkbox"
              checked={autoVerify}
              onChange={(e) =>
                setAutoVerify(e.target.checked)
              }
            />
          </label>

        </div>

        <div className="settings-footer">
          VEXORITE CORE • ONLINE
        </div>

      </div>
    </div>
  );
}