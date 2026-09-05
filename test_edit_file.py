from tools.filesystem import edit_file, read_file


print("EDIT RESULT:")

print(
    edit_file(
        "projects/jarvis_test/hello.txt",
        "Hello from the NEW Jarvis!",
    )
)


print("\nREAD RESULT:")

print(
    read_file(
        "projects/jarvis_test/hello.txt"
    )
)