import { useEffect, useRef, useState } from "react";
import "./login.css";

export default function Login({ onLogin }) {
  const pageRef = useRef(null);

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const page = pageRef.current;

    if (!page) return;

    // Keep the existing universe movement exactly as it was.
    const direction = Math.random() > 0.5 ? 1 : -1;
    const angle = Math.random() * 360;
    const speed = 24 + Math.random() * 16;

    page.style.setProperty("--universe-direction", direction);
    page.style.setProperty("--universe-angle", `${angle}deg`);
    page.style.setProperty("--universe-speed", `${speed}s`);

    // Keep the existing orb movement exactly as it was.
    const orbDirection = Math.random() > 0.5 ? 1 : -1;
    const orbSpeed = 18 + Math.random() * 14;

    page.style.setProperty("--orb-direction", orbDirection);
    page.style.setProperty("--orb-speed", `${orbSpeed}s`);
  }, []);

  const handleEmailSubmit = (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Enter your email to continue.");
      return;
    }

    setError("");
    setStep("verify");
  };

  const handleVerification = (event) => {
    event.preventDefault();

    if (code.trim() !== "1234") {
      setError("Invalid verification code.");
      return;
    }

    setError("");

    // Remember the authenticated session locally.
    localStorage.setItem("vexorite_authenticated", "true");
    localStorage.setItem("vexorite_email", email.trim());

    onLogin?.(email.trim());
  };

  const goBack = () => {
    setStep("email");
    setCode("");
    setError("");
  };

  return (
    <main ref={pageRef} className="login-page">
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

          <div className="planet-atmosphere atmosphere-one" />
          <div className="planet-atmosphere atmosphere-two" />
          <div className="planet-atmosphere atmosphere-three" />

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

          <div className="gas-giant">

            <div className="gas-layer layer-one" />
            <div className="gas-layer layer-two" />
            <div className="gas-layer layer-three" />
            <div className="gas-layer layer-four" />
            <div className="gas-layer layer-five" />
            <div className="gas-layer layer-six" />

            <div className="gas-storm storm-one" />
            <div className="gas-storm storm-two" />
            <div className="gas-storm storm-three" />

            <div className="gas-highlight" />

            <div className="gas-core" />

          </div>

          <div className="gas-wisp wisp-one" />
          <div className="gas-wisp wisp-two" />
          <div className="gas-wisp wisp-three" />
          <div className="gas-wisp wisp-four" />

        </div>

        {/* ===================================================
            BRAND
        ==================================================== */}

        <div className="login-brand">
          <h1>VEXORITE</h1>

          <p>
            Your autonomous AI workspace
          </p>
        </div>

        {/* ===================================================
            EMAIL STEP
        ==================================================== */}

        {step === "email" && (
          <form
            className="login-form"
            onSubmit={handleEmailSubmit}
          >
            <label>
              <span>Email</span>

              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="Enter your email"
                autoComplete="email"
                autoFocus
              />
            </label>

            {error && (
              <p className="login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="enter-button"
            >
              <span className="button-energy" />
              <span className="button-glow" />

              <span className="button-text">
                Continue to VEXORITE
              </span>
            </button>
          </form>
        )}

        {/* ===================================================
            VERIFICATION STEP
        ==================================================== */}

        {step === "verify" && (
          <form
            className="login-form"
            onSubmit={handleVerification}
          >
            <label>
              <span>Verification code</span>

              <input
                type="text"
                name="verificationCode"
                value={code}
                onChange={(event) => {
                  const value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 4);

                  setCode(value);
                  setError("");
                }}
                placeholder="Enter 4-digit code"
                inputMode="numeric"
                maxLength={4}
                autoComplete="one-time-code"
                autoFocus
              />
            </label>

            <p className="verification-email">
              Verification sent to{" "}
              <strong>{email}</strong>
            </p>

            {error && (
              <p className="login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="enter-button"
            >
              <span className="button-energy" />
              <span className="button-glow" />

              <span className="button-text">
                Verify & Enter VEXORITE
              </span>
            </button>

            <button
              type="button"
              className="back-button"
              onClick={goBack}
            >
              ← Change email
            </button>
          </form>
        )}

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