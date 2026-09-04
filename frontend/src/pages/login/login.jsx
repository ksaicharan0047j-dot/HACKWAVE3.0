import { useEffect, useRef } from "react";
import "./login.css";

export default function Login() {
  const pageRef = useRef(null);

  useEffect(() => {
    const page = pageRef.current;

    if (!page) return;

    /*
     * Give the cosmic field a different initial direction
     * every time the page loads.
     */
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
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <main
      ref={pageRef}
      className="login-page"
    >

      {/* =====================================================
          COSMOS
      ===================================================== */}

      <div className="cosmos-background" />

      <div className="nebula nebula-one" />
      <div className="nebula nebula-two" />
      <div className="nebula nebula-three" />

      <div className="star-field star-field-one" />
      <div className="star-field star-field-two" />
      <div className="star-field star-field-three" />


      {/* =====================================================
          LOGIN PANEL
      ===================================================== */}

      <section className="login-card">

        <div className="card-cosmic-light" />


        {/* ===================================================
            GAS GIANT
        =================================================== */}

        <div className="gas-giant-container">

          {/* Outer atmospheric haze */}
          <div className="planet-atmosphere atmosphere-one" />
          <div className="planet-atmosphere atmosphere-two" />
          <div className="planet-atmosphere atmosphere-three" />


          {/* Dust being pulled toward the planet */}

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
              THE GAS GIANT ITSELF
          ================================================= */}

          <div className="gas-giant">

            {/* Deep transparent atmospheric layer */}
            <div className="gas-layer layer-one" />

            {/* Cyan gas */}
            <div className="gas-layer layer-two" />

            {/* Violet gas */}
            <div className="gas-layer layer-three" />

            {/* Magenta gas */}
            <div className="gas-layer layer-four" />

            {/* Blue gas */}
            <div className="gas-layer layer-five" />

            {/* Green atmospheric turbulence */}
            <div className="gas-layer layer-six" />

            {/* Internal moving storm */}
            <div className="gas-storm storm-one" />
            <div className="gas-storm storm-two" />
            <div className="gas-storm storm-three" />

            {/* Bright gas pocket */}
            <div className="gas-highlight" />

            {/* Deep gravitational core */}
            <div className="gas-core" />

          </div>


          {/* Wisps wrapping around the planet */}

          <div className="gas-wisp wisp-one" />
          <div className="gas-wisp wisp-two" />
          <div className="gas-wisp wisp-three" />
          <div className="gas-wisp wisp-four" />

        </div>


        {/* =====================================================
            BRAND
        ===================================================== */}

        <div className="login-brand">

          <h1>JARVIS</h1>

          <p>
            Your autonomous AI workspace
          </p>

        </div>


        {/* =====================================================
            LOGIN FORM
        ===================================================== */}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          <label>
            <span>Email</span>

            <input
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
            />
          </label>


          <label>
            <span>Password</span>

            <input
              type="password"
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
              Enter Jarvis
            </span>

          </button>

        </form>


        {/* =====================================================
            FOOTER
        ===================================================== */}

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