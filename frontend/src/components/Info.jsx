import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/ailo-logo.png";

export default function Info() {
  const teamMembers = [
    "Team Member 1",
    "Team Member 2",
    "Team Member 3",
    "Team Member 4",
    "Team Member 5",
  ];

  return (
    <div className="container">
      {/* Back Button */}
      <div className="page-actions" role="group" aria-label="Ailo navigation">
        <Link to="/" className="btn btn-outline">
          ← Back to Ailo
        </Link>
      </div>

      {/* Main two-column */}
      <section className="hero">
        {/* Left About Card */}
        <article className="glass hero-card hero-about">
          <div className="hero-text">
            <div className="hero-logo-card">
              <img src={logo} alt="Ailo Logo" className="ailo-logo" />
              <p className="eyebrow" style={{ marginTop: 4 }}>
                About Ailo
              </p>
            </div>

            <div className="hero-copy">
              <h1>Built for easy conversations</h1>
              <p>
                Ailo is a lightweight AI chat experience that can be used by anyone.
              </p>
              <p className="muted">
                This page gives a quick overview of the team and what Ailo believes in.
              </p>
            </div>
          </div>
        </article>

        {/*  Right Team List */}
        <aside className="glass hero-card" aria-labelledby="team-heading">
          <header style={{ marginBottom: 12 }}>
            <p className="eyebrow">Team</p>
            <h2
              id="team-heading"
              style={{
                margin: "4px 0 0",
                fontSize: "20px",
                fontWeight: 800,
              }}
            >
              People behind Ailo
            </h2>
          </header>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "12px 0 0",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {teamMembers.map((name, idx) => (
              <li
                key={name}
                className="glass"
                style={{
                  padding: "10px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.24)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04))",
                  boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span>{name}</span>
                <span
                  className="badge"
                  style={{
                    fontSize: 11,
                    padding: "4px 8px",
                  }}
                >
                  Team Member
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {/* Small bottom features cards */}
      <section className="features">
        <div className="feature glass">
          <p className="eyebrow">Focus</p>
          <h3>Distraction-free chat</h3>
          <p>
            Ailo has a minimal lightweight design that allows you to just use Ai how you wanted with no unneeded extras.
          </p>
        </div>
        <div className="feature glass">
          <p className="eyebrow">Privacy</p>
          <h3>Thoughtful by design</h3>
          <p>
            No need to login, no public feed just you, your questions, and answers.
          </p>
        </div>
        <div className="feature glass">
          <p className="eyebrow">Speed</p>
          <h3>Ready when you are</h3>
          <p>
            Quick loading times, Ailo is ready whenever you are.
          </p>
        </div>
      </section>
    </div>
  );
}