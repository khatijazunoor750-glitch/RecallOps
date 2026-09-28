import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

function App() {
  const [incident, setIncident] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [resolution, setResolution] = useState("");
  const [outcome, setOutcome] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  const analyzeIncident = async () => {
    if (!incident.trim()) {
      setMessage("Please describe the incident first.");
      return;
    }

    setLoading(true);
    setMessage("");
    setAnalysis(null);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          incident: incident,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        setAnalysis(data);
      }
    } catch (error) {
      setMessage("Could not connect to the RecallOps backend.");
    }

    setLoading(false);
  };

  const saveResolution = async () => {
    if (!resolution.trim() || !outcome.trim()) {
      setMessage("Please enter both the resolution and outcome.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          incident: incident,
          resolution: resolution,
          outcome: outcome,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        setMessage("Resolution saved to Hindsight successfully!");
        setResolution("");
        setOutcome("");
      }
    } catch (error) {
      setMessage("Could not connect to the RecallOps backend.");
    }

    setSaving(false);
  };

  return (
    <div className="app">
      <header>
        <div className="logo">🧠 RecallOps</div>
        <p>AI Incident Response Agent with Persistent Memory</p>
      </header>

      <main>
        <section className="card">
          <div className="section-title">
            <span className="step">01</span>
            <div>
              <h2>Describe the Incident</h2>
              <p className="subtitle">
                Tell RecallOps what is happening in production.
              </p>
            </div>
          </div>

          <textarea
            value={incident}
            onChange={(e) => setIncident(e.target.value)}
            placeholder="Example: API latency increased after the latest deployment..."
          />

          <button onClick={analyzeIncident} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Incident →"}
          </button>

          {analysis && (
            <div className="memory-status">
              <strong>🧠 Hindsight Memory Active</strong>
              <span>Previous incident experience recalled</span>
            </div>
          )}
        </section>

        {analysis && (
          <>
            <section className="card">
              <div className="section-title">
                <span className="step">02</span>
                <div>
                  <h2>🧠 Recalled Memories</h2>
                  <p className="subtitle">
                    Hindsight searched previous incident experiences.
                  </p>
                </div>
              </div>

              <div className="memory">
                {analysis.recalled_memories}
              </div>
            </section>

            <section className="card">
              <div className="section-title">
                <span className="step">03</span>
                <div>
                  <h2>🤖 AI Analysis</h2>
                  <p className="subtitle">
                    RecallOps combines the current incident with past memory.
                  </p>
                </div>
              </div>

              <div className="analysis">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {analysis.ai_response}
                </ReactMarkdown>
              </div>
            </section>

            <section className="card">
              <div className="section-title">
                <span className="step">04</span>
                <div>
                  <h2>📋 Record Actual Resolution</h2>
                  <p className="subtitle">
                    Store what actually fixed the incident.
                  </p>
                </div>
              </div>

              <label>Resolution</label>

              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="What actually fixed the incident?"
              />

              <label>Outcome</label>

              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="What happened after the fix?"
              />

              <button onClick={saveResolution} disabled={saving}>
                {saving ? "Saving..." : "Save to Hindsight 🧠"}
              </button>
            </section>
          </>
        )}

        {message && <div className="message">{message}</div>}
      </main>
    </div>
  );
}

export default App;