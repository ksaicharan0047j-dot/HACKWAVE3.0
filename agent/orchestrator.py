import json
import re

from ai.featherless import client, MODEL
from agent.config import AgentConfig
from memory.workflow_memory import save_workflow
from tools.registry import ToolRegistry


class AgentOrchestrator:

    def __init__(
        self,
        registry: ToolRegistry,
        config: AgentConfig | None = None,
    ):
        self.registry = registry
        self.config = config or AgentConfig()

        self.history = []
        self.max_steps = 20

        self.website_verified = False
        self.localtunnel_started = False

        self.active_process_id = None
        self.tunnel_url = None
        self.repo_url = None

        self.project_path = None
        self.server_port = 8080

        self.deployment_pending = False
        self.deployment_approved = False

    # =========================================================
    # TOOL DEFINITIONS
    # =========================================================

    def _get_tool_definitions(self):

        return [
            {
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": tool["parameters"],
                },
            }
            for tool in self.registry.get_definitions()
        ]

    # =========================================================
    # SYSTEM PROMPT
    # =========================================================

    def _system_prompt(self):

        return f"""
You are {self.config.name}, an AI desktop execution agent.

You are NOT a normal chatbot.

Your job is to understand the user's request and perform
real actions using the available tools.

The user may ask you to:
- create websites
- modify files
- run terminal commands
- start applications
- verify websites
- prepare projects for deployment

IMPORTANT WEBSITE RULES:

When the user requests a website, use the create_website tool.

Do not invent files that were not created.

Do not create GitHub repositories.

If the user provides an existing GitHub repository URL,
use that repository.

The user must explicitly approve deployment before
git_push or vercel_deploy.

IMPORTANT DEPLOYMENT RULE:

Never execute git_push or vercel_deploy during normal AI
tool execution.

Deployment is handled separately by the backend after
explicit human approval.

URL RULES:

Always use plain URLs.

Do not wrap URLs in Markdown.

After create_website succeeds, the orchestrator will
automatically:

1. Start the website server.
2. Verify HTTP 200.
3. Start LocalTunnel.
4. Show the public preview.
5. Wait for human approval.

Do not repeatedly restart a working server.

Do not repeatedly debug a website after HTTP 200
verification succeeds.

Vercel deployment uses the user's already authenticated
Vercel CLI.
"""

    # =========================================================
    # URL CLEANER
    # =========================================================

    def _clean_url(self, url):

        if not isinstance(url, str):
            return url

        # Convert markdown-style URL to plain URL if necessary.
        match = re.search(
            r"\]\((https?://[^)]+)\)",
            url,
        )

        if match:
            return match.group(1)

        match = re.search(
            r"https?://[^\s\])]+",
            url,
        )

        if match:
            return match.group(0).rstrip(
                ".,)"
            )

        return url.strip()

    # =========================================================
    # REPOSITORY DETECTION
    # =========================================================

    def _extract_repo_from_request(
        self,
        request,
    ):

        patterns = [
            r"https?://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+",
            r"github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+",
        ]

        for pattern in patterns:

            match = re.search(
                pattern,
                request,
            )

            if match:

                url = match.group(0)

                if not url.startswith("http"):
                    url = "https://" + url

                return url.rstrip(
                    ".,)/"
                )

        return None

    # =========================================================
    # WEBSITE REQUEST DETECTION
    # =========================================================

    def _is_website_request(self, request):

        request_lower = request.lower()

        keywords = [
            "build a website",
            "create a website",
            "make a website",
            "develop a website",
            "build website",
            "create website",
            "make website",
            "develop website",
            "portfolio website",
            "landing page",
            "web page",
            "webpage",
            "website",
        ]

        return any(
            keyword in request_lower
            for keyword in keywords
        )

    # =========================================================
    # EXECUTE TOOL
    # =========================================================

    def _execute_tool(
        self,
        tool_name,
        arguments,
    ):

        if tool_name == "check_url":

            if "url" in arguments:
                arguments["url"] = self._clean_url(
                    arguments["url"]
                )

        if tool_name == "start_localtunnel":

            arguments.setdefault(
                "port",
                self.server_port,
            )

        print(
            f"\n[AGENT] Executing tool: {tool_name}"
        )

        print(
            f"[AGENT] Arguments: {arguments}"
        )

        try:

            result = self.registry.execute(
                tool_name,
                arguments,
            )

        except Exception as error:

            result = {
                "success": False,
                "error": str(error),
            }

        print(
            f"[AGENT] Result: {result}"
        )

        # -----------------------------------------------------
        # WEBSITE PATH
        # -----------------------------------------------------

        if (
            tool_name == "create_website"
            and isinstance(result, dict)
            and result.get("success")
        ):

            self.project_path = result.get(
                "path"
            )

        # -----------------------------------------------------
        # PROCESS
        # -----------------------------------------------------

        if (
            tool_name == "start_process"
            and isinstance(result, dict)
            and result.get("success")
        ):

            self.active_process_id = result.get(
                "process_id"
            )

        # -----------------------------------------------------
        # SERVER PORT
        # -----------------------------------------------------

        if tool_name == "start_process":

            command = arguments.get(
                "command",
                "",
            )

            port_match = re.search(
                r"(?:--port\s+|:)(\d+)",
                command,
            )

            if port_match:

                self.server_port = int(
                    port_match.group(1)
                )

        # -----------------------------------------------------
        # VERIFICATION
        # -----------------------------------------------------

        if (
            tool_name == "check_url"
            and isinstance(result, dict)
            and result.get("success")
            and result.get("status_code") == 200
        ):

            self.website_verified = True

            print(
                "\n[AGENT] WEBSITE VERIFIED"
            )

        # -----------------------------------------------------
        # LOCAL TUNNEL
        # -----------------------------------------------------

        if (
            tool_name == "start_localtunnel"
            and isinstance(result, dict)
            and result.get("success")
        ):

            self.localtunnel_started = True

            self.tunnel_url = self._clean_url(
                result.get("url")
            )

            print(
                "\n[AGENT] LOCAL TUNNEL STARTED"
            )

            print(
                f"[AGENT] Public preview: "
                f"{self.tunnel_url}"
            )

        self.history.append(
            {
                "tool": tool_name,
                "arguments": arguments,
                "result": result,
            }
        )

        return result

    # =========================================================
    # AUTOMATIC WEBSITE PIPELINE
    # =========================================================

    def _run_website_pipeline(self):

        if not self.project_path:
            return False

        # -----------------------------------------------------
        # START SERVER
        # -----------------------------------------------------

        if not self.active_process_id:

            print(
                "\n[AGENT] Starting verified website server..."
            )

            process_result = self._execute_tool(
                "start_process",
                {
                    "command": (
                        f"python -m http.server "
                        f"{self.server_port}"
                    ),
                    "working_directory": self.project_path,
                },
            )

            if not process_result.get(
                "success",
                False,
            ):

                return False

        # -----------------------------------------------------
        # VERIFY WEBSITE
        # -----------------------------------------------------

        if not self.website_verified:

            print(
                "\n[AGENT] Verifying website..."
            )

            verification_result = (
                self._execute_tool(
                    "check_url",
                    {
                        "url": (
                            f"http://localhost:"
                            f"{self.server_port}"
                        )
                    },
                )
            )

            if not verification_result.get(
                "success",
                False,
            ):

                return False

            if verification_result.get(
                "status_code"
            ) != 200:

                return False

        # -----------------------------------------------------
        # LOCAL TUNNEL
        # -----------------------------------------------------

        if (
            self.website_verified
            and not self.localtunnel_started
        ):

            print(
                "\n[AGENT] Starting LocalTunnel..."
            )

            tunnel_result = (
                self._execute_tool(
                    "start_localtunnel",
                    {
                        "project_path": self.project_path,
                        "port": self.server_port,
                    },
                )
            )

            if not tunnel_result.get(
                "success",
                False,
            ):

                print(
                    "[AGENT] LocalTunnel failed."
                )

                return False

        # -----------------------------------------------------
        # DEPLOYMENT WAIT
        # -----------------------------------------------------

        if (
            self.website_verified
            and self.localtunnel_started
        ):

            self.deployment_pending = True

            print(
                "\n[AGENT] Website pipeline complete."
            )

            print(
                "[AGENT] Waiting for human approval."
            )

            return True

        return False

    # =========================================================
    # WORKFLOW MEMORY
    # =========================================================

    def _learn_workflow(
        self,
        user_request,
    ):

        if not self.history:
            return None

        steps = []

        for item in self.history:

            result = item.get(
                "result",
                {},
            )

            if not isinstance(
                result,
                dict,
            ):
                continue

            if not result.get(
                "success",
                False,
            ):
                continue

            steps.append(
                {
                    "tool": item.get(
                        "tool"
                    ),
                    "arguments": item.get(
                        "arguments",
                        {},
                    ),
                }
            )

        if not steps:
            return None

        words = [
            word.lower()
            for word in user_request.split()
            if word.isalnum()
        ]

        workflow_name = (
            "_".join(words[:6])
            or "general_workflow"
        )

        workflow_name += "_workflow"

        workflow = save_workflow(
            name=workflow_name,
            trigger=user_request,
            steps=steps,
        )

        print(
            "\n[MEMORY] Learned workflow:"
        )

        print(
            json.dumps(
                workflow,
                indent=4,
            )
        )

        return workflow

    # =========================================================
    # MAIN RUN
    # =========================================================

    def run(
        self,
        user_request,
    ):

        # -----------------------------------------------------
        # RESET STATE
        # -----------------------------------------------------

        self.history = []

        self.website_verified = False
        self.localtunnel_started = False

        self.active_process_id = None

        self.project_path = None
        self.server_port = 8080

        self.tunnel_url = None

        self.deployment_pending = False
        self.deployment_approved = False

        # -----------------------------------------------------
        # DETECT REPOSITORY
        # -----------------------------------------------------

        self.repo_url = (
            self._extract_repo_from_request(
                user_request
            )
        )

        if self.repo_url:

            print(
                "\n[AGENT] Existing GitHub repository detected:"
            )

            print(
                self.repo_url
            )

        # -----------------------------------------------------
        # BUILD AI CONTEXT
        # -----------------------------------------------------

        messages = [
            {
                "role": "system",
                "content": self._system_prompt(),
            },
            {
                "role": "user",
                "content": user_request,
            },
        ]

        tools = self._get_tool_definitions()

        # =====================================================
        # WEBSITE FLOW
        # =====================================================

        if self._is_website_request(
            user_request
        ):

            print(
                "\n[AGENT] Website request detected."
            )

            print(
                "[AGENT] Asking AI to plan website creation..."
            )

            try:

                response = client.chat.completions.create(
                    model=MODEL,
                    messages=messages,
                    tools=tools,
                    tool_choice={
                        "type": "function",
                        "function": {
                            "name": "create_website"
                        },
                    },
                )

            except Exception as error:

                raise RuntimeError(
                    f"Featherless request failed: {error}"
                )

            message = response.choices[0].message

            # -------------------------------------------------
            # AI DID NOT RETURN TOOL CALL
            # -------------------------------------------------

            if not message.tool_calls:

                raise RuntimeError(
                    "AI did not return the required "
                    "create_website tool call."
                )

            # -------------------------------------------------
            # EXECUTE WEBSITE CREATION
            # -------------------------------------------------

            website_created = False

            for tool_call in message.tool_calls:

                tool_name = (
                    tool_call.function.name
                )

                if tool_name != "create_website":

                    continue

                try:

                    arguments = json.loads(
                        tool_call.function.arguments
                    )

                except Exception:

                    raise RuntimeError(
                        "AI returned invalid arguments "
                        "for create_website."
                    )

                result = self._execute_tool(
                    "create_website",
                    arguments,
                )

                if not result.get(
                    "success",
                    False,
                ):

                    raise RuntimeError(
                        f"Website creation failed: {result}"
                    )

                website_created = True

                break

            if not website_created:

                raise RuntimeError(
                    "AI did not provide a valid "
                    "create_website tool call."
                )

            # -------------------------------------------------
            # AUTOMATIC WEBSITE PIPELINE
            # -------------------------------------------------

            pipeline_complete = (
                self._run_website_pipeline()
            )

            if not pipeline_complete:

                raise RuntimeError(
                    "Website was created, but the "
                    "verification/LocalTunnel pipeline failed."
                )

            # -------------------------------------------------
            # SAVE WORKFLOW
            # -------------------------------------------------

            self._learn_workflow(
                user_request
            )

            # -------------------------------------------------
            # WAIT FOR APPROVAL
            # -------------------------------------------------

            return (
                "Website created and verified successfully. "
                f"Public preview: {self.tunnel_url}. "
                + (
                    f"Existing GitHub repository: "
                    f"{self.repo_url}. "
                    if self.repo_url
                    else ""
                )
                + "Waiting for human approval before "
                "GitHub push and Vercel deployment."
            )

        # =====================================================
        # GENERAL AI TOOL LOOP
        # =====================================================

        for step in range(
            1,
            self.max_steps + 1,
        ):

            print(
                f"\n[AGENT] Step {step}"
            )

            try:

                response = client.chat.completions.create(
                    model=MODEL,
                    messages=messages,
                    tools=tools,
                    tool_choice="auto",
                )

            except Exception as error:

                raise RuntimeError(
                    f"Featherless request failed: {error}"
                )

            message = response.choices[0].message

            # -------------------------------------------------
            # NO TOOL CALL
            # -------------------------------------------------

            if not message.tool_calls:

                final_response = (
                    message.content
                    or "Task completed."
                )

                self._learn_workflow(
                    user_request
                )

                return final_response

            # -------------------------------------------------
            # ADD ASSISTANT MESSAGE
            # -------------------------------------------------

            assistant_message = {
                "role": "assistant",
                "content": message.content or "",
                "tool_calls": [],
            }

            for tool_call in message.tool_calls:

                assistant_message[
                    "tool_calls"
                ].append(
                    {
                        "id": tool_call.id,
                        "type": "function",
                        "function": {
                            "name": (
                                tool_call.function.name
                            ),
                            "arguments": (
                                tool_call.function.arguments
                            ),
                        },
                    }
                )

            messages.append(
                assistant_message
            )

            # -------------------------------------------------
            # EXECUTE AI TOOLS
            # -------------------------------------------------

            for tool_call in message.tool_calls:

                tool_name = (
                    tool_call.function.name
                )

                try:

                    arguments = json.loads(
                        tool_call.function.arguments
                    )

                except Exception:

                    arguments = {}

                # -------------------------------------------------
                # BLOCK DEPLOYMENT
                # -------------------------------------------------

                if tool_name in {
                    "git_push",
                    "vercel_deploy",
                }:

                    result = {
                        "success": False,
                        "blocked": True,
                        "requires_approval": True,
                        "error": (
                            "Human approval is required "
                            "before deployment."
                        ),
                    }

                    print(
                        f"\n[AGENT] BLOCKED: {tool_name}"
                    )

                else:

                    result = self._execute_tool(
                        tool_name,
                        arguments,
                    )
                    # -------------------------------------------------
                    # WEBSITE PIPELINE
                    # -------------------------------------------------

                    if (
                        tool_name == "create_website"
                        and isinstance(result, dict)
                        and result.get("success")
                    ):
                        print(
                            "\n[AGENT] Website creation detected."
                        )

                        pipeline_complete = (
                            self._run_website_pipeline()
                        )

                        if not pipeline_complete:
                            raise RuntimeError(
                                "Website was created, but the "
                                "verification/LocalTunnel pipeline failed."
                            )

                        self._learn_workflow(
                            user_request
                        )

                        return (
                            "Website created and verified successfully. "
                            f"Public preview: {self.tunnel_url}. "
                            + (
                                f"Existing GitHub repository: "
                                f"{self.repo_url}. "
                                if self.repo_url
                                else ""
                            )
                            + "Waiting for human approval before "
                            "GitHub push and Vercel deployment."
                        )

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(
                            result,
                            default=str,
                        ),
                    }
                )

        raise RuntimeError(
            f"{self.config.name} exceeded "
            f"maximum tool-calling steps."
        )