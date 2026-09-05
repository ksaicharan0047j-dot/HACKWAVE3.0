import time

from tools.process_manager import (
    start_process,
    get_process_status,
    stop_process,
)


print("STARTING PROCESS:")

result = start_process(
    "python -m http.server 8765"
)

print(result)

process_id = result["process_id"]


time.sleep(2)


print("\nPROCESS STATUS:")

status = get_process_status(process_id)

print(status)


print("\nSTOPPING PROCESS:")

print(stop_process(process_id))


time.sleep(1)


print("\nFINAL STATUS:")

print(get_process_status(process_id))