from tools.registry import ToolRegistry
from tools.system import get_system_info


registry = ToolRegistry()

registry.register(
    name="get_system_info",
    description="Get information about the computer running Jarvis.",
    parameters={
        "type": "object",
        "properties": {},
        "required": [],
    },
    function=get_system_info,
)


print("REGISTERED TOOLS:")
print(registry.list_tools())

print("\nTOOL EXECUTION:")
result = registry.execute(
    "get_system_info",
    {},
)

print(result)

print("\nAI TOOL DEFINITIONS:")
print(registry.get_definitions())