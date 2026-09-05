from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re

from agent.jarvis import create_agent


app = FastAPI(
    title="VEXORITE Backend",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class AgentRequest(BaseModel):
    command: str


class ApprovalRequest(BaseModel):
    approved: bool
    repo_url: str | None = None


# ============================================================
# PENDING AGENT
# ============================================================

pending_agent = None


# ============================================================
# GITHUB URL VALIDATION
# ============================================================

def clean_github_url(url):
    if not url:
        return None

    url = url.strip()

    match = re.search(
        r"https?://github\.com/"
        r"[A-Za-z0-9_.-]+/"
        r"[A-Za-z0-9_.-]+",
        url,
    )

    if not match:
        return None

    return match.group(0).rstrip("/")


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "success": True,
        "message": "VEXORITE ONLINE",
    }


# ============================================================
# RUN AGENT
# ============================================================

@app.post("/agent/run")
def run_agent(
    request: AgentRequest,
):
    global pending_agent

    try:
        agent = create_agent()

        result = agent.run(
            request.command
        )

        if agent.deployment_pending:
            pending_agent = agent

        return {
            "success": True,
            "command": request.command,
            "result": result,

            "approval_required": (
                agent.deployment_pending
            ),

            "preview_url": (
                agent.tunnel_url
            ),

            "repo_url": (
                agent.repo_url
            ),

            "website_verified": (
                agent.website_verified
            ),

            "localtunnel_started": (
                agent.localtunnel_started
            ),
        }

    except Exception as error:
        return {
            "success": False,
            "command": request.command,
            "error": str(error),
        }


# ============================================================
# APPROVAL / DEPLOYMENT
# ============================================================

@app.post("/agent/approve")
def approve_deployment(
    request: ApprovalRequest,
):
    global pending_agent

    print(
        "\n[DEPLOYMENT] Approval request received."
    )

    # ========================================================
    # CHECK PENDING AGENT
    # ========================================================

    if pending_agent is None:
        return {
            "success": False,
            "error": (
                "There is no deployment waiting "
                "for approval."
            ),
        }

    agent = pending_agent

    # ========================================================
    # REJECT
    # ========================================================

    if not request.approved:

        print(
            "[DEPLOYMENT] User rejected deployment."
        )

        agent.deployment_pending = False

        pending_agent = None

        return {
            "success": True,
            "approved": False,
            "message": (
                "Deployment cancelled by user."
            ),
        }

    # ========================================================
    # APPROVE
    # ========================================================

    print(
        "[DEPLOYMENT] Human approval received."
    )

    # ========================================================
    # GET GITHUB REPOSITORY
    # ========================================================

    repo_url = clean_github_url(
        request.repo_url
    )

    # If frontend didn't send one, try
    # the repository already known by the agent.
    if not repo_url:
        repo_url = clean_github_url(
            agent.repo_url
        )

    # Approval requires a valid GitHub repository.
    if not repo_url:

        print(
            "[DEPLOYMENT] No valid GitHub repository."
        )

        return {
            "success": False,
            "approved": True,
            "repo_required": True,
            "github": False,
            "vercel": False,
            "error": (
                "A valid GitHub repository URL "
                "is required before deployment."
            ),
        }

    agent.repo_url = repo_url

    print(
        f"[DEPLOYMENT] GitHub repository: "
        f"{repo_url}"
    )

    # ========================================================
    # FIND GENERATED PROJECT
    # ========================================================

    project_path = getattr(
        agent,
        "project_path",
        None,
    )

    if not project_path:

        for item in reversed(
            agent.history
        ):

            if (
                item.get("tool")
                != "create_website"
            ):
                continue

            result = item.get(
                "result",
                {},
            )

            if isinstance(result, dict):
                project_path = result.get(
                    "path"
                )

            if project_path:
                break

    if not project_path:

        return {
            "success": False,
            "approved": True,
            "repo_required": False,
            "github": False,
            "vercel": False,
            "error": (
                "Could not determine the generated "
                "project path."
            ),
        }

    print(
        f"[DEPLOYMENT] Project path: "
        f"{project_path}"
    )

    # ========================================================
    # GITHUB PUSH
    # ========================================================

    try:

        print(
            "[DEPLOYMENT] Pushing project to GitHub..."
        )

        git_result = agent.registry.execute(
            "git_push",
            {
                "project_path": project_path,
                "repo_url": repo_url,
                "commit_message": (
                    "VEXORITE generated website"
                ),
            },
        )

        print(
            "[DEPLOYMENT] GitHub push successful."
        )

    except Exception as error:

        print(
            f"[DEPLOYMENT] GitHub push failed: "
            f"{error}"
        )

        return {
            "success": False,
            "approved": True,
            "repo_required": False,
            "github": False,
            "vercel": False,
            "repo_url": repo_url,
            "error": (
                f"GitHub push failed: {error}"
            ),
        }

    # ========================================================
    # VERCEL DEPLOYMENT
    # ========================================================

    try:

        print(
            "[DEPLOYMENT] Deploying to Vercel..."
        )

        vercel_result = agent.registry.execute(
            "vercel_deploy",
            {
                "project_path": project_path,
            },
        )

        print(
            "[DEPLOYMENT] Vercel deployment successful."
        )

    except Exception as error:

        print(
            f"[DEPLOYMENT] Vercel deployment failed: "
            f"{error}"
        )

        return {
            "success": False,
            "approved": True,
            "repo_required": False,
            "github": True,
            "vercel": False,
            "repo_url": repo_url,
            "error": (
                f"Vercel deployment failed: {error}"
            ),
        }

    # ========================================================
    # COMPLETE
    # ========================================================

    agent.deployment_pending = False

    agent.deployment_approved = True

    pending_agent = None

    vercel_url = None

    if isinstance(
        vercel_result,
        dict,
    ):
        vercel_url = vercel_result.get(
            "url"
        )

    print(
        "\n========================================"
    )

    print(
        "[DEPLOYMENT] DEPLOYMENT COMPLETE"
    )

    print(
        f"[DEPLOYMENT] GitHub: {repo_url}"
    )

    print(
        f"[DEPLOYMENT] Vercel: {vercel_url}"
    )

    print(
        "========================================\n"
    )

    return {
        "success": True,
        "approved": True,
        "repo_required": False,

        "github": True,
        "vercel": True,

        "repo_url": repo_url,

        "preview_url": (
            agent.tunnel_url
        ),

        "vercel_url": vercel_url,

        "message": (
            "Website successfully pushed to "
            "GitHub and deployed to Vercel."
        ),
    }