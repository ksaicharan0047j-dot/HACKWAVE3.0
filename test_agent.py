from agent.orchestrator import AgentOrchestrator
from tools.registry import ToolRegistry
from tools.filesystem import (
    create_directory,
    create_file,
    read_file,
    edit_file,
)


registry = ToolRegistry()


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
    description="Read the contents of an existing text file.",
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
                "description": "Path of the file to edit.",
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


agent = AgentOrchestrator(registry)


result = agent.run(
    "Read the file projects/jarvis_test/hello.txt "
    "and tell me exactly what it contains."
)


print("\nJARVIS:")
print(result)