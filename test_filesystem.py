from tools.filesystem import create_directory, create_file


test_directory = "projects/test_project"

print("CREATING DIRECTORY:")
print(create_directory(test_directory))


print("\nCREATING FILE:")
print(
    create_file(
        "projects/test_project/index.html",
        "<h1>Hello from Jarvis</h1>",
    )
)