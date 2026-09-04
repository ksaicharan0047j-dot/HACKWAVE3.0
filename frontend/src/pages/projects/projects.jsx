import React, { useEffect, useState } from "react";
import "./Project.css";

const Project = ({ projects: projectsProp = [], currentProjectId, onSelectProject }) => {
  const [projects, setProjects] = useState(projectsProp);
  const [activeProject, setActiveProject] = useState(currentProjectId || null);

  /*
   * Load projects.
   *
   * Priority:
   * 1. projects passed from parent
   * 2. localStorage
   */
  useEffect(() => {
    if (projectsProp && projectsProp.length > 0) {
      setProjects(projectsProp);
      return;
    }

    try {
      const savedProjects = localStorage.getItem("projects");

      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);

        if (Array.isArray(parsedProjects)) {
          setProjects(parsedProjects);
        }
      }
    } catch (error) {
      console.error("Unable to load projects:", error);
    }
  }, [projectsProp]);

  /*
   * Keep active project synced with parent.
   */
  useEffect(() => {
    if (currentProjectId !== undefined) {
      setActiveProject(currentProjectId);
    }
  }, [currentProjectId]);

  /*
   * Select project.
   */
  const handleProjectClick = (project) => {
    const id = project.id ?? project._id ?? project.name;

    setActiveProject(id);

    if (onSelectProject) {
      onSelectProject(project);
    }
  };

  /*
   * If there are no projects.
   */
  if (!projects || projects.length === 0) {
    return (
      <section className="projects-panel">
        <div className="projects-empty">
          <div className="projects-empty-orb"></div>

          <h2>No previous projects</h2>

          <p>
            Your previous projects will appear here when they are created.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="projects-panel">
      <div className="projects-header">
        <div>
          <span className="projects-eyebrow">
            PROJECT ARCHIVE
          </span>

          <h1>Previous Projects</h1>

          <p>
            Select a project to switch back instantly.
          </p>
        </div>

        <div className="projects-count">
          <span>{projects.length}</span>
          <small>PROJECTS</small>
        </div>
      </div>

      <div className="projects-row">
        {projects.map((project, index) => {
          const id =
            project.id ??
            project._id ??
            project.name ??
            `project-${index}`;

          const isActive = activeProject === id;

          return (
            <button
              key={id}
              type="button"
              className={`project-card ${
                isActive ? "project-card-active" : ""
              }`}
              onClick={() => handleProjectClick(project)}
            >
              <div className="project-card-glow"></div>

              <div className="project-card-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="project-card-content">
                <div className="project-icon">
                  {project.icon || "◈"}
                </div>

                <div className="project-info">
                  <h2>
                    {project.name ||
                      project.title ||
                      `Project ${index + 1}`}
                  </h2>

                  <p>
                    {project.description ||
                      project.subtitle ||
                      "Previous project"}
                  </p>
                </div>
              </div>

              <div className="project-card-bottom">
                <span>
                  {project.updatedAt
                    ? `UPDATED ${project.updatedAt}`
                    : "ARCHIVED PROJECT"}
                </span>

                <span className="project-arrow">
                  →
                </span>
              </div>

              {isActive && (
                <div className="project-active-indicator">
                  ACTIVE
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default Project;