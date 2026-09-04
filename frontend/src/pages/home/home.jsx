import React, { useEffect, useRef, useState } from "react";
import "./home.css";

function Home() {
  const [command, setCommand] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const orbRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    let audioContext;
    let analyser;
    let stream;
    let animationFrame;

    let currentLevel = 0;
    let agentLevel = 0;

    const startAudio = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        audioContext = new (
          window.AudioContext ||
          window.webkitAudioContext
        )();

        analyser = audioContext.createAnalyser();

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;

        const source =
          audioContext.createMediaStreamSource(stream);

        source.connect(analyser);

        const data = new Uint8Array(
          analyser.frequencyBinCount
        );

        const animateAudio = () => {
          if (!analyser || !orbRef.current) {
            animationFrame =
              requestAnimationFrame(animateAudio);
            return;
          }

          analyser.getByteFrequencyData(data);

          let sum = 0;

          for (let i = 0; i < data.length; i++) {
            sum += data[i];
          }

          const rawLevel =
            sum / data.length / 255;

          /*
           * Stronger voice response.
           */
          currentLevel +=
            (rawLevel - currentLevel) * 0.22;

          agentLevel +=
            ((agentLevel || 0) - agentLevel) * 0.04;

          const microphone =
            Math.min(currentLevel * 4.8, 1);

          const combined =
            Math.min(
              microphone +
                agentLevel * 0.9,
              1
            );

          orbRef.current.style.setProperty(
            "--voice",
            microphone.toFixed(3)
          );

          orbRef.current.style.setProperty(
            "--sound",
            combined.toFixed(3)
          );

          animationFrame =
            requestAnimationFrame(
              animateAudio
            );
        };

        animateAudio();
      } catch (error) {
        console.log("Microphone unavailable");
      }
    };

    startAudio();

    const resumeAudio = () => {
      if (
        audioContext &&
        audioContext.state === "suspended"
      ) {
        audioContext.resume();
      }
    };

    window.addEventListener(
      "pointerdown",
      resumeAudio
    );

    window.addEventListener(
      "keydown",
      resumeAudio
    );

    /*
     * Agent speech.
     *
     * Backend can dispatch:
     *
     * window.dispatchEvent(
     *   new CustomEvent("jarvis:speaking", {
     *     detail: {
     *       active: true,
     *       level: 0.8
     *     }
     *   })
     * );
     */

    const handleAgentSpeech = (event) => {
      const level =
        event.detail?.level || 0;

      agentLevel = Math.min(level, 1);

      if (orbRef.current) {
        orbRef.current.style.setProperty(
          "--agent-voice",
          agentLevel.toFixed(3)
        );

        orbRef.current.style.setProperty(
          "--sound",
          Math.min(
            currentLevel * 4.8 +
              agentLevel,
            1
          ).toFixed(3)
        );
      }
    };

    window.addEventListener(
      "jarvis:speaking",
      handleAgentSpeech
    );

    /*
     * Lightweight atmospheric particles.
     *
     * These are DOM elements rather than thousands
     * of canvas particles, keeping the page smooth.
     */

    const particleContainer =
      particlesRef.current;

    const particleCount =
      window.innerWidth < 700 ? 22 : 34;

    const particles = [];

    for (
      let i = 0;
      i < particleCount;
      i++
    ) {
      const particle =
        document.createElement("span");

      particle.className =
        "orb-particle";

      particleContainer?.appendChild(
        particle
      );

      particles.push({
        element: particle,

        angle:
          Math.random() *
          Math.PI *
          2,

        radius:
          205 +
          Math.random() * 95,

        depth:
          Math.random() * 2 -
          1,

        speed:
          (0.00010 +
            Math.random() * 0.00020) *
          (Math.random() > 0.5
            ? 1
            : -1),

        wobble:
          Math.random() *
          Math.PI *
          2,

        wobbleSpeed:
          0.0004 +
          Math.random() * 0.0005,

        size:
          2 +
          Math.random() * 2.5,
      });
    }

    let lastTime = performance.now();

    const animateParticles = (time) => {
      const dt =
        time - lastTime;

      lastTime = time;

      const orb =
        orbRef.current;

      if (orb && particles.length) {
        const styles =
          getComputedStyle(orb);

        const sound =
          parseFloat(
            styles.getPropertyValue(
              "--sound"
            )
          ) || 0;

        const twist =
          parseFloat(
            styles.getPropertyValue(
              "--twist"
            )
          ) || 0;

        const spin =
          parseFloat(
            styles.getPropertyValue(
              "--spin"
            )
          ) || 0;

        particles.forEach(
          (particle, index) => {
            /*
             * Blob rotation influences
             * particle orbital movement.
             */
            particle.angle +=
              particle.speed *
              dt *
              (1 +
                sound * 4 +
                Math.abs(spin) * 0.3);

            particle.wobble +=
              particle.wobbleSpeed *
              dt;

            /*
             * Voice pushes particles outward,
             * gravity pulls them back in.
             */
            const breathing =
              Math.sin(
                particle.wobble
              ) *
              10;

            const voicePush =
              sound *
              (28 +
                Math.sin(
                  particle.wobble
                ) *
                  12);

            const gravityPull =
              sound * 8;

            const radius =
              particle.radius +
              breathing +
              voicePush -
              gravityPull;

            const x =
              Math.cos(
                particle.angle +
                  twist * 0.0008
              ) *
              radius;

            const y =
              Math.sin(
                particle.angle +
                  twist * 0.001
              ) *
              radius *
              0.72;

            /*
             * Fake depth projection.
             */
            const z =
              Math.sin(
                particle.angle
              ) *
                particle.radius *
                0.4 +
              particle.depth *
                45;

            const scale =
              0.72 +
              ((z + 140) / 280) *
                0.55;

            const opacity =
              0.35 +
              ((z + 140) / 280) *
                0.45;

            particle.element.style.transform =
              `translate3d(${x}px, ${y}px, 0) scale(${scale})`;

            particle.element.style.opacity =
              Math.min(
                opacity +
                  sound * 0.35,
                1
              );

            particle.element.style.width =
              `${particle.size}px`;

            particle.element.style.height =
              `${particle.size}px`;
          });
      }

      animationFrame =
        requestAnimationFrame(
          animateParticles
        );
    };

    /*
     * Particle animation uses the same RAF
     * as the audio-driven visual state.
     */
    cancelAnimationFrame(animationFrame);

    let particleFrame;

    const particleLoop = (time) => {
      animateParticles(time);

      particleFrame =
        requestAnimationFrame(
          particleLoop
        );
    };

    particleFrame =
      requestAnimationFrame(
        particleLoop
      );

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      cancelAnimationFrame(
        particleFrame
      );

      window.removeEventListener(
        "pointerdown",
        resumeAudio
      );

      window.removeEventListener(
        "keydown",
        resumeAudio
      );

      window.removeEventListener(
        "jarvis:speaking",
        handleAgentSpeech
      );

      if (stream) {
        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }

      if (audioContext) {
        audioContext.close();
      }

      particles.forEach(
        (particle) => {
          particle.element.remove();
        }
      );
    };
  }, []);

  /*
   * Slow random rotation + inward twist.
   */
  useEffect(() => {
    const orb = orbRef.current;

    if (!orb) return;

    let animationFrame;
    let previous = performance.now();

    let spin = 0;
    let twist = 0;

    let targetSpin =
      Math.random() > 0.5
        ? 1
        : -1;

    let targetTwist =
      Math.random() > 0.5
        ? 1
        : -1;

    let nextDirectionChange =
      performance.now() +
      5000 +
      Math.random() * 6000;

    const animate = (time) => {
      const dt =
        time - previous;

      previous = time;

      /*
       * Randomly change direction,
       * but keep everything slow and organic.
       */
      if (
        time >
        nextDirectionChange
      ) {
        targetSpin =
          Math.random() > 0.5
            ? 1
            : -1;

        targetTwist =
          Math.random() > 0.5
            ? 1
            : -1;

        nextDirectionChange =
          time +
          5000 +
          Math.random() * 7000;
      }

      spin +=
        (targetSpin * 0.35 - spin) *
        0.0008 *
        dt;

      twist +=
        (targetTwist * 1.0 - twist) *
        0.00055 *
        dt;

      orb.style.setProperty(
        "--spin",
        spin.toFixed(3)
      );

      orb.style.setProperty(
        "--twist",
        twist.toFixed(3)
      );

      /*
       * The CSS variables drive the actual
       * blob rotation and internal layers.
       */
      orb.style.setProperty(
        "--rotation",
        `${spin * 22}deg`
      );

      orb.style.setProperty(
        "--twist-angle",
        `${twist * 18}deg`
      );

      animationFrame =
        requestAnimationFrame(
          animate
        );
    };

    animationFrame =
      requestAnimationFrame(
        animate
      );

    return () => {
      cancelAnimationFrame(
        animationFrame
      );
    };
  }, []);

  const submitCommand = (event) => {
    event.preventDefault();

    const value =
      command.trim();

    if (!value) return;

    window.dispatchEvent(
      new CustomEvent(
        "jarvis:command",
        {
          detail: {
            command: value,
          },
        }
      )
    );

    setCommand("");
  };

  return (
    <main
      className={`home-page ${
        profileOpen
          ? "profile-active"
          : ""
      }`}
    >
      <div className="home-cosmos" />
      <div className="home-stars" />

      <div className="home-nebula nebula-one" />
      <div className="home-nebula nebula-two" />

      <div className="profile-area">
        <button
          className="profile-button"
          onClick={() =>
            setProfileOpen(
              (value) => !value
            )
          }
        >
          <span>J</span>
        </button>

        {profileOpen && (
          <div className="profile-menu">
            <div className="profile-menu-title">
              TOMMY
            </div>

            <button
              onClick={() =>
                window.dispatchEvent(
                  new Event(
                    "jarvis:projects"
                  )
                )
              }
            >
              Projects
            </button>

            <button
              onClick={() =>
                window.dispatchEvent(
                  new Event(
                    "jarvis:settings"
                  )
                )
              }
            >
              Settings
            </button>

            <button
              onClick={() =>
                window.dispatchEvent(
                  new Event(
                    "jarvis:themes"
                  )
                )
              }
            >
              Themes
            </button>
          </div>
        )}
      </div>

      <button
        className="projects-launcher"
        onClick={() =>
          window.dispatchEvent(
            new Event(
              "jarvis:projects"
            )
          )
        }
      >
        <span>+</span>
        Projects
      </button>

      <div className="home-brand">
        <div className="brand-kicker">
          AUTONOMOUS INTELLIGENCE
        </div>

        <div className="brand-name">
          TOMMY
        </div>
      </div>

      <section className="jarvis-orb-stage">
        <div
          ref={particlesRef}
          className="orb-particles"
        />

        <div
          ref={orbRef}
          className="jarvis-orb"
        >
          <div className="orb-mist mist-one" />
          <div className="orb-mist mist-two" />
          <div className="orb-mist mist-three" />

          <div className="orb-gravity-smoke gravity-smoke-one" />
          <div className="orb-gravity-smoke gravity-smoke-two" />
          <div className="orb-gravity-smoke gravity-smoke-three" />

          <div className="orb-glow" />

          <div className="orb-body">
            <div className="orb-liquid liquid-one" />
            <div className="orb-liquid liquid-two" />
            <div className="orb-liquid liquid-three" />

            <div className="orb-smoke smoke-one" />
            <div className="orb-smoke smoke-two" />
            <div className="orb-smoke smoke-three" />

            <div className="orb-highlight" />

            <div className="orb-core" />
          </div>
        </div>

        <div className="orb-status">
          <span />
          SYSTEM ONLINE
        </div>
      </section>

      <form
        className="command-area"
        onSubmit={submitCommand}
      >
        <button
          type="button"
          className="voice-button"
          onClick={() =>
            window.dispatchEvent(
              new Event(
                "jarvis:voice"
              )
            )
          }
        >
          <i />
          <i />
          <i />
          <i />
          <i />
        </button>

        <input
          value={command}
          onChange={(event) =>
            setCommand(
              event.target.value
            )
          }
          placeholder="Command Jarvis..."
        />

        <button
          className="command-submit"
          type="submit"
        >
          →
        </button>
      </form>

      <div className="home-footer">
        FEATHERLESS
        <span>/</span>
        AUTONOMOUS AGENT
      </div>

      {profileOpen && (
        <button
          className="cinematic-backdrop"
          onClick={() =>
            setProfileOpen(false)
          }
        />
      )}
    </main>
  );
}

export default Home;