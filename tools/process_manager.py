import subprocess
import sys


_processes = {}


def start_process(
    command: str,
    working_directory: str = ".",
):
    try:

        # -------------------------------------------------
        # SPECIAL CASE: PYTHON HTTP SERVER
        # -------------------------------------------------
        # On Windows, shell=True can create a shell process
        # whose PID is different from the actual server.
        # We avoid that for our HTTP server.

        parts = command.strip().split()

        if (
            len(parts) >= 4
            and parts[0].lower() == "python"
            and parts[1] == "-m"
            and parts[2] == "http.server"
        ):

            port = parts[3]

            process = subprocess.Popen(
                [
                    sys.executable,
                    "-m",
                    "http.server",
                    port,
                ],
                cwd=working_directory,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )

        else:

            process = subprocess.Popen(
                command,
                cwd=working_directory,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )

        process_id = str(process.pid)

        _processes[process_id] = process

        return {
            "success": True,
            "process_id": process_id,
            "command": command,
            "working_directory": working_directory,
            "message": (
                f"Process started with PID "
                f"{process_id}"
            ),
        }

    except Exception as error:

        return {
            "success": False,
            "process_id": None,
            "command": command,
            "working_directory": working_directory,
            "error": str(error),
        }


def get_process_status(
    process_id: str,
):
    process = _processes.get(process_id)

    if not process:

        return {
            "success": False,
            "message": (
                f"Unknown process: {process_id}"
            ),
        }

    status = process.poll()

    if status is None:

        return {
            "success": True,
            "running": True,
            "process_id": process_id,
        }

    return {
        "success": True,
        "running": False,
        "process_id": process_id,
        "exit_code": status,
    }


def stop_process(
    process_id: str,
):
    process = _processes.get(process_id)

    if not process:

        return {
            "success": False,
            "message": (
                f"Unknown process: {process_id}"
            ),
        }

    if process.poll() is not None:

        return {
            "success": True,
            "message": "Process has already stopped.",
            "process_id": process_id,
        }

    try:

        process.terminate()

        return {
            "success": True,
            "process_id": process_id,
            "message": (
                f"Stop signal sent to process "
                f"{process_id}"
            ),
        }

    except Exception as error:

        return {
            "success": False,
            "process_id": process_id,
            "error": str(error),
        }   