import { useEffect, useState } from "react";

import Login from "./pages/login/login";
import Home from "./pages/home/home";
import Projects from "./pages/projects/projects";

function App() {
  const [page, setPage] = useState("login");

  const [selectedProject, setSelectedProject] =
    useState(null);

  /*
   * ---------------------------------------------------------
   * NAVIGATION EVENTS
   * ---------------------------------------------------------
   *
   * Home can request navigation using:
   *
   * window.dispatchEvent(
   *   new CustomEvent("jarvis:navigate", {
   *     detail: { page: "projects" }
   *   })
   * );
   *
   * We listen globally here so every part of the UI
   * can communicate with the main application shell.
   */

  useEffect(() => {
    const handleNavigation = (event) => {
      const nextPage =
        event.detail?.page;

      if (!nextPage) {
        return;
      }

      setPage(nextPage);
    };

    const handleProjectsNavigation = () => {
      setPage("projects");
    };

    window.addEventListener(
      "jarvis:navigate",
      handleNavigation
    );

    /*
     * Backwards compatibility with the existing Home.jsx
     */
    window.addEventListener(
      "jarvis:projects",
      handleProjectsNavigation
    );

    return () => {
      window.removeEventListener(
        "jarvis:navigate",
        handleNavigation
      );

      window.removeEventListener(
        "jarvis:projects",
        handleProjectsNavigation
      );
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * LOGIN
   * ---------------------------------------------------------
   */

  if (page === "login") {
    return (
      <Login
        onLogin={() => {
          setPage("home");
        }}
      />
    );
  }

  /*
   * ---------------------------------------------------------
   * PROJECTS
   * ---------------------------------------------------------
   */

  if (page === "projects") {
    return (
      <Projects
        currentProjectId={
          selectedProject?.id ??
          selectedProject?._id ??
          selectedProject?.name ??
          null
        }
        onSelectProject={(project) => {
          setSelectedProject(project);
        }}
      />
    );
  }

  /*
   * ---------------------------------------------------------
   * HOME
   * ---------------------------------------------------------
   */

  return (
    <Home
      onNavigate={(nextPage) => {
        setPage(nextPage);
      }}
    />
  );
}

export default App;