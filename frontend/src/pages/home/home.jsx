import React, { useEffect, useRef, useState } from "react";
import "./home.css";

import Settings from "../settings/seetings";
import Project from "../projects/projects";
import Themes from "../themes/themes";

import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

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

const MEDIAPIPE_WASM =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export default function Home() {
  const orbRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  /* =========================================================
     GESTURE REFERENCES
     ========================================================= */

  const gestureVideoRef = useRef(null);
  const gestureStreamRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const gestureAnimationRef = useRef(null);

  const lastHandYRef = useRef(null);
  const lastGestureTimeRef = useRef(0);

  /* =========================================================
     STATE
     ========================================================= */

  const [profileOpen, setProfileOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);

  const [theme, setTheme] = useState(
    localStorage.getItem("vexorite-theme") || "CYAN"
  );

  const [voiceLevel, setVoiceLevel] = useState(0);

  /* =========================================================
     DEVICE / PRIVACY SETTINGS
  ========================================================= */

  const [deviceSettings, setDeviceSettings] = useState(() => ({
    microphone:
      localStorage.getItem("vexorite-microphone") !== "false",
    camera:
      localStorage.getItem("vexorite-camera") !== "false",
    gestures:
      localStorage.getItem("vexorite-gestures") !== "false",
  }));

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

  /* =========================================================
     SOCIAL / GESTURE STATE
     ========================================================= */

  const [socialWindow, setSocialWindow] = useState(null);
  const [gestureActive, setGestureActive] = useState(false);
  const [gestureStatus, setGestureStatus] = useState(
    "GESTURE CONTROL OFF"
  );
  const [gestureReady, setGestureReady] = useState(false);

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
        detail: {
          ...selected,
          name: theme,
        },
      })
    );
  }, [theme]);

  /* =========================================================
     LISTEN FOR THEME CHANGES FROM THEMES COMPONENT
     ========================================================= */

  useEffect(() => {
    const handleThemeChange = (event) => {
      const requestedTheme = event.detail?.theme;

      if (
        requestedTheme &&
        Object.prototype.hasOwnProperty.call(
          THEMES,
          requestedTheme
        )
      ) {
        setTheme(requestedTheme);
      }
    };

    window.addEventListener(
      "vexorite:set-theme",
      handleThemeChange
    );

    window.addEventListener(
      "vexorite:theme-changed",
      handleThemeChange
    );

    return () => {
      window.removeEventListener(
        "vexorite:set-theme",
        handleThemeChange
      );

      window.removeEventListener(
        "vexorite:theme-changed",
        handleThemeChange
      );
    };
  }, []);

  /* =========================================================
     DEVICE SETTINGS BRIDGE
     ========================================================= */

  useEffect(() => {
    const handleDeviceSettings = (event) => {
      const next = event.detail;

      if (!next) return;

      setDeviceSettings((current) => ({
        ...current,
        ...next,
      }));
    };

    window.addEventListener(
      "vexorite:device-settings",
      handleDeviceSettings
    );

    return () => {
      window.removeEventListener(
        "vexorite:device-settings",
        handleDeviceSettings
      );
    };
  }, []);

  /* =========================================================
     MICROPHONE LEVEL
     ========================================================= */

  useEffect(() => {
    let mounted = true;

    const startMic = async () => {
      try {
        if (!deviceSettings.microphone) {
          setVoiceLevel(0);
          return;
        }

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

        const data =
          new Uint8Array(
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
        cancelAnimationFrame(
          animationRef.current
        );
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
  }, [deviceSettings.microphone]);

  useEffect(() => {
    if (deviceSettings.microphone) return;

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // Already closed.
      }

      audioContextRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped.
      }
    }

    setIsListening(false);
    setVoiceLevel(0);
  }, [deviceSettings.microphone]);

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

    const recognition =
      new SpeechRecognition();

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
        transcript +=
          event.results[i][0].transcript;
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
        current === "LISTENING"
          ? "IDLE"
          : current
      );
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Already stopped.
      }

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

    const recognition =
      recognitionRef.current;

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
     SOCIAL COMMAND DETECTION
     ========================================================= */

  const detectSocialCommand = (text) => {
    const normalized =
      text.toLowerCase();

    const youtube =
      normalized.includes("youtube") &&
      (
        normalized.includes("short") ||
        normalized.includes("shorts")
      );

    const instagram =
      normalized.includes("instagram") &&
      (
        normalized.includes("reel") ||
        normalized.includes("reels")
      );

    if (youtube) return "youtube";
    if (instagram) return "instagram";

    return null;
  };

  /* =========================================================
     OPEN SOCIAL WINDOW
     ========================================================= */

  const openSocialWindow = (platform) => {
    setSocialWindow(platform);

    if (deviceSettings.gestures && deviceSettings.camera) {
      setGestureStatus(
        "STARTING GESTURE CONTROL"
      );

      setGestureActive(true);
      setGestureReady(false);
    } else {
      setGestureStatus(
        deviceSettings.camera
          ? "GESTURE CONTROL OFF"
          : "CAMERA DISABLED"
      );

      setGestureActive(false);
      setGestureReady(false);
    }

    setAgentStatus("SUCCESS");

    if (platform === "youtube") {
      setAgentResponse(
        deviceSettings.gestures && deviceSettings.camera
          ? "YouTube Shorts opened. Gesture control enabled."
          : "YouTube Shorts opened. Gesture control is disabled in Settings."
      );
    } else {
      setAgentResponse(
        deviceSettings.gestures && deviceSettings.camera
          ? "Instagram Reels opened. Gesture control enabled."
          : "Instagram Reels opened. Gesture control is disabled in Settings."
      );
    }
  };

  /* =========================================================
     CLOSE SOCIAL WINDOW
     ========================================================= */

  const closeSocialWindow = () => {
    setSocialWindow(null);
    setGestureActive(false);
    setGestureReady(false);

    setGestureStatus(
      "GESTURE CONTROL OFF"
    );

    lastHandYRef.current = null;

    if (gestureAnimationRef.current) {
      cancelAnimationFrame(
        gestureAnimationRef.current
      );
    }

    if (gestureStreamRef.current) {
      gestureStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      gestureStreamRef.current = null;
    }

    if (gestureVideoRef.current) {
      gestureVideoRef.current.srcObject = null;
    }

    if (handLandmarkerRef.current) {
      try {
        handLandmarkerRef.current.close();
      } catch {
        // Already closed.
      }
    }

    handLandmarkerRef.current = null;
  };

  /* =========================================================
     GESTURE CONTROL
     ========================================================= */

  useEffect(() => {
    if (
      !socialWindow ||
      !gestureActive ||
      !deviceSettings.gestures ||
      !deviceSettings.camera
    ) {
      return;
    }

    let mounted = true;

    const startGestureControl = async () => {
      try {
        setGestureStatus(
          "LOADING HAND TRACKER"
        );

        const vision =
          await FilesetResolver.forVisionTasks(
            MEDIAPIPE_WASM
          );

        if (!mounted) return;

        const landmarker =
          await HandLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath: HAND_MODEL,
                delegate: "GPU",
              },

              runningMode: "VIDEO",
              numHands: 1,
            }
          );

        if (!mounted) {
          landmarker.close();
          return;
        }

        handLandmarkerRef.current =
          landmarker;

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                width: 640,
                height: 480,
                facingMode: "user",
              },
              audio: false,
            }
          );

        if (!mounted) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        gestureStreamRef.current =
          stream;

        const video =
          gestureVideoRef.current;

        if (!video) return;

        video.srcObject = stream;

        await video.play();

        if (!mounted) return;

        setGestureReady(true);

        setGestureStatus(
          "GESTURE CONTROL ACTIVE"
        );

        const detect = () => {
          if (!mounted) return;

          const currentVideo =
            gestureVideoRef.current;

          const currentLandmarker =
            handLandmarkerRef.current;

          if (
            !currentVideo ||
            !currentLandmarker ||
            currentVideo.readyState < 2
          ) {
            gestureAnimationRef.current =
              requestAnimationFrame(
                detect
              );

            return;
          }

          const now =
            performance.now();

          const result =
            currentLandmarker.detectForVideo(
              currentVideo,
              now
            );

          if (
            result.landmarks?.length
          ) {
            const hand =
              result.landmarks[0];

            const currentY =
              hand[0].y;

            if (
              lastHandYRef.current !==
              null
            ) {
              const delta =
                currentY -
                lastHandYRef.current;

              const timeSinceGesture =
                Date.now() -
                lastGestureTimeRef.current;

              if (
                timeSinceGesture > 900
              ) {
                if (
                  delta < -0.035
                ) {
                  setGestureStatus(
                    "HAND UP — NEXT"
                  );

                  window.dispatchEvent(
                    new CustomEvent(
                      "vexorite:social-next"
                    )
                  );

                  lastGestureTimeRef.current =
                    Date.now();
                } else if (
                  delta > 0.035
                ) {
                  setGestureStatus(
                    "HAND DOWN — PREVIOUS"
                  );

                  window.dispatchEvent(
                    new CustomEvent(
                      "vexorite:social-previous"
                    )
                  );

                  lastGestureTimeRef.current =
                    Date.now();
                } else {
                  setGestureStatus(
                    "GESTURE CONTROL ACTIVE"
                  );
                }
              }
            }

            lastHandYRef.current =
              currentY;
          }

          gestureAnimationRef.current =
            requestAnimationFrame(
              detect
            );
        };

        detect();
      } catch (error) {
        console.error(
          "Gesture control error:",
          error
        );

        setGestureReady(false);

        setGestureStatus(
          "CAMERA ACCESS REQUIRED"
        );
      }
    };

    startGestureControl();

    return () => {
      mounted = false;

      if (
        gestureAnimationRef.current
      ) {
        cancelAnimationFrame(
          gestureAnimationRef.current
        );
      }

      if (
        gestureStreamRef.current
      ) {
        gestureStreamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        gestureStreamRef.current =
          null;
      }

      if (
        gestureVideoRef.current
      ) {
        gestureVideoRef.current.srcObject =
          null;
      }

      if (
        handLandmarkerRef.current
      ) {
        try {
          handLandmarkerRef.current.close();
        } catch {
          // Already closed.
        }

        handLandmarkerRef.current =
          null;
      }

      lastHandYRef.current = null;
    };
  }, [
    socialWindow,
    gestureActive,
    deviceSettings.gestures,
    deviceSettings.camera,
  ]);

  /* =========================================================
     SOCIAL GESTURE EVENTS
     ========================================================= */

  useEffect(() => {
    const next = () => {
      console.log(
        "[VEXORITE] Gesture: NEXT"
      );
    };

    const previous = () => {
      console.log(
        "[VEXORITE] Gesture: PREVIOUS"
      );
    };

    window.addEventListener(
      "vexorite:social-next",
      next
    );

    window.addEventListener(
      "vexorite:social-previous",
      previous
    );

    return () => {
      window.removeEventListener(
        "vexorite:social-next",
        next
      );

      window.removeEventListener(
        "vexorite:social-previous",
        previous
      );
    };
  }, []);

  /* =========================================================
     COMMAND
     ========================================================= */

  const sendCommand = async () => {
    const text = command.trim();

    if (
      !text ||
      isRunning ||
      isDeploying
    ) {
      return;
    }

    if (
      isListening &&
      recognitionRef.current
    ) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const socialPlatform =
      detectSocialCommand(text);

    if (socialPlatform) {
      setCommand("");
      setAgentResponse("");

      setApprovalRequired(false);
      setDeploymentResult(null);

      openSocialWindow(
        socialPlatform
      );

      return;
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
      const response =
        await fetch(
          `${API_BASE_URL}/agent/run`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              command: text,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Agent request failed."
        );
      }

      setAgentStatus(
        data.approval_required
          ? "APPROVAL"
          : "SUCCESS"
      );

      setAgentResponse(
        data.result ||
          "Task completed."
      );

      if (
        data.approval_required
      ) {
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

  const approveDeployment =
    async () => {
      const cleanRepo =
        repoUrl.trim();

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
        const response =
          await fetch(
            `${API_BASE_URL}/agent/approve`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                approved: true,
                repo_url: cleanRepo,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Deployment failed."
          );
        }

        setApprovalRequired(false);

        setDeploymentResult(
          data
        );

        if (data.vercel) {
          setAgentStatus(
            "DEPLOYED"
          );
        } else {
          setAgentStatus(
            "SUCCESS"
          );
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

  const rejectDeployment =
    async () => {
      if (isDeploying) return;

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/agent/approve`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                approved: false,
              }),
            }
          );

        const data =
          await response.json();

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
    setProfileOpen(
      (value) => !value
    );
  };

  const closeProfile = () => {
    setProfileOpen(false);
  };

  /* =========================================================
     PANEL HELPERS
     ========================================================= */

  const closePanels = () => {
    setActivePanel(null);
  };

  const openProjects = () => {
    setActivePanel("projects");
    setProfileOpen(false);

    window.dispatchEvent(
      new Event("vexorite:projects")
    );
  };

  const openSettings = () => {
    setActivePanel("settings");
    setProfileOpen(false);

    window.dispatchEvent(
      new Event("vexorite:settings")
    );
  };

  const openThemes = () => {
    setActivePanel("themes");
    setProfileOpen(false);

    window.dispatchEvent(
      new Event("vexorite:themes")
    );
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div
      className={`jarvis-home ${
        profileOpen
          ? "profile-active"
          : ""
      }`}
      style={{
        "--theme-primary":
          currentTheme.primary,

        "--theme-secondary":
          currentTheme.secondary,
      }}
    >
      {/* =====================================================
          PROFILE BACKDROP
          ===================================================== */}

      {profileOpen && (
        <div
          className="profile-blur"
          onClick={closeProfile}
          aria-hidden="true"
        />
      )}

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="jarvis-header">
        <div className="profile-container">
          <button
            type="button"
            className={`pfp-button ${
              profileOpen
                ? "active"
                : ""
            }`}
            onClick={toggleProfile}
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
          >
            <span className="pfp-ring">
              <span className="pfp-face">
                V
              </span>
            </span>
          </button>

          {profileOpen && (
            <div
              className="profile-menu"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="profile-menu-header">
                <div className="menu-pfp">
                  V
                </div>

                <div>
                  <div className="menu-name">
                    VEXORITE
                  </div>

                  <div className="menu-status">
                    SYSTEM USER
                  </div>
                </div>
              </div>

              <div className="menu-divider" />

              <button
                type="button"
                className="profile-menu-button"
                onClick={openProjects}
              >
                <span>◈</span>
                PROJECTS
              </button>

              <button
                type="button"
                className="profile-menu-button"
                onClick={openSettings}
              >
                <span>⚙</span>
                SETTINGS
              </button>

              <button
                type="button"
                className="profile-menu-button"
                onClick={openThemes}
              >
                <span>◇</span>
                THEMES
              </button>
            </div>
          )}
        </div>

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

        {/* =================================================
            SYSTEM TEXT
            ================================================= */}

        <div className="jarvis-system-text">
          <div className="system-title">
            VEXORITE
          </div>

          <div
            className={`system-message ${
              agentStatus.toLowerCase()
            }`}
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
            {Math.round(
              voiceLevel * 100
            )}
            %
          </div>
        </div>
      </main>

      {/* =====================================================
          DEPLOYMENT APPROVAL
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
              setRepoUrl(
                e.target.value
              )
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
            VEXORITE IS LIVE
          </div>

          <a
            className="deployment-preview"
            href={
              deploymentResult.vercel_url
            }
            target="_blank"
            rel="noreferrer"
          >
            OPEN LIVE VERCEL SITE ↗
          </a>

          {deploymentResult.repo_url && (
            <a
              className="deployment-repo"
              href={
                deploymentResult.repo_url
              }
              target="_blank"
              rel="noreferrer"
            >
              VIEW GITHUB REPOSITORY ↗
            </a>
          )}
        </div>
      )}

      {/* =====================================================
          SOCIAL WINDOW
          ===================================================== */}

      {socialWindow && (
        <div className="social-overlay">
          <div className="social-window">
            <div className="social-header">
              <div>
                <div className="social-title">
                  {socialWindow ===
                  "youtube"
                    ? "YOUTUBE SHORTS"
                    : "INSTAGRAM REELS"}
                </div>

                <div className="social-subtitle">
                  GESTURE CONTROL
                </div>
              </div>

              <button
                type="button"
                className="social-close"
                onClick={
                  closeSocialWindow
                }
              >
                ×
              </button>
            </div>

            <div className="social-content">
              <iframe
                title={
                  socialWindow ===
                  "youtube"
                    ? "YouTube Shorts"
                    : "Instagram Reels"
                }
                src={
                  socialWindow ===
                  "youtube"
                    ? "https://www.youtube.com/shorts/"
                    : "https://www.instagram.com/reels/"
                }
                className="social-frame"
                allow="autoplay; encrypted-media; fullscreen"
              />

              <div className="gesture-overlay">
                <div
                  className={`gesture-indicator ${
                    gestureReady
                      ? "active"
                      : ""
                  }`}
                >
                  <span />
                  {gestureStatus}
                </div>

                <div className="gesture-help">
                  MOVE HAND UP — NEXT
                  <span>•</span>
                  MOVE HAND DOWN — PREVIOUS
                </div>

                <video
                  ref={gestureVideoRef}
                  className="gesture-camera-preview"
                  muted
                  playsInline
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          COMMAND AREA
          ===================================================== */}

      <div className="jarvis-command-area">
        <div className="command-box">
          <span className="command-prefix">
            VEX &gt;
          </span>

          <input
            value={command}
            onChange={(e) =>
              setCommand(
                e.target.value
              )
            }
            onKeyDown={handleKeyDown}
            disabled={
              isRunning ||
              isDeploying
            }
            placeholder={
              isListening
                ? "VEXORITE IS LISTENING..."
                : isRunning
                ? "VEXORITE IS WORKING..."
                : "Tell Vexorite what to do..."
            }
          />

          <button
            type="button"
            className={`voice-button ${
              isListening
                ? "listening"
                : ""
            }`}
            onClick={
              toggleListening
            }
            disabled={
              isRunning ||
              isDeploying
            }
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
            {isListening
              ? "■"
              : "🎙"}
          </button>

          <button
            type="button"
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

      {/* =====================================================
          PANEL STATE BRIDGE
          ===================================================== */}

      <div
        className={`panel-state ${
          activePanel
            ? `panel-${activePanel}`
            : ""
        }`}
        aria-hidden="true"
      />
    </div>
  );
}