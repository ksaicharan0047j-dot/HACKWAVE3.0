import json

from ai.featherless import client, MODEL
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


tools = [
    {
        "type": "function",
        "function": tool,
    }
    for tool in registry.get_definitions()
]


messages = [
    {
        "role": "user",
        "content": "Tell me the operating system of this computer.",
    }
]


# 1. Ask AI what to do
response = client.chat.completions.create(
    model=MODEL,
    messages=messages,
    tools=tools,
    tool_choice="auto",
)

message = response.choices[0].message

print("AI DECISION:")
print(message.tool_calls)


# 2. Add AI's tool-call message to conversation
messages.append(message)


# 3. Execute requested tools
for tool_call in message.tool_calls:
    tool_name = tool_call.function.name
    arguments = json.loads(tool_call.function.arguments)

    print("\nEXECUTING TOOL:")
    print(tool_name)
    print(arguments)

    result = registry.execute(
        tool_name,
        arguments,
    )

    print("\nTOOL RESULT:")
    print(result)

    # 4. Give tool result back to AI
    messages.append(
        {
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result),
        }
    )


# 5. Ask AI for the final answer
final_response = client.chat.completions.create(
    model=MODEL,
    messages=messages,
    tools=tools,
)

final_message = final_response.choices[0].message

print("\nJARVIS FINAL RESPONSE:")
print(final_message.content)