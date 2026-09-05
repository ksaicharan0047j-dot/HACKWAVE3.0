import re
import subprocess
import webbrowser
from pathlib import Path


def extract_repo_url(text: str):
    """
    Extract a GitHub repository URL from arbitrary text.
    """

    if not text:
        return None

    match = re.search(
        r"https?://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+",
        text,
    )

    if not match:
        return None

    return match.group(0).rstrip("/")


def git_status(project_path: str):
    """
    Return the current Git status of a project.
    """

    path = Path(project_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Project path does not exist: {project_path}"
        )

    result = subprocess.run(
        ["git", "status", "--short"],
        cwd=project_path,
        capture_output=True,
        text=True,
        timeout=30,
    )

    return {
        "success": result.returncode == 0,
        "status": result.stdout.strip(),
        "error": result.stderr.strip(),
    }


def git_push(
    project_path: str,
    repo_url: str,
    commit_message: str = "VEXORITE generated website",
):
    """
    Commit and push a generated project to GitHub.
    """

    path = Path(project_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Project path does not exist: {project_path}"
        )

    print("[GIT] Preparing repository...")

    # Initialize Git if necessary.
    git_dir = path / ".git"

    if not git_dir.exists():
        result = subprocess.run(
            ["git", "init"],
            cwd=project_path,
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode != 0:
            raise RuntimeError(
                f"git init failed:\n"
                f"{result.stdout}\n"
                f"{result.stderr}"
            )

    # Configure origin.
    remote_result = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        cwd=project_path,
        capture_output=True,
        text=True,
        timeout=30,
    )

    if remote_result.returncode == 0:
        current_remote = remote_result.stdout.strip()

        if current_remote != repo_url:
            subprocess.run(
                ["git", "remote", "set-url", "origin", repo_url],
                cwd=project_path,
                capture_output=True,
                text=True,
                timeout=30,
            )
    else:
        result = subprocess.run(
            ["git", "remote", "add", "origin", repo_url],
            cwd=project_path,
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode != 0:
            raise RuntimeError(
                f"Unable to configure Git remote:\n"
                f"{result.stdout}\n"
                f"{result.stderr}"
            )

    print("[GIT] Adding generated files...")

    result = subprocess.run(
        ["git", "add", "."],
        cwd=project_path,
        capture_output=True,
        text=True,
        timeout=30,
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"git add failed:\n"
            f"{result.stdout}\n"
            f"{result.stderr}"
        )

    # Check whether there is actually anything to commit.
    status_result = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=project_path,
        capture_output=True,
        text=True,
        timeout=30,
    )

    if status_result.returncode != 0:
        raise RuntimeError(
            f"Unable to read Git status:\n"
            f"{status_result.stderr}"
        )

    if status_result.stdout.strip():
        result = subprocess.run(
            [
                "git",
                "commit",
                "-m",
                commit_message,
            ],
            cwd=project_path,
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.returncode != 0:
            raise RuntimeError(
                f"git commit failed:\n"
                f"{result.stdout}\n"
                f"{result.stderr}"
            )

    print("[GIT] Pushing to GitHub...")

    result = subprocess.run(
        [
            "git",
            "push",
            "-u",
            "origin",
            "HEAD",
        ],
        cwd=project_path,
        capture_output=True,
        text=True,
        timeout=120,
    )

    output = (
        result.stdout
        + "\n"
        + result.stderr
    ).strip()

    print("[GIT] Output:")
    print(output)

    if result.returncode != 0:
        raise RuntimeError(
            f"GitHub push failed:\n{output}"
        )

    return {
        "success": True,
        "repo_url": repo_url,
        "output": output,
        "message": "Project pushed to GitHub successfully.",
    }


def start_localtunnel(
    project_path: str,
    port: int = 8000,
):
    """
    Start LocalTunnel for a locally running website.

    The LocalTunnel URL is extracted from the process output
    and automatically opened in the default browser.
    """

    path = Path(project_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Project path does not exist: {project_path}"
        )

    print("[LOCALTUNNEL] Starting LocalTunnel...")

    process = subprocess.Popen(
        [
            "cmd",
            "/c",
            "lt",
            "--port",
            str(port),
            "--print-requests",
        ],
        cwd=project_path,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    tunnel_url = None

    # LocalTunnel normally prints:
    #
    # your url is: https://something.loca.lt
    #
    # We watch the output until the URL appears.
    try:
        for line in iter(process.stdout.readline, ""):
            if not line:
                break

            line = line.strip()

            print(f"[LOCALTUNNEL] {line}")

            match = re.search(
                r"https://[A-Za-z0-9.-]+\.loca\.lt",
                line,
            )

            if match:
                tunnel_url = match.group(0)
                break

    except Exception:
        process.kill()
        raise

    if not tunnel_url:
        try:
            process.kill()
        except Exception:
            pass

        raise RuntimeError(
            "LocalTunnel started but no public URL "
            "could be detected."
        )

    print(
        f"[LOCALTUNNEL] Public URL: {tunnel_url}"
    )

    # Automatically open the public website.
    try:
        webbrowser.open(tunnel_url)
        print(
            "[LOCALTUNNEL] Public URL opened "
            "in the default browser."
        )
    except Exception as error:
        print(
            "[LOCALTUNNEL] Could not automatically "
            f"open browser: {error}"
        )

    return {
        "success": True,
        "url": tunnel_url,
        "process_id": process.pid,
        "message": (
            "LocalTunnel started successfully "
            "and the public URL was opened."
        ),
    }


def vercel_deploy(project_path: str):
    """
    Deploy an approved project to Vercel production.
    """

    path = Path(project_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Project path does not exist: {project_path}"
        )

    print("[VERCEL] Deploying approved project...")

    result = subprocess.run(
        [
            "vercel.cmd",
            "--prod",
            "--yes",
        ],
        cwd=project_path,
        capture_output=True,
        text=True,
        timeout=180,
    )

    output = (
        result.stdout
        + "\n"
        + result.stderr
    ).strip()

    print("[VERCEL] CLI output:")
    print(output)

    if result.returncode != 0:
        raise RuntimeError(
            f"Vercel deployment failed:\n{output}"
        )

    production_urls = re.findall(
        r"https://[A-Za-z0-9.-]+\.vercel\.app",
        output,
    )

    production_url = None

    for line in output.splitlines():
        if "Production" in line:
            match = re.search(
                r"https://[A-Za-z0-9.-]+\.vercel\.app",
                line,
            )

            if match:
                production_url = match.group(0)
                break

    if production_url is None and production_urls:
        production_url = production_urls[-1]

    # Automatically open the deployed production website.
    if production_url:
        try:
            webbrowser.open(production_url)

            print(
                "[VERCEL] Production URL opened "
                "in the default browser."
            )
        except Exception as error:
            print(
                "[VERCEL] Could not automatically "
                f"open browser: {error}"
            )

    return {
        "success": True,
        "url": production_url,
        "output": output,
        "message": "Vercel deployment successful.",
    }