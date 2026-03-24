import React, { useState } from "react";
import { askAI } from "../utils/ai";

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const send = async () => {
    const response = await askAI(input);
    setMessages([...messages, { q: input, a: response }]);
    setInput("");
  };

  return (
    <div>
      <h2>💬 Local Chat</h2>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={send}>Send</button>

      {messages.map((m, i) => (
        <div key={i}>
          <b>You:</b> {m.q}
          <br />
          <b>AI:</b> {m.a}
        </div>
      ))}
    </div>
  );
}