import React, { useEffect, useState } from "react";
import "./settings.css";

const readSetting = (key, fallback = true) =>
  localStorage.getItem(key) !== "false"
    ? fallback
    : false;

export default function Settings() {
  const [open, setOpen] = useState(false);

  const [microphone, setMicrophone] = useState(
    readSetting("vexorite-microphone")
  );

  const [camera, setCamera] = useState(
    readSetting("vexorite-camera")
  );

  const [gestures, setGestures] = useState(
    readSetting("vexorite-gestures")
  );

  useEffect(() => {
    const handler = () => {
      setMicrophone(
        localStorage.getItem("vexorite-microphone") !== "false"
      );
      setCamera(
        localStorage.getItem("vexorite-camera") !== "false"
      );
      setGestures(
        localStorage.getItem("vexorite-gestures") !== "false"
      );
      setOpen(true);
    };

    window.addEventListener(
      "vexorite:settings",
      handler
    );

    // Keep compatibility with the current Home event.
    window.addEventListener(
      "jarvis:settings",
      handler
    );

    return () => {
      window.removeEventListener(
        "vexorite:settings",
        handler
      );

      window.removeEventListener(
        "jarvis:settings",
        handler
      );
    };
  }, []);

  const update = (name, value) => {
    const key = `vexorite-${name}`;

    localStorage.setItem(
      key,
      String(value)
    );

    const next = {
      microphone:
        localStorage.getItem("vexorite-microphone") !== "false",
      camera:
        localStorage.getItem("vexorite-camera") !== "false",
      gestures:
        localStorage.getItem("vexorite-gestures") !== "false",
    };

    window.dispatchEvent(
      new CustomEvent("vexorite:device-settings", {
        detail: next,
      })
    );
  };

  if (!open) return null;

  return (
    <div
      className="settings-overlay"
      onClick={() => setOpen(false)}
    >
      <div
        className="settings-window"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="settings-close"
          onClick={() => setOpen(false)}
          aria-label="Close settings"
        >
          ×
        </button>

        <div className="settings-title">
          VEXORITE SETTINGS
        </div>

        <div className="settings-subtitle">
          PRIVACY & DEVICE CONTROL
        </div>

        <div className="settings-list">
          <label className="setting-row">
            <div>
              <strong>MICROPHONE</strong>
              <span>
                Allow VEXORITE to use voice input
              </span>
            </div>

            <input
              type="checkbox"
              checked={microphone}
              onChange={(event) => {
                const value = event.target.checked;
                setMicrophone(value);
                update("microphone", value);
              }}
            />
          </label>

          <label className="setting-row">
            <div>
              <strong>CAMERA</strong>
              <span>
                Allow camera access for hand tracking
              </span>
            </div>

            <input
              type="checkbox"
              checked={camera}
              onChange={(event) => {
                const value = event.target.checked;
                setCamera(value);

                if (!value && gestures) {
                  setGestures(false);
                  update("gestures", false);
                }

                update("camera", value);
              }}
            />
          </label>

          <label className="setting-row">
            <div>
              <strong>GESTURE CONTROL</strong>
              <span>
                Enable hand gestures for social feeds
              </span>
            </div>

            <input
              type="checkbox"
              checked={gestures}
              disabled={!camera}
              onChange={(event) => {
                const value = event.target.checked;
                setGestures(value);
                update("gestures", value);
              }}
            />
          </label>
        </div>

        <div className="settings-footer">
          VEXORITE CORE • DEVICE ACCESS CONTROL
        </div>
      </div>
    </div>
  );
}
