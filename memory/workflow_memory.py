import json
import re
from pathlib import Path


WORKFLOW_FILE = Path("memory/workflows.json")


def _ensure_file():
    WORKFLOW_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    if not WORKFLOW_FILE.exists():
        WORKFLOW_FILE.write_text(
            "[]",
            encoding="utf-8",
        )


def load_workflows():
    _ensure_file()

    try:
        data = json.loads(
            WORKFLOW_FILE.read_text(
                encoding="utf-8",
            )
        )

        return data if isinstance(data, list) else []

    except (json.JSONDecodeError, OSError):
        return []


def _normalize_text(text: str):
    text = text.lower()

    text = re.sub(
        r"[^a-z0-9\s]",
        " ",
        text,
    )

    return {
        word
        for word in text.split()
        if len(word) > 2
    }


def _clean_steps(steps: list):
    """
    Convert raw agent history into a compact,
    reusable executable workflow.
    """

    create_website_step = None
    start_process_step = None
    check_url_step = None

    for step in steps:

        tool = step.get("tool")
        arguments = step.get(
            "arguments",
            {},
        )

        if tool == "create_website":

            create_website_step = {
                "tool": "create_website",
                "arguments": {
                    "project_name": arguments.get(
                        "project_name",
                        "{{project_name}}",
                    ),
                    "title": arguments.get(
                        "title",
                        "{{title}}",
                    ),
                    "description": arguments.get(
                        "description",
                        "{{description}}",
                    ),
                },
            }

        elif tool == "start_process":

            start_process_step = {
                "tool": "start_process",
                "arguments": {
                    "command": (
                        "python -m http.server "
                        "{{port}}"
                    ),
                    "working_directory": (
                        "projects/{{project_name}}"
                    ),
                },
            }

        elif tool == "check_url":

            check_url_step = {
                "tool": "check_url",
                "arguments": {
                    "url": (
                        "http://localhost:{{port}}"
                    ),
                },
            }

    cleaned = []

    if create_website_step:
        cleaned.append(create_website_step)

    # A website workflow always needs a server
    # before URL verification.
    if start_process_step:
        cleaned.append(start_process_step)

    if check_url_step:
        cleaned.append(check_url_step)

    return cleaned

def save_workflow(
    name: str,
    trigger: str,
    steps: list,
):
    workflows = load_workflows()

    cleaned_steps = _clean_steps(steps)

    workflow = {
        "name": name,
        "trigger": trigger,
        "type": "executable_workflow",
        "steps": cleaned_steps,
    }

    workflows = [
        item
        for item in workflows
        if item.get("name") != name
    ]

    workflows.append(workflow)

    WORKFLOW_FILE.write_text(
        json.dumps(
            workflows,
            indent=4,
        ),
        encoding="utf-8",
    )

    return workflow


def find_workflow(trigger: str):
    workflows = load_workflows()

    if not workflows:
        return None

    trigger_words = _normalize_text(trigger)

    best_match = None
    best_score = 0

    for workflow in workflows:

        workflow_words = _normalize_text(
            workflow.get("trigger", "")
        )

        if not workflow_words:
            continue

        common_words = trigger_words.intersection(
            workflow_words
        )

        if not common_words:
            continue

        union = trigger_words.union(
            workflow_words
        )

        score = len(common_words) / len(union)

        if score > best_score:
            best_score = score
            best_match = workflow

    return best_match


def list_workflows():
    return load_workflows()


def delete_workflow(name: str):
    workflows = load_workflows()

    updated = [
        workflow
        for workflow in workflows
        if workflow.get("name") != name
    ]

    WORKFLOW_FILE.write_text(
        json.dumps(
            updated,
            indent=4,
        ),
        encoding="utf-8",
    )

    return {
        "success": len(updated) != len(workflows),
        "name": name,
    }


def clear_workflows():
    WORKFLOW_FILE.write_text(
        "[]",
        encoding="utf-8",
    )

    return {
        "success": True,
        "message": "All workflows cleared.",
    }