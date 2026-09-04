import React, {
  useEffect,
  useState,
} from "react";

import "./projects.css";

function Projects({
  projects: projectsProp = [],
  currentProjectId,
  onSelectProject,
}) {
  const [projects, setProjects] =
    useState(projectsProp);

  const [activeProject, setActiveProject] =
    useState(
      currentProjectId || null
    );

  /*
   * ---------------------------------------------------------
   * LOAD PROJECTS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (
      projectsProp &&
      projectsProp.length > 0
    ) {
      setProjects(projectsProp);
      return;
    }

    try {
      const savedProjects =
        localStorage.getItem(
          "projects"
        );

      if (!savedProjects) {
        return;
      }

      const parsedProjects =
        JSON.parse(
          savedProjects
        );

      if (
        Array.isArray(
          parsedProjects
        )
      ) {
        setProjects(
          parsedProjects
        );
      }
    } catch (error) {
      console.error(
        "Unable to load projects:",
        error
      );
    }
  }, [projectsProp]);

  /*
   * ---------------------------------------------------------
   * SYNC ACTIVE PROJECT
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (
      currentProjectId !==
      undefined
    ) {
      setActiveProject(
        currentProjectId
      );
    }
  }, [currentProjectId]);

  /*
   * ---------------------------------------------------------
   * SELECT PROJECT
   * ---------------------------------------------------------
   */

  const handleProjectClick = (
    project
  ) => {
    const id =
      project.id ??
      project._id ??
      project.name;

    setActiveProject(id);

    if (onSelectProject) {
      onSelectProject(project);
    }
  };

  /*
   * ---------------------------------------------------------
   * BACK TO HOME
   * ---------------------------------------------------------
   */

  const goHome = () => {
    window.dispatchEvent(
      new CustomEvent(
        "jarvis:navigate",
        {
          detail: {
            page: "home",
          },
        }
      )
    );
  };

  /*
   * ---------------------------------------------------------
   * EMPTY STATE
   * ---------------------------------------------------------
   */

  if (
    !projects ||
    projects.length === 0
  ) {
    return (
      <section className="projects-panel">

        <button
          type="button"
          className="projects-back-button"
          onClick={goHome}
        >
          ← BACK TO JARVIS
        </button>

        <div className="projects-empty">

          <div className="projects-empty-orb">
            <div className="projects-empty-orb-core" />
          </div>

          <span className="projects-eyebrow">
            PROJECT ARCHIVE
          </span>

          <h2>
            No previous projects
          </h2>

          <p>
            Your previous projects
            will appear here when
            they are created.
          </p>

        </div>
      </section>
    );
  }

  /*
   * ---------------------------------------------------------
   * PROJECT PAGE
   * ---------------------------------------------------------
   */

  return (
    <section className="projects-panel">

      <div className="projects-topbar">

        <button
          type="button"
          className="projects-back-button"
          onClick={goHome}
        >
          ← BACK TO JARVIS
        </button>

        <div className="projects-system-status">
          <span />
          MEMORY ONLINE
        </div>

      </div>

      <div className="projects-header">

        <div>

          <span className="projects-eyebrow">
            PROJECT ARCHIVE
          </span>

          <h1>
            Previous Projects
          </h1>

          <p>
            Select a project to
            switch back instantly.
          </p>

        </div>

        <div className="projects-count">

          <span>
            {projects.length}
          </span>

          <small>
            PROJECTS
          </small>

        </div>

      </div>

      <div className="projects-row">

        {projects.map(
          (project, index) => {

            const id =
              project.id ??
              project._id ??
              project.name ??
              `project-${index}`;

            const isActive =
              activeProject === id;

            return (
              <button
                key={id}
                type="button"
                className={
                  `project-card ${
                    isActive
                      ? "project-card-active"
                      : ""
                  }`
                }
                onClick={() =>
                  handleProjectClick(
                    project
                  )
                }
              >

                <div className="project-card-glow" />

                <div className="project-card-number">
                  {String(
                    index + 1
                  ).padStart(
                    2,
                    "0"
                  )}
                </div>

                <div className="project-card-content">

                  <div className="project-icon">
                    {project.icon ||
                      "◈"}
                  </div>

                  <div className="project-info">

                    <h2>
                      {project.name ||
                        project.title ||
                        `Project ${
                          index + 1
                        }`}
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
                      ? `UPDATED ${
                          project.updatedAt
                        }`
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
          }
        )}

      </div>

    </section>
  );
}

export default Projects;