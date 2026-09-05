from pathlib import Path


def create_directory(path: str):
    directory = Path(path)

    directory.mkdir(parents=True, exist_ok=True)

    return {
        "success": True,
        "path": str(directory.resolve()),
        "message": f"Directory created: {directory}",
    }


def create_file(path: str, content: str):
    file_path = Path(path)

    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content, encoding="utf-8")

    return {
        "success": True,
        "path": str(file_path.resolve()),
        "message": f"File created: {file_path}",
    }

def read_file(path: str):
    file_path = Path(path)

    if not file_path.exists():
        return {
            "success": False,
            "path": str(file_path),
            "error": "File does not exist.",
        }

    if not file_path.is_file():
        return {
            "success": False,
            "path": str(file_path),
            "error": "Path is not a file.",
        }

    try:
        content = file_path.read_text(encoding="utf-8")

        return {
            "success": True,
            "path": str(file_path.resolve()),
            "content": content,
        }

    except Exception as error:
        return {
            "success": False,
            "path": str(file_path),
            "error": str(error),
        }
def edit_file(path: str, content: str):
    file_path = Path(path)

    if not file_path.exists():
        return {
            "success": False,
            "path": str(file_path),
            "error": "File does not exist.",
        }

    if not file_path.is_file():
        return {
            "success": False,
            "path": str(file_path),
            "error": "Path is not a file.",
        }

    try:
        file_path.write_text(content, encoding="utf-8")

        return {
            "success": True,
            "path": str(file_path.resolve()),
            "message": "File updated successfully.",
        }

    except Exception as error:
        return {
            "success": False,
            "path": str(file_path),
            "error": str(error),
        }