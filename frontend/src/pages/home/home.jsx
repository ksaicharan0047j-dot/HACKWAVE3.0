import React, { useEffect, useRef, useState } from "react";
import "./home.css";
import Settings from "../settings/seetings";
import Project from "../projects/projects";
import Themes from "../themes/themes";

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

export default function Home() {
  const orbRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);

  const [theme, setTheme] = useState(
    localStorage.getItem("vexorite-theme") || "CYAN"
  );

  const [voiceLevel, setVoiceLevel] = useState(0);

  const [command, setCommand] = useState("");
  const [agentStatus, setAgentStatus] = useState("IDLE");
  const [agentResponse, setAgentResponse] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const currentTheme = THEMES[theme];

  /* APPLY THEME TO ENTIRE PAGE */

  useEffect(() => {
    const root = document.documentElement;
    const selected = THEMES[theme];

    root.style.setProperty("--vex-primary", selected.primary);
    root.style.setProperty("--vex-secondary", selected.secondary);
    root.style.setProperty("--vex-background", selected.background);
    root.style.setProperty("--vex-panel", selected.panel);

    localStorage.setItem("vexorite-theme", theme);

    window.dispatchEvent(
      new CustomEvent("vexorite:theme", {
        detail: selected,
      })
    );
  }, [theme]);

  /* MICROPHONE */

  useEffect(() => {
    let mounted = true;

    const startMic = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;

        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: true,
          });

        if (!mounted) return;

        streamRef.current = stream;

        const AudioContext =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContext) return;

        const context = new AudioContext();

        const analyser = context.createAnalyser();

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        const source =
          context.createMediaStreamSource(stream);

        source.connect(analyser);

        audioContextRef.current = context;

        const data = new Uint8Array(
          analyser.frequencyBinCount
        );

        const loop = () => {
          if (!mounted) return;

          analyser.getByteFrequencyData(data);

          let total = 0;

          for (let i = 0; i < data.length; i++) {
            total += data[i];
          }

          const level = Math.min(
            1,
            (total / data.length / 255) * 3
          );

          setVoiceLevel(level);

          if (orbRef.current) {
            orbRef.current.style.setProperty(
              "--voice",
              level
            );
          }

          animationRef.current =
            requestAnimationFrame(loop);
        };

        loop();
      } catch {
        console.log("Microphone unavailable.");
      }
    };

    startMic();

    return () => {
      mounted = false;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  /* COMMAND */

  const sendCommand = async () => {
    const text = command.trim();

    if (!text || isRunning) return;

    setCommand("");
    setAgentResponse("");
    setAgentStatus("EXECUTING");
    setIsRunning(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/agent/run",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            command: text,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Agent request failed."
        );
      }

      setAgentStatus("SUCCESS");
      setAgentResponse(
        data.result || "Task completed."
      );
    } catch (error) {
      setAgentStatus("ERROR");
      setAgentResponse(
        error.message ||
          "Unable to reach VEXORITE backend."
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendCommand();
    }
  };

  /* PROFILE */

  const toggleProfile = () => {
    setProfileOpen((value) => !value);
  };

  const closeProfile = () => {
    setProfileOpen(false);
  };

  /* NAVIGATION */

  const openProjects = () => {
    setActivePanel("projects");
    setProfileOpen(false);

    window.dispatchEvent(
      new Event("jarvis:projects")
    );
  };

  const openSettings = () => {
    setActivePanel("settings");
    setProfileOpen(false);

    window.dispatchEvent(
      new Event("jarvis:settings")
    );
  };

  const openThemes = () => {
    setActivePanel("themes");
    setProfileOpen(false);

    window.dispatchEvent(
      new Event("vexorite:themes")
    );
  };

  return (
    <div
      className={`jarvis-home ${
        profileOpen ? "profile-active" : ""
      }`}
      style={{
        "--theme-primary": currentTheme.primary,
        "--theme-secondary": currentTheme.secondary,
      }}
    >

      {/* BLUR LAYER */}

      {profileOpen && (
        <div
          className="profile-blur"
          onClick={closeProfile}
        />
      )}

      {/* HEADER */}

      <header className="jarvis-header">

        {/* PFP */}

        <div className="profile-container">

          <button
            className={`pfp-button ${
              profileOpen ? "active" : ""
            }`}
            onClick={toggleProfile}
            aria-label="Open profile"
          >
            <span className="pfp-ring">
              <span className="pfp-face">V</span>
            </span>
          </button>

          {/* PROFILE MENU */}

          {profileOpen && (
            <div className="profile-menu">

              <div className="profile-menu-header">
                <div className="menu-pfp">
                  V
                </div>

                <div>
                  <div className="menu-name">
                    VEXORITE
                  </div>

                  <div className="menu-status">
                    ● SYSTEM USER
                  </div>
                </div>
              </div>

              <div className="menu-divider" />

              <button
                className="profile-menu-button"
                onClick={openProjects}
              >
                <span>◈</span>
                PROJECTS
              </button>

              <button
                className="profile-menu-button"
                onClick={openSettings}
              >
                <span>⚙</span>
                SETTINGS
              </button>

              <button
                className="profile-menu-button"
                onClick={openThemes}
              >
                <span>◇</span>
                THEMES
              </button>

            </div>
          )}
        </div>

        {/* BRAND */}

        <div className="jarvis-brand">
          <div className="brand-dot" />

          <div>
            <div className="brand-title">
              VEXORITE
            </div>

            <div className="brand-subtitle">
              AUTONOMOUS AI AGENT
            </div>
          </div>
        </div>

        {/* STATUS */}

        <div className="header-status">
          <span className="status-indicator" />
          SYSTEM ONLINE
        </div>

      </header>

      {/* MAIN */}

      <main className="jarvis-main">

        <div
          className="jarvis-orb"
          ref={orbRef}
          style={{
            "--voice": voiceLevel,
          }}
        >

          <div className="orb-mist orb-mist-1" />
          <div className="orb-mist orb-mist-2" />
          <div className="orb-mist orb-mist-3" />

          <div className="orb-glow" />

          <div className="orb-body">

            <div className="orb-liquid orb-liquid-1" />
            <div className="orb-liquid orb-liquid-2" />
            <div className="orb-liquid orb-liquid-3" />

            <div className="orb-smoke orb-smoke-1" />
            <div className="orb-smoke orb-smoke-2" />
            <div className="orb-smoke orb-smoke-3" />

            <div className="orb-highlight" />

            <div className="orb-core">
              <div className="core-light" />
            </div>

          </div>
        </div>

        <div className="jarvis-system-text">

          <div className="system-title">
            VEXORITE
          </div>

          <div
            className={`system-message ${agentStatus.toLowerCase()}`}
          >
            {agentStatus === "IDLE" &&
              "READY — GIVE ME A TASK"}

            {agentStatus === "EXECUTING" &&
              "EXECUTING COMMAND..."}

            {agentStatus === "SUCCESS" &&
              agentResponse}

            {agentStatus === "ERROR" &&
              agentResponse}
          </div>

          <div className="voice-level">
            {agentStatus} • VOICE{" "}
            {Math.round(voiceLevel * 100)}%
          </div>

        </div>
      </main>

      {/* COMMAND */}

      <div className="jarvis-command-area">

        <div className="command-box">

          <span className="command-prefix">
            VEX &gt;
          </span>

          <input
            value={command}
            onChange={(e) =>
              setCommand(e.target.value)
            }
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            placeholder={
              isRunning
                ? "VEXORITE IS WORKING..."
                : "Tell Vexorite what to do..."
            }
          />

          <button
            className="command-send"
            onClick={sendCommand}
            disabled={
              isRunning || !command.trim()
            }
          >
            {isRunning
              ? "RUNNING"
              : "EXECUTE"}
          </button>

        </div>

      </div>

      {/* EXISTING COMPONENTS */}

      <Project />
      <Settings />
      <Themes/>
    </div>
  );
}