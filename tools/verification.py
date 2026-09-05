import urllib.request
import urllib.error
import re
import time


def check_url(url: str):
    # Convert Markdown links into a normal URL
    markdown_match = re.search(r"\((https?://[^)]+)\)", url)

    if markdown_match:
        url = markdown_match.group(1)

    # Remove accidental whitespace
    url = url.strip()

    # Give a newly started local server a moment to boot
    for attempt in range(3):

        try:
            response = urllib.request.urlopen(
                url,
                timeout=5,
            )

            return {
                "success": True,
                "reachable": True,
                "status_code": response.status,
                "url": url,
            }

        except urllib.error.HTTPError as error:

            return {
                "success": False,
                "reachable": True,
                "status_code": error.code,
                "url": url,
                "error": str(error),
            }

        except Exception as error:

            if attempt < 2:
                time.sleep(2)
                continue

            return {
                "success": False,
                "reachable": False,
                "status_code": None,
                "url": url,
                "error": str(error),
            }