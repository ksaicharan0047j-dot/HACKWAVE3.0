from agent.config import AgentConfig
from agent.orchestrator import AgentOrchestrator

from tools.registry import ToolRegistry

from tools.filesystem import (
    create_directory,
    create_file,
    read_file,
    edit_file,
)

from tools.terminal import run_command

from tools.process_manager import (
    start_process,
    get_process_status,
    stop_process,
)

from tools.verification import check_url

from tools.website import create_website


def create_agent(
    name: str = "Jarvis",
) -> AgentOrchestrator:

    config = AgentConfig(
        name=name,
    )

    registry = ToolRegistry()

    # --------------------------------------------------
    # FILESYSTEM TOOLS
    # --------------------------------------------------

    registry.register(
        name="create_directory",
        description="Create a directory on the computer.",
        parameters={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path of the directory to create.",
                }
            },
            "required": ["path"],
        },
        function=create_directory,
    )

    registry.register(
        name="create_file",
        description="Create a new file with text content.",
        parameters={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path of the file.",
                },
                "content": {
                    "type": "string",
                    "description": "Content to write.",
                },
            },
            "required": ["path", "content"],
        },
        function=create_file,
    )

    registry.register(
        name="read_file",
        description="Read the contents of a text file.",
        parameters={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path of the file to read.",
                }
            },
            "required": ["path"],
        },
        function=read_file,
    )

    registry.register(
        name="edit_file",
        description="Replace the contents of an existing text file.",
        parameters={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path of the file.",
                },
                "content": {
                    "type": "string",
                    "description": "New content for the file.",
                },
            },
            "required": ["path", "content"],
        },
        function=edit_file,
    )

    # --------------------------------------------------
    # TERMINAL
    # --------------------------------------------------

    registry.register(
        name="run_command",
        description="Run a terminal command and return its output.",
        parameters={
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "Command to execute.",
                },
                "working_directory": {
                    "type": "string",
                    "description": "Directory where the command runs.",
                },
            },
            "required": ["command"],
        },
        function=run_command,
    )

    # --------------------------------------------------
    # PROCESS MANAGEMENT
    # --------------------------------------------------

    registry.register(
        name="start_process",
        description="Start a long-running process.",
        parameters={
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "Command to start.",
                },
                "working_directory": {
                    "type": "string",
                    "description": "Directory where the process runs.",
                },
            },
            "required": ["command"],
        },
        function=start_process,
    )

    registry.register(
        name="get_process_status",
        description="Check whether a started process is still running.",
        parameters={
            "type": "object",
            "properties": {
                "process_id": {
                    "type": "string",
                    "description": "Process ID of the process.",
                }
            },
            "required": ["process_id"],
        },
        function=get_process_status,
    )

    registry.register(
        name="stop_process",
        description="Stop a running process.",
        parameters={
            "type": "object",
            "properties": {
                "process_id": {
                    "type": "string",
                    "description": "Process ID of the process.",
                }
            },
            "required": ["process_id"],
        },
        function=stop_process,
    )

    # --------------------------------------------------
    # VERIFICATION
    # --------------------------------------------------

    registry.register(
        name="check_url",
        description="Check whether a local or remote URL is reachable.",
        parameters={
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "URL to verify.",
                }
            },
            "required": ["url"],
        },
        function=check_url,
    )

    # --------------------------------------------------
    # WEBSITE GENERATION
    # --------------------------------------------------

    registry.register(
        name="create_website",
        description=(
            "Create a complete static website with HTML, CSS, and "
            "JavaScript. Use this when the user asks to build, "
            "create, or generate a website."
        ),
        parameters={
            "type": "object",
            "properties": {
                "project_name": {
                    "type": "string",
                    "description": (
                        "Folder name for the website project. "
                        "Use a simple name without spaces."
                    ),
                },
                "title": {
                    "type": "string",
                    "description": "Main title of the website.",
                },
                "description": {
                    "type": "string",
                    "description": (
                        "Short description shown on the website."
                    ),
                },
            },
            "required": [
                "project_name",
                "title",
                "description",
            ],
        },
        function=create_website,
    )

    # --------------------------------------------------
    # CREATE AGENT
    # --------------------------------------------------

    return AgentOrchestrator(
        registry=registry,
        config=config,
    )