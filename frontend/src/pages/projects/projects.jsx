import React, { useEffect, useState } from "react";
import "../Project.css";

export default function Project() {
  const [open, setOpen] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState(null);

  const projects = [
    {
      id: 1,  
      number: "01",
      title: "JARVIS UI",
      description:
        "Futuristic AI assistant interface with animated visual systems.",
      status: "ACTIVE",
    },
    {
      id: 2,
      number: "02",
      title: "VOICE SYSTEM",
      description:
        "Voice detection and real-time audio interaction system.",
      status: "ACTIVE",
    },
    {
      id: 3,
      number: "03",
      title: "COSMIC ORB",
      description:
        "Reactive cyan orb with particles, smoke and atmospheric effects.",
      status: "ACTIVE",
    },
    {
      id: 4,
      number: "04",
      title: "COMMAND SYSTEM",
      description:
        "Command interface designed for interacting with JARVIS.",
      status: "ACTIVE",
    },
  ];

  useEffect(() => {
    const openProjects = () => {
      setOpen(true);
    };

    const closeProjects = () => {
      setOpen(false);
      setSelectedProject(null);
    };

    window.addEventListener(
      "jarvis:projects",
      openProjects
    );

    window.addEventListener(
      "jarvis:projects:close",
      closeProjects
    );

    return () => {
      window.removeEventListener(
        "jarvis:projects",
        openProjects
      );

      window.removeEventListener(
        "jarvis:projects:close",
        closeProjects
      );
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        setSelectedProject(null);
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div className="projects-overlay">

      <div
        className="projects-backdrop"
        onClick={() => {
          setOpen(false);
          setSelectedProject(null);
        }}
      />

      <div className="projects-panel">

        <div className="projects-header">

          <div>
            <span className="projects-small-title">
              JARVIS SYSTEM
            </span>

            <h2>
              Projects
            </h2>

            <p>
              PROJECT ARCHIVE
            </p>
          </div>

          <button
            className="projects-close"
            onClick={() => {
              setOpen(false);
              setSelectedProject(null);
            }}
          >
            ×
          </button>

        </div>

        {!selectedProject ? (
          <>
            <div className="projects-line" />

            <div className="projects-row">

              {projects.map((project) => (
                <button
                  key={project.id}
                  className="project-card"
                  onClick={() =>
                    setSelectedProject(project)
                  }
                >
                  <span className="project-number">
                    {project.number}
                  </span>

                  <span className="project-card-title">
                    {project.title}
                  </span>

                  <span className="project-card-description">
                    {project.description}
                  </span>

                  <span className="project-card-status">
                    ● {project.status}
                  </span>

                  <span className="project-arrow">
                    →
                  </span>
                </button>
              ))}

            </div>
          </>
        ) : (
          <div className="project-detail">

            <button
              className="project-back"
              onClick={() =>
                setSelectedProject(null)
              }
            >
              ← BACK TO PROJECTS
            </button>

            <span className="project-detail-number">
              PROJECT {selectedProject.number}
            </span>

            <h3>
              {selectedProject.title}
            </h3>

            <p>
              {selectedProject.description}
            </p>

            <div className="project-detail-box">

              <span>
                PROJECT STATUS
              </span>

              <strong>
                {selectedProject.status}
              </strong>

            </div>

            <div className="project-placeholder">
              <span>◈</span>

              <p>
                PROJECT WORKSPACE
              </p>

              <small>
                Your project content can be added here later.
              </small>
            </div>

          </div>
        )}

        <div className="projects-footer">
          <span className="projects-dot" />
          PROJECT SYSTEM ONLINE
        </div>

      </div>
    </div>
  );
}