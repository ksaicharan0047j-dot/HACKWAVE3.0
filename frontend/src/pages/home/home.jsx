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
  const recognitionRef = useRef(null);

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

  const [approvalRequired, setApprovalRequired] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState(null);

  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const currentTheme = THEMES[theme];

  /* =========================================================
     APPLY THEME
     ========================================================= */

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

  /* =========================================================
     MICROPHONE LEVEL
     ========================================================= */

  useEffect(() => {
    let mounted = true;

    const startMic = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        if (!mounted) return;

        streamRef.current = stream;

        const AudioContext =
          window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) return;

        const context = new AudioContext();
        const analyser = context.createAnalyser();

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = context;

        const data = new Uint8Array(analyser.frequencyBinCount);

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
            orbRef.current.style.setProperty("--voice", level);
          }

          animationRef.current = requestAnimationFrame(loop);
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

  /* =========================================================
     SPEECH RECOGNITION
     ========================================================= */

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setAgentStatus("LISTENING");
      setAgentResponse("");
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript += event.results[i][0].transcript;
      }

      transcript = transcript.trim();

      if (transcript) {
        setCommand(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.log(
        "Speech recognition error:",
        event.error
      );

      setIsListening(false);

      if (event.error === "not-allowed") {
        setAgentStatus("ERROR");
        setAgentResponse(
          "Microphone permission was denied."
        );
      } else {
        setAgentStatus("IDLE");
      }
    };

    recognition.onend = () => {
      setIsListening(false);

      setAgentStatus((current) =>
        current === "LISTENING" ? "IDLE" : current
      );
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  /* =========================================================
     TALK
     ========================================================= */

  const toggleListening = () => {
    if (isRunning || isDeploying) return;

    if (!voiceSupported) {
      setAgentStatus("ERROR");
      setAgentResponse(
        "Voice recognition is not supported in this browser."
      );
      return;
    }

    const recognition = recognitionRef.current;

    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      setAgentStatus("IDLE");
      return;
    }

    try {
      setCommand("");
      setAgentResponse("");
      recognition.start();
    } catch (error) {
      console.log(
        "Unable to start speech recognition:",
        error
      );
    }
  };

  /* =========================================================
     COMMAND
     ========================================================= */

  const sendCommand = async () => {
    const text = command.trim();

    if (!text || isRunning || isDeploying) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setCommand("");
    setAgentResponse("");
    setAgentStatus("EXECUTING");
    setIsRunning(true);

    setApprovalRequired(false);
    setPreviewUrl("");
    setRepoUrl("");
    setDeploymentResult(null);

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

      setAgentStatus(
        data.approval_required
          ? "APPROVAL"
          : "SUCCESS"
      );

      setAgentResponse(
        data.result || "Task completed."
      );

      if (data.approval_required) {
        setApprovalRequired(true);

        setPreviewUrl(
          data.preview_url || ""
        );

        setRepoUrl(
          data.repo_url || ""
        );
      }
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

  /* =========================================================
     APPROVE DEPLOYMENT
     ========================================================= */

  const approveDeployment = async () => {
    const cleanRepo = repoUrl.trim();

    if (!cleanRepo) {
      setAgentStatus("ERROR");
      setAgentResponse(
        "Please enter your GitHub repository URL."
      );
      return;
    }

    setIsDeploying(true);
    setAgentStatus("DEPLOYING");

    setAgentResponse(
      "Approval received. Pushing project to GitHub..."
    );

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/agent/approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approved: true,
            repo_url: cleanRepo,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Deployment failed."
        );
      }

      setApprovalRequired(false);
      setDeploymentResult(data);

      if (data.vercel) {
        setAgentStatus("DEPLOYED");
      } else {
        setAgentStatus("SUCCESS");
      }

      setAgentResponse(
        data.message ||
          "Deployment completed successfully."
      );
    } catch (error) {
      setAgentStatus("ERROR");

      setAgentResponse(
        error.message ||
          "Unable to process deployment."
      );
    } finally {
      setIsDeploying(false);
    }
  };

  /* =========================================================
     REJECT DEPLOYMENT
     ========================================================= */

  const rejectDeployment = async () => {
    if (isDeploying) return;

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/agent/approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approved: false,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "[VEXORITE] Deployment rejected:",
        data
      );
    } catch (error) {
      console.log(
        "Unable to notify backend about rejection:",
        error
      );
    }

    setApprovalRequired(false);
    setPreviewUrl("");
    setRepoUrl("");
    setDeploymentResult(null);

    setAgentStatus("IDLE");

    setAgentResponse(
      "Deployment cancelled."
    );
  };

  /* =========================================================
     KEYBOARD
     ========================================================= */

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendCommand();
    }
  };

  /* =========================================================
     PROFILE
     ========================================================= */

  const toggleProfile = () => {
    setProfileOpen((value) => !value);
  };

  const closeProfile = () => {
    setProfileOpen(false);
  };

  /* =========================================================
     NAVIGATION
     ========================================================= */

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

      {/* =====================================================
          PROFILE BLUR
          ===================================================== */}

      {profileOpen && (
        <div
          className="profile-blur"
          onClick={closeProfile}
        />
      )}

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="jarvis-header">

        {/* PROFILE */}

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

      {/* =====================================================
          MAIN ORB
          ===================================================== */}

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

            {agentStatus === "LISTENING" &&
              "LISTENING..."}

            {agentStatus === "EXECUTING" &&
              "EXECUTING COMMAND..."}

            {agentStatus === "SUCCESS" &&
              agentResponse}

            {agentStatus === "APPROVAL" &&
              "WEBSITE VERIFIED — AWAITING APPROVAL"}

            {agentStatus === "DEPLOYING" &&
              "DEPLOYING TO GITHUB + VERCEL..."}

            {agentStatus === "DEPLOYED" &&
              "DEPLOYMENT COMPLETE"}

            {agentStatus === "ERROR" &&
              agentResponse}

            {![
              "IDLE",
              "LISTENING",
              "EXECUTING",
              "SUCCESS",
              "APPROVAL",
              "DEPLOYING",
              "DEPLOYED",
              "ERROR",
            ].includes(agentStatus) &&
              agentResponse}
          </div>

          <div className="voice-level">
            {agentStatus} • VOICE{" "}
            {Math.round(voiceLevel * 100)}%
          </div>

        </div>

      </main>

      {/* =====================================================
          DEPLOYMENT APPROVAL
          IMPORTANT: OUTSIDE jarvis-main
          ===================================================== */}

      {approvalRequired && (
        <div className="deployment-panel">

          <div className="deployment-panel-label">
            WEBSITE VERIFIED
          </div>

          <div className="deployment-panel-title">
            READY FOR DEPLOYMENT
          </div>

          {previewUrl && (
            <a
              className="deployment-preview"
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
            >
              OPEN PUBLIC PREVIEW ↗
            </a>
          )}

          <div className="deployment-question">
            Enter the GitHub repository and approve deployment.
          </div>

          <input
            type="text"
            className="repo-input"
            value={repoUrl}
            onChange={(e) =>
              setRepoUrl(e.target.value)
            }
            placeholder="https://github.com/username/repository"
            disabled={isDeploying}
            autoComplete="off"
          />

          <div className="deployment-actions">

            <button
              type="button"
              className="deployment-approve"
              onClick={approveDeployment}
              disabled={
                isDeploying ||
                !repoUrl.trim()
              }
            >
              {isDeploying
                ? "DEPLOYING..."
                : "APPROVE"}
            </button>

            <button
              type="button"
              className="deployment-reject"
              onClick={rejectDeployment}
              disabled={isDeploying}
            >
              REJECT
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          DEPLOYMENT COMPLETE
          ===================================================== */}

      {deploymentResult?.vercel_url && (
        <div className="deployment-panel deployed-panel">

          <div className="deployment-panel-label">
            DEPLOYMENT COMPLETE
          </div>

          <div className="deployment-panel-title">
            🚀 VEXORITE IS LIVE
          </div>

          <a
            className="deployment-preview"
            href={deploymentResult.vercel_url}
            target="_blank"
            rel="noreferrer"
          >
            OPEN LIVE VERCEL SITE ↗
          </a>

          {deploymentResult.repo_url && (
            <a
              className="deployment-repo"
              href={deploymentResult.repo_url}
              target="_blank"
              rel="noreferrer"
            >
              VIEW GITHUB REPOSITORY ↗
            </a>
          )}

        </div>
      )}

      {/* =====================================================
          COMMAND
          ===================================================== */}

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
            disabled={isRunning || isDeploying}
            placeholder={
              isListening
                ? "VEXORITE IS LISTENING..."
                : isRunning
                ? "VEXORITE IS WORKING..."
                : "Tell Vexorite what to do..."
            }
          />

          <button
            className={`voice-button ${
              isListening ? "listening" : ""
            }`}
            onClick={toggleListening}
            disabled={isRunning || isDeploying}
            aria-label={
              isListening
                ? "Stop listening"
                : "Talk to Vexorite"
            }
            title={
              isListening
                ? "Stop listening"
                : "Talk to Vexorite"
            }
          >
            {isListening ? "■" : "🎙"}
          </button>

          <button
            className="command-send"
            onClick={sendCommand}
            disabled={
              isRunning ||
              isDeploying ||
              !command.trim()
            }
          >
            {isRunning
              ? "RUNNING"
              : "EXECUTE"}
          </button>

        </div>

      </div>

      {/* =====================================================
          EXISTING COMPONENTS
          ===================================================== */}

      <Project />
      <Settings />
      <Themes />

    </div>
  );
}