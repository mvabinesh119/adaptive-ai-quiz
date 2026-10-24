import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, ArrowRight, BrainCircuit, Check, CheckCircle2, ChevronRight,
  CircleHelp, Flame, GraduationCap, Lightbulb, LoaderCircle, RotateCcw,
  Sparkles, Target, Trophy, X, Zap, FileText, UploadCloud, Trash2
} from "lucide-react";
import "./styles.css";

const API = "http://localhost:5000/api";

function App() {
  const [subject, setSubject] = useState("Electronics");
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("demo");
  const [difficulty, setDifficulty] = useState("Medium");
  const [asked, setAsked] = useState([]);
  const [history, setHistory] = useState([]);
  const [topicStats, setTopicStats] = useState({});
  const [rightStreak, setRightStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [material, setMaterial] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const correctCount = history.filter(item => item.correct).length;
  const accuracy = history.length ? Math.round((correctCount / history.length) * 100) : 0;
  const progress = Math.min((history.length / 10) * 100, 100);
  const weakTopics = useMemo(
    () => Object.entries(topicStats)
      .filter(([, stat]) => stat.total >= 1 && stat.correct / stat.total < 0.7)
      .map(([topic]) => topic),
    [topicStats]
  );

  const loadQuestion = useCallback(async (nextDifficulty = difficulty, targetTopic = "", sourceMaterial = material, selectedSubject = subject) => {
    setLoading(true);
    setError("");
    setChecked(false);
    setSelected(null);
    setShowHint(false);
    try {
      const response = await fetch(`${API}/quiz/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedSubject,
          topic: targetTopic,
          difficulty: nextDifficulty,
          recentQuestions: asked,
          weakTopics,
          materialId: sourceMaterial?.id || ""
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The quiz server returned an error.");
      setQuestion(data);
      setMode(data.mode || "demo");
      setAsked(prev => [...prev, data.question]);
    } catch (err) {
      setError(err.message || "Cannot connect to the quiz server. Start the server with `npm run dev` from the project root.");
    } finally {
      setLoading(false);
    }
  }, [subject, difficulty, asked, weakTopics, material]);

  useEffect(() => {
    loadQuestion("Medium");
    // Load the first question only once on page mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadPdf = async (file) => {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const response = await fetch(`${API}/material/upload`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not read this PDF.");

      const nextMaterial = data.material;
      setMaterial(nextMaterial);
      setAsked([]);
      setHistory([]);
      setTopicStats({});
      setRightStreak(0);
      setWrongStreak(0);
      setDifficulty("Medium");
      await loadQuestion("Medium", "", nextMaterial, subject);
    } catch (err) {
      setUploadError(err.message || "PDF upload failed. Please try another file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeMaterial = async () => {
    const oldMaterial = material;
    setMaterial(null);
    setUploadError("");
    setAsked([]);
    setHistory([]);
    setTopicStats({});
    setRightStreak(0);
    setWrongStreak(0);
    setDifficulty("Medium");
    if (oldMaterial?.id) {
      fetch(`${API}/material/${oldMaterial.id}`, { method: "DELETE" }).catch(() => {});
    }
    await loadQuestion("Medium", "", null, subject);
  };

  const submitAnswer = () => {
    if (selected === null || checked || !question) return;
    const correct = selected === question.answer;
    setChecked(true);
    setHistory(prev => [...prev, { correct, topic: question.topic, difficulty: question.difficulty }]);
    setTopicStats(prev => {
      const old = prev[question.topic] || { total: 0, correct: 0 };
      return {
        ...prev,
        [question.topic]: {
          total: old.total + 1,
          correct: old.correct + (correct ? 1 : 0)
        }
      };
    });

    if (correct) {
      setWrongStreak(0);
      setRightStreak(prev => {
        const next = prev + 1;
        if (next >= 2) setDifficulty("Hard");
        else if (difficulty === "Easy") setDifficulty("Medium");
        return next;
      });
    } else {
      setRightStreak(0);
      setWrongStreak(prev => {
        const next = prev + 1;
        if (next >= 2) setDifficulty("Easy");
        else if (difficulty === "Hard") setDifficulty("Medium");
        return next;
      });
    }
  };

  const nextQuestion = () => {
    const target = weakTopics[0] || "";
    loadQuestion(difficulty, target);
  };

  const restart = () => {
    setHistory([]);
    setTopicStats({});
    setAsked([]);
    setRightStreak(0);
    setWrongStreak(0);
    setDifficulty("Medium");
    loadQuestion("Medium", "", material, subject);
  };

  const topicRows = Object.entries(topicStats).sort((a, b) => {
    const ar = a[1].correct / a[1].total;
    const br = b[1].correct / b[1].total;
    return ar - br;
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><BrainCircuit size={23} /></div>
          <div><strong>EduBridge</strong><span>AI LEARNING STUDIO</span></div>
        </div>
        <div className="side-label">WORKSPACE</div>
        <button className="nav-item active"><Target size={18} /> Adaptive Quiz <span className="nav-dot" /></button>
        <button className="nav-item" onClick={() => alert("Topic analytics update as you answer questions.")}><Activity size={18} /> Learning analytics</button>
        <div className="sidebar-bottom">
          <div className="mini-profile">
            <div className="avatar">S</div>
            <div><strong>Student workspace</strong><span>Learning in progress</span></div>
          </div>
          <div className="sidebar-note"><Sparkles size={15} /> Every answer helps personalize your next question.</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <ChevronRight size={14} /> <span>Adaptive quiz</span></div>
          <div className="topbar-right">
            <span className={`mode-pill ${mode === "gemini" ? "ai" : ""}`}><span className="status-dot" />{mode === "gemini" ? "Gemini AI connected" : "Demo question mode"}</span>
            <div className="top-avatar">S</div>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow"><Zap size={14} /> PERSONALIZED PRACTICE</div>
            <h1>Adaptive <span>Quiz.</span></h1>
            <p>A smarter way to learn. Your next question responds to your progress.</p>
          </div>
          <button className="reset-btn" onClick={restart}><RotateCcw size={15} /> Reset session</button>
        </section>

        <section className="stats-grid">
          <Stat icon={<Target size={18} />} label="Accuracy" value={`${accuracy}%`} note={`${correctCount} correct answers`} color="violet" />
          <Stat icon={<Activity size={18} />} label="Questions answered" value={history.length.toString().padStart(2, "0")} note="This session" color="blue" />
          <Stat icon={<Flame size={18} />} label="Current difficulty" value={difficulty} note="Changes as you learn" color="orange" />
          <Stat icon={<Trophy size={18} />} label="Topics practiced" value={Object.keys(topicStats).length.toString().padStart(2, "0")} note="Tracked individually" color="green" />
        </section>

        <section className={`upload-panel ${material ? "has-material" : ""}`}>
          <div className="upload-icon"><FileText size={21} /></div>
          <div className="upload-copy">
            <strong>{material ? "Study material connected" : "Generate a quiz from your PDF"}</strong>
            <p>{material ? `${material.filename} · ${material.pages ? `${material.pages} pages · ` : ""}${material.charCount.toLocaleString()} characters extracted` : "Upload lecture notes, textbook chapters, or revision sheets. Questions will be grounded in the text we can extract."}</p>
            {material?.truncated && <small>Large document: the first section is used for question generation in this starter.</small>}
            {uploadError && <small className="upload-error">{uploadError}</small>}
          </div>
          <input ref={fileInputRef} className="file-input-hidden" type="file" accept="application/pdf,.pdf" onChange={e => uploadPdf(e.target.files?.[0])} />
          {material ? (
            <button className="upload-secondary-btn" onClick={removeMaterial} disabled={uploading}><Trash2 size={15} /> Remove PDF</button>
          ) : (
            <button className="upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <LoaderCircle size={16} className="spin" /> : <UploadCloud size={16} />}
              {uploading ? "Reading PDF…" : "Upload PDF"}
            </button>
          )}
        </section>

        <div className="content-grid">
          <section className="quiz-card">
            <div className="quiz-card-head">
              <div className="quiz-label"><span className="live-dot" /> LIVE QUIZ SESSION</div>
              <select value={subject} onChange={e => { const nextSubject = e.target.value; setSubject(nextSubject); setAsked([]); loadQuestion("Medium", "", material, nextSubject); }} aria-label="Choose subject">
                <option>Electronics</option><option>Programming</option><option>Science</option>
              </select>
            </div>
            <div className="quiz-progress-row">
              <span>QUESTION {history.length + 1}</span>
              <span>{history.length} completed</span>
            </div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

            {loading ? (
              <div className="loading-state"><LoaderCircle className="spin" size={28} /><strong>Preparing your next question…</strong><span>Adapting to your learning progress</span></div>
            ) : error ? (
              <div className="error-state"><CircleHelp size={25} /><strong>Quiz server unavailable</strong><p>{error}</p><button className="primary-btn" onClick={() => loadQuestion()}>Try again <ArrowRight size={16} /></button></div>
            ) : question && (
              <>
                <div className="question-meta"><span className="topic-tag">{question.topic}</span><span className={`difficulty ${question.difficulty.toLowerCase()}`}>{question.difficulty}</span></div>
                <h2 className="question-title">{question.question}</h2>
                <p className="question-instruction">Choose the best answer below.</p>
                {question.grounded && material && <div className="source-evidence"><div><FileText size={14} /> Grounded in {material.filename}</div>{question.sourceEvidence && <blockquote>“{question.sourceEvidence}”</blockquote>}</div>}
                <div className="options-list">
                  {question.options.map((option, index) => {
                    const isCorrect = index === question.answer;
                    const isSelected = selected === index;
                    let cls = "option";
                    if (checked && isCorrect) cls += " correct";
                    else if (checked && isSelected && !isCorrect) cls += " wrong";
                    else if (isSelected) cls += " selected";
                    return (
                      <button key={`${question.question}-${index}`} className={cls} disabled={checked} onClick={() => setSelected(index)}>
                        <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                        <span className="option-text">{option}</span>
                        {checked && isCorrect && <CheckCircle2 className="option-status" size={19} />}
                        {checked && isSelected && !isCorrect && <X className="option-status" size={19} />}
                      </button>
                    );
                  })}
                </div>

                {checked && (
                  <div className={`feedback-box ${selected === question.answer ? "good" : "needs-work"}`}>
                    <div className="feedback-title">
                      {selected === question.answer ? <CheckCircle2 size={18} /> : <Lightbulb size={18} />}
                      {selected === question.answer ? "Nice work! You got it." : "Let's learn from this one."}
                    </div>
                    <p>{question.explanation}</p>
                    <span>{selected === question.answer ? "Your next question may be more challenging." : `We'll prioritize ${question.topic} for extra practice.`}</span>
                  </div>
                )}

                <div className="quiz-actions">
                  <button className="hint-btn" onClick={() => setShowHint(v => !v)}><Lightbulb size={16} /> {showHint ? "Hide learning tip" : "Learning tip"}</button>
                  {!checked ? (
                    <button className="primary-btn" disabled={selected === null} onClick={submitAnswer}>Check answer <ArrowRight size={16} /></button>
                  ) : (
                    <button className="primary-btn" onClick={nextQuestion}>Next question <ArrowRight size={16} /></button>
                  )}
                </div>
                {showHint && <div className="hint-box">Try eliminating options that conflict with the core concept. After answering, read the explanation and notice which topic you should revisit.</div>}
              </>
            )}
          </section>

          <aside className="insights-column">
            <section className="insight-card ai-card">
              <div className="insight-heading"><div className="insight-icon purple"><BrainCircuit size={19} /></div><span>AI LEARNING COACH</span></div>
              <h3>Your progress, personalized.</h3>
              <p>{history.length === 0 ? "Answer a question to start building your personal learning profile." : weakTopics.length ? `Let's strengthen ${weakTopics.slice(0, 2).join(" and ")} with focused practice.` : "Great start. Keep answering to reveal topics that need more attention."}</p>
              <div className="coach-status"><span className="pulse" /> {history.length ? "Learning profile updating" : "Waiting for first answer"}</div>
            </section>

            <section className="insight-card">
              <div className="panel-title"><span>TOPIC MASTERY</span><span className="tiny-count">{topicRows.length} tracked</span></div>
              {topicRows.length === 0 ? (
                <div className="empty-topics"><div className="empty-icon"><GraduationCap size={21} /></div><strong>Your topics will appear here</strong><p>Finish a question to see your topic-level performance.</p></div>
              ) : (
                <div className="topic-list">
                  {topicRows.map(([topic, stat]) => {
                    const pct = Math.round((stat.correct / stat.total) * 100);
                    return <div className="topic-row" key={topic}>
                      <div className="topic-row-top"><span>{topic}</span><strong>{pct}%</strong></div>
                      <div className="topic-track"><div className={`topic-fill ${pct < 70 ? "low" : ""}`} style={{ width: `${pct}%` }} /></div>
                      <small>{stat.correct}/{stat.total} correct</small>
                    </div>;
                  })}
                </div>
              )}
            </section>

            <section className="adapt-card">
              <div className="adapt-icon"><Sparkles size={18} /></div>
              <div><strong>How adaptation works</strong><p>Two correct answers in a row increase difficulty. Two incorrect answers lower it. Weak topics get priority.</p></div>
            </section>
          </aside>
        </div>
        <footer className="footer-note">BUILT FOR DEEPER LEARNING <span>•</span> One question at a time, one concept at a time.</footer>
      </main>
    </div>
  );
}

function Stat({ icon, label, value, note, color }) {
  return <div className="stat-card">
    <div className={`stat-icon ${color}`}>{icon}</div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-note">{note}</div>
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
