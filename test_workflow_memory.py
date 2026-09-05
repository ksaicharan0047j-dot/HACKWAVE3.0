from memory.workflow_memory import (
    save_workflow,
    find_workflow,
    list_workflows,
)


save_workflow(
    name="create_portfolio_website",
    trigger="build a portfolio website",
    steps=[
        {
            "tool": "create_website",
            "arguments": {
                "project_name": "nova-portfolio",
                "title": "Nova Portfolio",
                "description": "A modern personal portfolio website",
            },
        }
    ],
)


print("\nSAVED WORKFLOWS:")
print(list_workflows())


print("\nSEARCH RESULT:")
print(
    find_workflow(
        "build me a portfolio website"
    )
)