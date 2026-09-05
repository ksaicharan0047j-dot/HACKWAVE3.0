from agent.jarvis import create_agent


agent = create_agent(
    name="Nova",
)


result = agent.run(
    "Build me a simple portfolio website. "
    "Call it Nova Portfolio and describe it as "
    "a modern personal portfolio website."
)


print("\nASSISTANT:")
print(result)