import React, { useState, useRef, useEffect } from "react";
import { socket } from "../socket";

export default function ChatBox({ roasts }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [roasts]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit("chat:message", { text: message });
      setMessage("");
    }
  };

  return (
    <div className="chatbox">
      
      
      <div className="messages-container">
        {roasts.length === 0 ? (
          <div className="empty-messages">
            <div className="empty-icon">😴</div>
            <p>No roasts yet...</p>
            <small>Make a move and see what the bot says!</small>
          </div>
        ) : (
          roasts.map((roast, index) => (
            <div key={index} className="message">
              <div className="message-header">
                <span className="message-sender">Chotu Ram Ji</span>
                <span className="message-time">now</span>
              </div>
              <p className="message-text">{roast}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form style={{display:"flex" , flexDirection:"row"}} className="message-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your comeback..."
          className="message-input"
          maxLength={200}
        />
        <button 
          type="submit" 
          className="send-btn"
          disabled={!message.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}