import React, { useState } from "react";
import Chat from "./components/Chat";
import PDFAnalyzer from "./components/PDFAnalyzer";
import PrivacyScanner from "./components/PrivacyScanner";

export default function App() {
  const [tab, setTab] = useState("chat");

  return (
    <div style={{ padding: 20 }}>
      <h1>🧠 PrivateAI Workspace</h1>

      <div>
        <button onClick={() => setTab("chat")}>Chat</button>
        <button onClick={() => setTab("pdf")}>PDF</button>
        <button onClick={() => setTab("privacy")}>Privacy</button>
      </div>

      {tab === "chat" && <Chat />}
      {tab === "pdf" && <PDFAnalyzer />}
      {tab === "privacy" && <PrivacyScanner />}
    </div>
  );
}