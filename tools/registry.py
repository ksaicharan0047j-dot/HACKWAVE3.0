from dataclasses import dataclass
from typing import Callable, Any

from tools.deployment import (
    extract_repo_url,
    git_status,
    git_push,
    start_localtunnel,
    vercel_deploy,
)


@dataclass
class Tool:
    name: str
    description: str
    parameters: dict[str, Any]
    function: Callable[..., Any]


class ToolRegistry:

    def __init__(self):
        self._tools: dict[str, Tool] = {}

        # Deployment tools are registered automatically
        # so every ToolRegistry instance used by Jarvis
        # has access to them.
        self._register_deployment_tools()

    # =========================================================
    # REGISTER
    # =========================================================

    def register(
        self,
        name: str,
        description: str,
        parameters: dict[str, Any],
        function: Callable[..., Any],
    ):

        if name in self._tools:
            raise ValueError(
                f"Tool '{name}' is already registered"
            )

        self._tools[name] = Tool(
            name=name,
            description=description,
            parameters=parameters,
            function=function,
        )

    # =========================================================
    # DEPLOYMENT TOOLS
    # =========================================================

    def _register_deployment_tools(self):

        self.register(
            name="extract_repo_url",
            description=(
                "Find an existing GitHub repository URL "
                "inside the user's command. "
                "Never create a GitHub repository."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": (
                            "Complete user command."
                        ),
                    }
                },
                "required": ["text"],
            },
            function=extract_repo_url,
        )

        self.register(
            name="git_status",
            description=(
                "Check the Git status of a local project."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "project_path": {
                        "type": "string",
                        "description": (
                            "Absolute path to the project."
                        ),
                    }
                },
                "required": ["project_path"],
            },
            function=git_status,
        )

        self.register(
            name="git_push",
            description=(
                "Commit and push project files to an "
                "EXISTING human-created GitHub repository. "
                "Never create a GitHub repository."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "project_path": {
                        "type": "string",
                        "description": (
                            "Absolute local project path."
                        ),
                    },
                    "repo_url": {
                        "type": "string",
                        "description": (
                            "Existing GitHub repository URL."
                        ),
                    },
                    "commit_message": {
                        "type": "string",
                        "description": (
                            "Git commit message."
                        ),
                    },
                },
                "required": [
                    "project_path",
                    "repo_url",
                ],
            },
            function=git_push,
        )

        self.register(
            name="start_localtunnel",
            description=(
                "Expose an already-running local website "
                "through LocalTunnel and return its public "
                "preview URL."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "project_path": {
                        "type": "string",
                        "description": (
                            "Absolute local project path."
                        ),
                    },
                    "port": {
                        "type": "integer",
                        "description": (
                            "Port where the website is running."
                        ),
                        "default": 8000,
                    },
                },
                "required": [
                    "project_path",
                ],
            },
            function=start_localtunnel,
        )

        self.register(
            name="vercel_deploy",
            description=(
                "Deploy an approved project to Vercel "
                "using the user's already authenticated "
                "Vercel CLI account."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "project_path": {
                        "type": "string",
                        "description": (
                            "Absolute local project path."
                        ),
                    }
                },
                "required": [
                    "project_path",
                ],
            },
            function=vercel_deploy,
        )

    # =========================================================
    # EXECUTE
    # =========================================================

    def execute(
        self,
        name: str,
        arguments: dict[str, Any],
    ):

        if name not in self._tools:
            raise ValueError(
                f"Unknown tool: {name}"
            )

        tool = self._tools[name]

        return tool.function(
            **arguments
        )

    # =========================================================
    # CHECK TOOL
    # =========================================================

    def has_tool(
        self,
        name: str,
    ) -> bool:

        return name in self._tools

    # =========================================================
    # LIST TOOLS
    # =========================================================

    def list_tools(self) -> list[str]:

        return list(
            self._tools.keys()
        )

    # =========================================================
    # GET TOOL
    # =========================================================

    def get_tool(
        self,
        name: str,
    ) -> Tool:

        if name not in self._tools:
            raise ValueError(
                f"Unknown tool: {name}"
            )

        return self._tools[name]

    # =========================================================
    # AI DEFINITIONS
    # =========================================================

    def get_definitions(
        self,
    ) -> list[dict[str, Any]]:

        return [
            {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters,
            }
            for tool in self._tools.values()
        ]


# =============================================================
# DEFAULT REGISTRY
# =============================================================

registry = ToolRegistry()