from pathlib import Path
import html


def create_website(
    project_name: str,
    title: str,
    description: str,
):
    """
    Create a complete static HTML/CSS/JS website.

    CSS is embedded directly into index.html so the generated
    website works reliably through LocalTunnel without requiring
    a separate style.css request.
    """

    project_path = Path("projects") / project_name
    project_path.mkdir(parents=True, exist_ok=True)

    # Safely escape user/AI generated text before putting it into HTML.
    safe_title = html.escape(title)
    safe_description = html.escape(description)

    css = """* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {
    min-height: 100vh;
    font-family: Arial, Helvetica, sans-serif;
    background:
        radial-gradient(circle at 50% 20%, #18243d 0%, #0a0a0a 45%, #050505 100%);
    color: #ffffff;
}

.hero {
    min-height: 100vh;

    display: flex;
    justify-content: center;
    align-items: center;

    padding: 24px;
}

.card {
    width: min(760px, 100%);

    padding: 70px 60px;

    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 28px;

    background:
        linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.08),
            rgba(255, 255, 255, 0.025)
        );

    backdrop-filter: blur(20px);

    box-shadow:
        0 30px 100px rgba(0, 0, 0, 0.55),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);

    text-align: center;

    animation: cardIn 0.8s ease forwards;
}

.eyebrow {
    font-size: 12px;

    letter-spacing: 5px;

    color: #7d8aa5;

    margin-bottom: 24px;

    text-transform: uppercase;
}

h1 {
    font-size: clamp(42px, 8vw, 80px);

    line-height: 1;

    margin-bottom: 26px;

    letter-spacing: -3px;
}

.description {
    max-width: 620px;

    margin: 0 auto 36px;

    color: #aeb7c9;

    font-size: 18px;

    line-height: 1.7;
}

button {
    border: 1px solid rgba(255, 255, 255, 0.18);

    padding: 14px 30px;

    border-radius: 999px;

    background: #ffffff;

    color: #050505;

    font-size: 16px;

    font-weight: 600;

    cursor: pointer;

    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

button:hover {
    transform: translateY(-2px) scale(1.03);

    box-shadow:
        0 12px 35px rgba(255, 255, 255, 0.18);
}

button:active {
    transform: scale(0.98);
}

#message {
    min-height: 24px;

    margin-top: 24px;

    color: #8e9ab1;

    font-size: 14px;
}

@keyframes cardIn {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@media (max-width: 600px) {
    .card {
        padding: 45px 25px;
    }

    h1 {
        letter-spacing: -2px;
    }

    .description {
        font-size: 16px;
    }
}
"""

    js = """const button = document.getElementById("actionButton");
const message = document.getElementById("message");

if (button && message) {
    button.addEventListener("click", () => {
        message.textContent =
            "VEXORITE says: Website is working.";

        button.textContent = "WORKING ✓";
    });
}
"""

    # IMPORTANT:
    # CSS and JS are embedded directly into index.html.
    # This means LocalTunnel only needs to successfully serve
    # index.html instead of making additional /style.css and
    # /script.js requests.
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>{safe_title}</title>

    <style>
{css}
    </style>
</head>

<body>

    <main class="hero">

        <div class="card">

            <p class="eyebrow">
                VEXORITE GENERATED
            </p>

            <h1>
                {safe_title}
            </h1>

            <p class="description">
                {safe_description}
            </p>

            <button id="actionButton">
                Explore
            </button>

            <p id="message"></p>

        </div>

    </main>

    <script>
{js}
    </script>

</body>
</html>
"""

    # Save self-contained HTML.
    (project_path / "index.html").write_text(
        html_content,
        encoding="utf-8",
    )

    # Keep the CSS file as well for GitHub/development.
    (project_path / "style.css").write_text(
        css,
        encoding="utf-8",
    )

    # Keep the JS file as well for GitHub/development.
    (project_path / "script.js").write_text(
        js,
        encoding="utf-8",
    )

    return {
        "success": True,
        "project_name": project_name,
        "path": str(project_path.resolve()),
        "files": [
            "index.html",
            "style.css",
            "script.js",
        ],
        "message": (
            "Website created successfully with "
            "self-contained HTML/CSS/JS."
        ),
    }