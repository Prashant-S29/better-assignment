import { Link } from "react-router-dom";

const Home: React.FC = () => {
  return (
    <>
      <div
        style={{
          background: "#fff3cd",
          borderBottom: "1px solid #f0c040",
          padding: "0.65rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
          position: "fixed",
          top: 0,
          width: "100%",
          textAlign: "center",
          fontSize: "0.82rem",
          fontFamily: "var(--font-mono)",
          color: "#7a5800",
        }}
      >
        <span style={{ fontWeight: 700 }}>
          This project is no longer maintained.
        </span>
        <span>Please follow</span>
        <a
          href="https://github.com/Prashant-S29/better-assignment?tab=readme-ov-file#local-setup"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#7a5800",
            fontWeight: 700,
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          this guide
        </a>
        <span>to set up and run locally.</span>
      </div>
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "4rem 2rem",
          maxWidth: 700,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontSize: "16px",
            color: "var(--accent)",
            marginBottom: "1.5rem",
            fontWeight: 700,
          }}
        >
          [ Assignment Solutions for Better Software ]
        </p>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: "1.5rem",
          }}
        >
          Review any
          <br />
          GitHub PR
          <span style={{ color: "var(--accent)" }}>.</span>
          <br />
          Instantly
          <span style={{ color: "var(--text-muted)" }}>.</span>
        </h1>

        <p
          style={{
            color: "var(--text-dim)",
            fontSize: "1rem",
            lineHeight: 1.7,
            maxWidth: 480,
            marginBottom: "2.5rem",
          }}
        >
          Paste a public GitHub PR URL. Get a structured AI review covering
          architecture, security, correctness, and code quality — in seconds.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link
            to="https://github.com/Prashant-S29/better-assignment?tab=readme-ov-file#local-setup"
            target="_blank"
            style={{
              background: "var(--accent)",
              color: "#000",
              padding: "0.85rem 2rem",
              borderRadius: "var(--radius)",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              fontSize: "0.875rem",
            }}
          >
            Setup and run locally
          </Link>
        </div>
        <div
          style={{
            marginTop: "4rem",
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
          }}
        >
          {[
            ["Architecture", "Patterns & structure"],
            ["Security", "Vulnerability scan"],
            ["Correctness", "Logic & edge cases"],
            ["Quality", "Readability & naming"],
          ].map(([title, desc]) => (
            <div key={title}>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: "var(--accent)",
                  marginBottom: "0.2rem",
                }}
              >
                {title}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
};

export default Home;
