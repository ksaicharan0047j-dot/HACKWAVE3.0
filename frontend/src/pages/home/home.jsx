import React, { useEffect, useRef, useState } from "react";
import "./Home.css";
import Settings from "../../components/pages/Settings/Settings";
import Project from "../../components/pages/Project/Project";

export default function Home() {
  const orbRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);

  const [voiceLevel, setVoiceLevel] = useState(0);
  const [agentVoice, setAgentVoice] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [command, setCommand] = useState("");

  /* =========================================
     MICROPHONE
  ========================================= */

  useEffect(() => {
    let mounted = true;

    const startMicrophone = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          console.log("Microphone is not supported.");
          return;
        }

        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: true,
          });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const AudioContext =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContext) {
          console.log("AudioContext is not supported.");
          return;
        }

        const audioContext = new AudioContext();

        const analyser =
          audioContext.createAnalyser();

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.82;

        const source =
          audioContext.createMediaStreamSource(stream);

        source.connect(analyser);

        audioContextRef.current = audioContext;

        const dataArray = new Uint8Array(
          analyser.frequencyBinCount
        );

        let smoothLevel = 0;

        const detectVoice = () => {
          if (!mounted) return;

          analyser.getByteFrequencyData(dataArray);

          let total = 0;

          for (let i = 0; i < dataArray.length; i++) {
            total += dataArray[i];
          }

          const average =
            total / dataArray.length / 255;

          const intensity = Math.min(
            1,
            average * 3
          );

          smoothLevel =
            smoothLevel * 0.84 +
            intensity * 0.16;

          setVoiceLevel(smoothLevel);

          if (orbRef.current) {
            orbRef.current.style.setProperty(
              "--voice",
              smoothLevel
            );
          }

          animationRef.current =
            requestAnimationFrame(detectVoice);
        };

        detectVoice();
      } catch (error) {
        console.log(
          "Microphone permission was not granted.",
          error
        );
      }
    };

    startMicrophone();

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

  /* =========================================
     JARVIS SPEAKING EVENT
  ========================================= */

  useEffect(() => {
    const handleSpeaking = (event) => {
      const level =
        event.detail?.level ?? 0.8;

      setAgentVoice(level);

      if (orbRef.current) {
        orbRef.current.style.setProperty(
          "--agent-voice",
          level
        );
      }

      setTimeout(() => {
        setAgentVoice(0);

        if (orbRef.current) {
          orbRef.current.style.setProperty(
            "--agent-voice",
            0
          );
        }
      }, 250);
    };

    window.addEventListener(
      "jarvis:speaking",
      handleSpeaking
    );

    return () => {
      window.removeEventListener(
        "jarvis:speaking",
        handleSpeaking
      );
    };
  }, []);

  /* =========================================
     COMMAND
  ========================================= */

  const sendCommand = () => {
    const text = command.trim();

    if (!text) return;

    window.dispatchEvent(
      new CustomEvent("jarvis:command", {
        detail: {
          command: text,
        },
      })
    );

    setCommand("");
  };

  const handleCommandKeyDown = (event) => {
    if (event.key === "Enter") {
      sendCommand();
    }
  };

  /* =========================================
     NAVIGATION
  ========================================= */

  const openProjects = () => {
    window.dispatchEvent(
      new Event("jarvis:projects")
    );
  };

  const openSettings = () => {
    window.dispatchEvent(
      new Event("jarvis:settings")
    );
  };

  const openVoice = () => {
    window.dispatchEvent(
      new Event("jarvis:voice")
    );
  };

  const openThemes = () => {
    window.dispatchEvent(
      new Event("jarvis:themes")
    );
  };

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="jarvis-home">

      {/* HEADER */}

      <header className="jarvis-header">

        <div className="jarvis-brand">
          <div className="brand-dot" />

          <div>
            <div className="brand-title">
              JARVIS
            </div>

            <div className="brand-subtitle">
              AI SYSTEM
            </div>
          </div>
        </div>

        <div className="header-status">
          <span className="status-indicator" />
          SYSTEM ONLINE
        </div>

        <button
          className="profile-button"
          onClick={() =>
            setProfileOpen((value) => !value)
          }
        >
          <span className="profile-icon">
            ◉
          </span>

          <span>PROFILE</span>
        </button>
      </header>

      {/* PROFILE */}

      {profileOpen && (
        <div className="profile-panel">

          <div className="profile-panel-header">
            <span>USER PROFILE</span>

            <button
              className="profile-close"
              onClick={() =>
                setProfileOpen(false)
              }
            >
              ×
            </button>
          </div>

          <div className="profile-avatar">
            ◉
          </div>

          <div className="profile-name">
            JARVIS USER
          </div>

          <div className="profile-status">
            SYSTEM ACCESS GRANTED
          </div>
        </div>
      )}

      {/* MAIN */}

      <main className="jarvis-main">

        <div
          className="jarvis-orb"
          ref={orbRef}
          style={{
            "--voice": voiceLevel,
            "--agent-voice": agentVoice,
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
            JARVIS
          </div>

          <div className="system-message">
            LISTENING FOR COMMAND
          </div>

          <div className="voice-level">
            VOICE LEVEL{" "}
            {Math.round(voiceLevel * 100)}%
          </div>

        </div>
      </main>

      {/* COMMAND */}

      <div className="jarvis-command-area">

        <div className="command-box">

          <span className="command-prefix">
            &gt;
          </span>

          <input
            value={command}
            onChange={(event) =>
              setCommand(event.target.value)
            }
            onKeyDown={handleCommandKeyDown}
            placeholder="Enter command..."
          />

          <button
            className="command-send"
            onClick={sendCommand}
          >
            SEND
          </button>

        </div>

        <button
          className="voice-button"
          onClick={openVoice}
        >
          🎙
        </button>

      </div>

      {/* NAVIGATION */}

      <nav className="jarvis-navigation">

        <button
          className="nav-button"
          onClick={openProjects}
        >
          <span className="nav-icon">
            ◈
          </span>

          <span>
            PROJECTS
          </span>
        </button>

        <button
          className="nav-button"
          onClick={openSettings}
        >
          <span className="nav-icon">
            ⚙
          </span>

          <span>
            SETTINGS
          </span>
        </button>

        <button
          className="nav-button"
          onClick={openThemes}
        >
          <span className="nav-icon">
            ◇
          </span>

          <span>
            THEMES
          </span>
        </button>

      </nav>

      {/* PROJECTS WINDOW */}

      <Project />

      {/* SETTINGS WINDOW */}

      <Settings />

    </div>
  );
}