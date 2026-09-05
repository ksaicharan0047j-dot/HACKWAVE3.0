from agent.jarvis import create_agent
from memory.workflow_executor import WorkflowExecutor


agent = create_agent(
    name="Nova",
)


executor = WorkflowExecutor(
    agent.registry
)


result = executor.execute(
    "build me a portfolio website"
)


print("\nOFFLINE RESULT:")
print(result)