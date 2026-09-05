from tools.registry import ToolRegistry
from memory.workflow_memory import find_workflow


class WorkflowExecutor:

    def __init__(self, registry: ToolRegistry):
        self.registry = registry

    def _substitute(
        self,
        value,
        parameters,
    ):
        if not isinstance(value, str):
            return value

        for key, replacement in parameters.items():
            value = value.replace(
                "{{" + key + "}}",
                str(replacement),
            )

        return value

    def _resolve_arguments(
        self,
        arguments,
        parameters,
    ):
        return {
            key: self._substitute(
                value,
                parameters,
            )
            for key, value in arguments.items()
        }

    def _extract_parameters(
        self,
        user_request: str,
        workflow: dict,
    ):
        """
        Extract parameters from the original learned
        workflow when possible.

        For now, website workflows use the parameters
        saved in the create_website step.
        """

        parameters = {
            "project_name": "offline-site",
            "title": "Jarvis Offline Site",
            "description": (
                "Website generated from "
                "Jarvis workflow memory."
            ),
            "port": 8765,
        }

        for step in workflow.get("steps", []):

            if step.get("tool") != "create_website":
                continue

            arguments = step.get(
                "arguments",
                {},
            )

            if arguments.get("project_name"):
                parameters["project_name"] = arguments[
                    "project_name"
                ]

            if arguments.get("title"):
                parameters["title"] = arguments[
                    "title"
                ]

            if arguments.get("description"):
                parameters["description"] = arguments[
                    "description"
                ]

            break

        return parameters

    def execute(self, user_request: str):

        workflow = find_workflow(user_request)

        if not workflow:
            return {
                "success": False,
                "mode": "offline",
                "message": "No matching workflow found.",
            }

        print(
            f"\n[WORKFLOW] Found: "
            f"{workflow['name']}"
        )

        parameters = self._extract_parameters(
            user_request,
            workflow,
        )

        print(
            f"[WORKFLOW] Parameters: "
            f"{parameters}"
        )

        results = []

        for step in workflow.get("steps", []):

            tool_name = step.get("tool")

            arguments = step.get(
                "arguments",
                {},
            )

            arguments = self._resolve_arguments(
                arguments,
                parameters,
            )

            print(
                f"\n[WORKFLOW] Executing: "
                f"{tool_name}"
            )

            print(
                f"[WORKFLOW] Arguments: "
                f"{arguments}"
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
                f"[WORKFLOW] Result: {result}"
            )

            results.append(
                {
                    "tool": tool_name,
                    "arguments": arguments,
                    "result": result,
                }
            )

            if not result.get(
                "success",
                False,
            ):
                return {
                    "success": False,
                    "mode": "offline",
                    "workflow": workflow["name"],
                    "results": results,
                    "message": (
                        f"Offline workflow failed "
                        f"at {tool_name}."
                    ),
                }

        return {
            "success": True,
            "mode": "offline",
            "workflow": workflow["name"],
            "parameters": parameters,
            "results": results,
            "message": (
                "Workflow executed successfully "
                "without AI."
            ),
        }