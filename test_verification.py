import time

from tools.process_manager import start_process, stop_process
from tools.verification import check_url


process = start_process(
    "python -m http.server 8765"
)

print("SERVER:")
print(process)


time.sleep(2)


print("\nVERIFICATION:")

result = check_url(
    "http://127.0.0.1:8765"
)

print(result)


stop_process(
    process["process_id"]
)