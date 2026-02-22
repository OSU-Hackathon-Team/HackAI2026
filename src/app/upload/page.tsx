"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInterviewStore } from "@/store/useInterviewStore";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export default function UploadPage() {
  const router = useRouter();
  const { userId: clerkUserId } = useAuth();
  const { clearSessionData, setResumeText, setJobText, setPhase, setSessionId, setUserId, addTranscriptEntry, interviewerPersona, role, company } = useInterviewStore();

  useEffect(() => {
    if (clerkUserId) setUserId(clerkUserId);
  }, [clerkUserId, setUserId]);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobText, setJobTextLocal] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.type === "text/plain")) {
      setResumeFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setResumeFile(file);
  };

  const handleSubmit = async () => {
    if (!resumeFile || !jobText.trim()) return;
    setIsLoading(true);
    clearSessionData();

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("job_description", jobText);
      if (interviewerPersona) {
        formData.append("interviewer_persona", interviewerPersona);
      }
      formData.append("role", role);
      formData.append("company", company);
      if (clerkUserId) {
        formData.append("user_id", clerkUserId);
      }

      const res = await fetch("http://127.0.0.1:8080/api/init-session", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to initialize session");

      const data = await res.json();

      setResumeText(data.resume_text);
      setJobText(data.job_text);
      setSessionId(data.session_id);

      setPhase("connecting");
      router.push("/interview");
    } catch (error) {
      console.error("Initialization error:", error);
      alert("Failed to start interview. Is the backend running on port 8080?");
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = resumeFile && jobText.trim().length > 20;
  const progress = [!!resumeFile, jobText.trim().length > 20].filter(Boolean).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #080b12;
          color: #e8edf5;
          font-family: 'Syne', sans-serif;
        }

        .upload-page {
          min-height: 100vh;
          background: radial-gradient(ellipse 70% 50% at 30% 50%, rgba(123,97,255,0.08) 0%, rgba(0,229,255,0.05) 40%, transparent 70%), #080b12;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* LEFT PANEL */
        .left-panel {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 5rem 4rem 5rem 5rem;
          position: relative;
          border-right: 1px solid #1e2a3a;
        }

        .back-link {
          position: absolute;
          top: 2rem;
          left: 2.5rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #5a6a82;
          text-decoration: none;
          font-size: 0.8rem;
          font-family: 'DM Mono', monospace;
          transition: color 0.15s ease;
        }
        .back-link:hover { color: #00e5ff; }

        .step-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0,229,255,0.06);
          border: 1px solid rgba(0,229,255,0.18);
          border-radius: 6px;
          padding: 0.3rem 0.9rem;
          font-size: 0.68rem;
          font-family: 'DM Mono', monospace;
          color: #00e5ff;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 1.75rem;
          width: fit-content;
        }

        .left-panel h1 {
          font-size: clamp(2.2rem, 3.5vw, 3.25rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.04em;
          color: #e8edf5;
          margin-bottom: 1.25rem;
        }

        .left-panel h1 span {
          color: #00e5ff;
          text-shadow: 0 0 40px rgba(0,229,255,0.3);
        }

        .left-panel p {
          font-size: 0.9rem;
          color: #5a6a82;
          line-height: 1.8;
          margin-bottom: 3rem;
          max-width: 380px;
          font-family: 'DM Mono', monospace;
        }

        /* Progress tracker */
        .progress-tracker {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .progress-step {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          opacity: 0.35;
          transition: opacity 0.3s ease;
        }
        .progress-step.done { opacity: 1; }

        .progress-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid #1e2a3a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.68rem;
          font-family: 'DM Mono', monospace;
          color: #5a6a82;
          flex-shrink: 0;
          transition: all 0.3s ease;
          background: #0e1420;
        }
        .progress-step.done .progress-dot {
          background: rgba(0,229,255,0.12);
          border-color: rgba(0,229,255,0.4);
          color: #00e5ff;
          box-shadow: 0 0 16px rgba(0,229,255,0.2);
        }

        .progress-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #e8edf5;
        }
        .progress-sublabel {
          font-size: 0.72rem;
          color: #5a6a82;
          font-family: 'DM Mono', monospace;
        }

        /* RIGHT PANEL */
        .right-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5rem 5rem 5rem 4rem;
          background: #0e1420;
        }

        .form-container {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        /* Drop zone */
        .drop-zone {
          border: 1px dashed #1e2a3a;
          border-radius: 14px;
          padding: 2.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #080b12;
          position: relative;
          overflow: hidden;
        }
        .drop-zone:hover {
          border-color: rgba(0,229,255,0.3);
          background: rgba(0,229,255,0.02);
        }
        .drop-zone.dragging {
          border-color: #00e5ff;
          background: rgba(0,229,255,0.04);
          transform: scale(1.01);
          box-shadow: 0 0 30px rgba(0,229,255,0.1);
        }
        .drop-zone.filled {
          border-color: rgba(0,224,150,0.4);
          border-style: solid;
          background: rgba(0,224,150,0.03);
        }

        .drop-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: rgba(0,229,255,0.08);
          border: 1px solid rgba(0,229,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          transition: all 0.2s ease;
        }
        .drop-zone.filled .drop-icon {
          background: rgba(0,224,150,0.1);
          border-color: rgba(0,224,150,0.3);
        }

        .field-label {
          font-size: 0.65rem;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #5a6a82;
          margin-bottom: 0.6rem;
          display: block;
        }

        .job-textarea {
          width: 100%;
          background: #080b12;
          border: 1px solid #1e2a3a;
          border-radius: 12px;
          padding: 1rem 1.1rem;
          color: #e8edf5;
          font-family: 'DM Mono', monospace;
          font-size: 0.85rem;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          line-height: 1.65;
          min-height: 140px;
        }
        .job-textarea:focus {
          border-color: rgba(0,229,255,0.35);
          box-shadow: 0 0 0 3px rgba(0,229,255,0.06);
        }
        .job-textarea.filled {
          border-color: rgba(0,224,150,0.35);
        }
        .job-textarea::placeholder { color: #2a3a4a; }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: #00e5ff;
          color: #080b12;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          box-shadow: 0 0 28px rgba(0,229,255,0.25);
          letter-spacing: 0.01em;
        }
        .submit-btn:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,229,255,0.35);
        }
        .submit-btn:disabled {
          background: #1e2a3a;
          color: #5a6a82;
          box-shadow: none;
          cursor: not-allowed;
        }

        .privacy-note {
          text-align: center;
          font-size: 0.72rem;
          color: #2a3a4a;
          font-family: 'DM Mono', monospace;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="upload-page">

        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          <Link href="/" className="back-link">← Back</Link>

          <div className="step-badge">◆ Setup — 2 steps</div>

          <h1>
            Your next offer<br />
            starts <span>here.</span>
          </h1>

          <p>
            Give us your resume and the job you want. We'll build a personalised AI interviewer that knows exactly what to ask.
          </p>

          <div className="progress-tracker">
            <div className={`progress-step ${resumeFile ? "done" : ""}`}>
              <div className="progress-dot">{resumeFile ? "✓" : "1"}</div>
              <div>
                <div className="progress-label">Resume uploaded</div>
                <div className="progress-sublabel">{resumeFile ? resumeFile.name : "PDF or TXT"}</div>
              </div>
            </div>

            <div style={{ width: "1px", height: "20px", background: progress >= 1 ? "rgba(0,229,255,0.3)" : "#1e2a3a", marginLeft: "13px", transition: "background 0.3s ease" }} />

            <div className={`progress-step ${jobText.trim().length > 20 ? "done" : ""}`}>
              <div className="progress-dot">{jobText.trim().length > 20 ? "✓" : "2"}</div>
              <div>
                <div className="progress-label">Job description added</div>
                <div className="progress-sublabel">{jobText.trim().length > 20 ? `${jobText.trim().length} chars` : "Paste any job posting"}</div>
              </div>
            </div>

            <div style={{ width: "1px", height: "20px", background: canSubmit ? "rgba(0,224,150,0.3)" : "#1e2a3a", marginLeft: "13px", transition: "background 0.3s ease" }} />

            <div className={`progress-step ${canSubmit ? "done" : ""}`}>
              <div className="progress-dot" style={canSubmit ? { background: "rgba(0,224,150,0.12)", borderColor: "rgba(0,224,150,0.4)", color: "#00e096", boxShadow: "0 0 16px rgba(0,224,150,0.2)" } : {}}>
                {canSubmit ? "→" : "3"}
              </div>
              <div>
                <div className="progress-label">Start interview</div>
                <div className="progress-sublabel">AI generates your session</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <div className="form-container">

            <div>
              <span className="field-label">01 — Resume</span>
              <div
                className={`drop-zone ${isDragging ? "dragging" : ""} ${resumeFile ? "filled" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.txt" onChange={handleFileInput} style={{ display: "none" }} />
                <div className="drop-icon">
                  {resumeFile ? (
                    <span style={{ color: "#00e096", fontSize: "1.1rem", fontWeight: 700 }}>✓</span>
                  ) : (
                    <img src="/file.png" alt="Upload file" style={{ width: "24px", height: "24px", objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.7)" }} />
                  )}
                </div>
                {resumeFile ? (
                  <>
                    <div style={{ fontWeight: 700, color: "#00e096", marginBottom: "0.25rem" }}>{resumeFile.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#5a6a82", fontFamily: "DM Mono, monospace" }}>
                      {(resumeFile.size / 1024).toFixed(0)} KB · click to replace
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, color: "#e8edf5", marginBottom: "0.35rem" }}>Drop your resume here</div>
                    <div style={{ fontSize: "0.78rem", color: "#5a6a82", fontFamily: "DM Mono, monospace" }}>PDF or TXT · or click to browse</div>
                  </>
                )}
              </div>
            </div>

            <div>
              <span className="field-label">02 — Job Description</span>
              <textarea
                className={`job-textarea ${jobText.trim().length > 20 ? "filled" : ""}`}
                value={jobText}
                onChange={(e) => setJobTextLocal(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={6}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
                <span style={{ fontSize: "0.68rem", color: "#2a3a4a", fontFamily: "DM Mono, monospace" }}>min 20 characters</span>
                <span style={{ fontSize: "0.68rem", color: jobText.length > 20 ? "#00e096" : "#2a3a4a", fontFamily: "DM Mono, monospace" }}>
                  {jobText.length} {jobText.length > 20 ? "✓" : ""}
                </span>
              </div>
            </div>

            <button className="submit-btn" onClick={handleSubmit} disabled={!canSubmit || isLoading}>
              {isLoading ? (
                <>
                  <span style={{ width: "16px", height: "16px", border: "2px solid rgba(8,11,18,0.3)", borderTopColor: "#080b12", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  Building your interview...
                </>
              ) : (
                canSubmit ? "Start Interview →" : "Complete both steps above"
              )}
            </button>

            <p className="privacy-note"> Processed locally · never stored beyond your session</p>
          </div>
        </div>
      </div>
    </>
  );
}