# VEXORITE

VEXORITE is an AI-powered desktop agent built for HackWave 3.0 at SNIST Hyderabad.

The original idea was not to build another chatbot or AI coding assistant that only generates code.

The goal was to build an agent that can understand a user's natural-language request, plan the required actions, actually perform those actions on the computer, verify the result, ask the user for approval before publishing anything, push the result to GitHub, deploy it to Vercel, and remember successful workflows for future use.

The project is being developed as a 24-hour hackathon project, so the focus is on demonstrating a complete working agent loop rather than building every possible feature.

---

# 1. Original Idea

The central idea behind VEXORITE is:

```text
User
 |
 | Natural language command
 v
VEXORITE
 |
 | Understand request
 v
AI Planning
 |
 | Select tools
 v
Tool Execution
 |
 | Create / edit / run
 v
Verification
 |
 | Check whether result actually works
 v
User Approval
 |
 | Approve / Reject
 v
GitHub
 |
 | Push project
 v
Vercel
 |
 v
Live Project

2. What We Do Not Want VEXORITE To Become
A major design decision was that VEXORITE should not become a generic chatbot.
The chat/command interface is only the control interface.
The actual product is the agent execution system behind it.
Natural Language
        +
AI
        +
Tools
        +
Real Computer Actions
        +
Verification
        +
Human Approval
        +
Deployment
        +
Workflow Memory

3. Main Hackathon Demonstration
1. User gives a natural-language task

2. VEXORITE understands the request

3. AI decides what needs to be done

4. VEXORITE executes tools

5. Files/project are created

6. Project is started locally

7. VEXORITE verifies that it works

8. A public preview is generated

9. VEXORITE says:
   WEBSITE VERIFIED
   READY FOR DEPLOYMENT

10. User enters GitHub repository

11. User presses APPROVE

12. VEXORITE pushes to GitHub

13. VEXORITE deploys through Vercel

14. Live URL is returned

15. Workflow can be remembered and reused

4. Architecture
VEXORITE
|
+-- Frontend
|     |
|     +-- React
|     +-- Vite
|     +-- Command interface
|     +-- Login
|     +-- Projects
|     +-- Settings
|     +-- Themes
|     +-- Deployment approval
|
+-- Backend
      |
      +-- FastAPI
      |
      +-- Agent
      |     |
      |     +-- Jarvis
      |     +-- Orchestrator
      |     +-- Config
      |
      +-- AI
      |     |
      |     +-- Featherless
      |
      +-- Tools
      |     |
      |     +-- File system
      |     +-- Terminal
      |     +-- Process management
      |     +-- Verification
      |     +-- Website generation
      |     +-- Deployment
      |
      +-- Memory
            |
            +-- Workflow memory
            +-- Workflow executor
            +-- Stored workflows


# use 1234 as OTP
