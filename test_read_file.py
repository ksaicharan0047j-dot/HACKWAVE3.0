from tools.filesystem import read_file


result = read_file(
    "projects/jarvis_test/hello.txt"
)

print("READ FILE RESULT:")
print(result)