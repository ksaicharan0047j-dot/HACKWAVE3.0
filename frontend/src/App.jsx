import { useEffect, useState } from "react";

import Login from "./pages/login/login";
import Home from "./pages/home/home";
import Projects from "./pages/projects/projects";

function App() {
  // Keep the user logged in after refresh.
  const [page, setPage] = useState(() => {
    const authenticated = localStorage.getItem("vexorite_authenticated");

    return authenticated === "true" ? "home" : "login";
  });

  const [selectedProject, setSelectedProject] = useState(null);

  /*
   * ---------------------------------------------------------
   * NAVIGATION EVENTS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const handleNavigation = (event) => {
      const nextPage = event.detail?.page;

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
     * Backwards compatibility with existing Home.jsx
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
        onLogin={(email) => {
          // Login.jsx already stores these values,
          // but keeping this here makes App independently safe.
          localStorage.setItem(
            "vexorite_authenticated",
            "true"
          );

          if (email) {
            localStorage.setItem(
              "vexorite_email",
              email
            );
          }

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