import subprocess


def run_command(
    command: str,
    working_directory: str = ".",
    timeout: int = 30,
):
    try:
        # Commands that are expected to launch a persistent
        # process should not block the agent.
        lower_command = command.lower()

        long_running_markers = [
            "python -m http.server",
            "npm run dev",
            "npm start",
            "uvicorn",
        ]

        is_long_running = any(
            marker in lower_command
            for marker in long_running_markers
        )

        if is_long_running:
            process = subprocess.Popen(
                command,
                cwd=working_directory,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )

            return {
                "success": True,
                "background": True,
                "process_id": str(process.pid),
                "command": command,
                "working_directory": working_directory,
                "message": (
                    "Long-running command started "
                    "in background."
                ),
            }

        process = subprocess.run(
            command,
            cwd=working_directory,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
        )

        return {
            "success": process.returncode == 0,
            "background": False,
            "exit_code": process.returncode,
            "stdout": process.stdout,
            "stderr": process.stderr,
            "command": command,
            "working_directory": working_directory,
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "background": False,
            "exit_code": -1,
            "stdout": "",
            "stderr": (
                f"Command timed out after {timeout} seconds."
            ),
            "command": command,
            "working_directory": working_directory,
        }

    except Exception as error:
        return {
            "success": False,
            "background": False,
            "exit_code": -1,
            "stdout": "",
            "stderr": str(error),
            "command": command,
            "working_directory": working_directory,
        }