import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

API_KEY = os.getenv("FEATHERLESS_API_KEY")

if not API_KEY:
    raise RuntimeError("FEATHERLESS_API_KEY is missing")

client = OpenAI(
    api_key=API_KEY,
    base_url="https://api.featherless.ai/v1",
    timeout=60.0,
)

MODEL = "Qwen/Qwen3.8-27B"


def ask_featherless(prompt: str) -> str:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    return response.choices[0].message.content  