import { useEffect, useRef } from "react";
import "./login.css";

export default function Login({ onLogin }) {
  const pageRef = useRef(null);

  useEffect(() => {
    const page = pageRef.current;

    if (!page) return;

    // Randomize the universe movement every time the page opens.
    const direction = Math.random() > 0.5 ? 1 : -1;
    const angle = Math.random() * 360;
    const speed = 24 + Math.random() * 16;

    page.style.setProperty(
      "--universe-direction",
      direction
    );

    page.style.setProperty(
      "--universe-angle",
      `${angle}deg`
    );

    page.style.setProperty(
      "--universe-speed",
      `${speed}s`
    );

    // Give the orb a slightly different initial rotation
    // every time the page loads.
    const orbDirection = Math.random() > 0.5 ? 1 : -1;
    const orbSpeed = 18 + Math.random() * 14;

    page.style.setProperty(
      "--orb-direction",
      orbDirection
    );

    page.style.setProperty(
      "--orb-speed",
      `${orbSpeed}s`
    );
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin?.();
  };

  return (
    <main
      ref={pageRef}
      className="login-page"
    >
      {/* =====================================================
          COSMIC BACKGROUND
      ====================================================== */}

      <div className="cosmos-background" />

      <div className="nebula nebula-one" />
      <div className="nebula nebula-two" />
      <div className="nebula nebula-three" />

      <div className="star-field star-field-one" />
      <div className="star-field star-field-two" />
      <div className="star-field star-field-three" />

      {/* =====================================================
          LOGIN CARD
      ====================================================== */}

      <section className="login-card">

        <div className="card-cosmic-light" />

        {/* ===================================================
            ORBITAL / ATMOSPHERIC AREA
        ==================================================== */}

        <div className="gas-giant-container">

          {/* Outer atmospheric glow */}
          <div className="planet-atmosphere atmosphere-one" />
          <div className="planet-atmosphere atmosphere-two" />
          <div className="planet-atmosphere atmosphere-three" />

          {/* =================================================
              DUST BEING PULLED INWARD
          ================================================== */}

          <div className="dust-stream dust-stream-one">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="dust-stream dust-stream-two">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="dust-stream dust-stream-three">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="dust-stream dust-stream-four">
            <span />
            <span />
            <span />
            <span />
          </div>

          {/* =================================================
              ACTUAL GAS / SMOKE BODY
          ================================================== */}

          <div className="gas-giant">

            <div className="gas-layer layer-one" />
            <div className="gas-layer layer-two" />
            <div className="gas-layer layer-three" />
            <div className="gas-layer layer-four" />
            <div className="gas-layer layer-five" />
            <div className="gas-layer layer-six" />

            {/* Internal turbulent storms */}
            <div className="gas-storm storm-one" />
            <div className="gas-storm storm-two" />
            <div className="gas-storm storm-three" />

            {/* Light escaping from the interior */}
            <div className="gas-highlight" />

            <div className="gas-core" />

          </div>

          {/* =================================================
              SMOKE / GAS WISPS
          ================================================== */}

          <div className="gas-wisp wisp-one" />
          <div className="gas-wisp wisp-two" />
          <div className="gas-wisp wisp-three" />
          <div className="gas-wisp wisp-four" />

        </div>

        {/* ===================================================
            BRAND
        ==================================================== */}

        <div className="login-brand">
          <h1>TOMMY</h1>

          <p>
            Your autonomous AI workspace
          </p>
        </div>

        {/* ===================================================
            LOGIN FORM
        ==================================================== */}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          <label>
            <span>Email</span>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              autoComplete="email"
            />
          </label>

          <label>
            <span>Password</span>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            className="enter-button"
          >
            <span className="button-energy" />
            <span className="button-glow" />

            <span className="button-text">
              Enter TOMMY
            </span>
          </button>

        </form>

        {/* ===================================================
            FOOTER
        ==================================================== */}

        <p className="login-footer">
          <span>AI workspace</span>

          <i>•</i>

          <span>Project automation</span>

          <i>•</i>

          <span>Autonomous execution</span>
        </p>

      </section>
    </main>
  );
}