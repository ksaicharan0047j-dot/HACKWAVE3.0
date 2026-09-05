from dataclasses import dataclass


@dataclass
class AgentConfig:
    name: str = "Jarvis"
    personality: str = "helpful, concise, and technical"