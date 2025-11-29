import React, { useEffect, useState } from "react";
import { socket } from "./socket";
import ChessBoard from "./Components/ChessBoard";

import ChatBox from "./Components/ChatBot";
import "./App.css";

export default function App() {
  const [fen, setFen] = useState("start");
  const [roasts, setRoasts] = useState([]);
  const [result, setResult] = useState("");
  const [previousFen, setPreviousFen] = useState(null);


  useEffect(() => {
    socket.on("game:init", ({ fen }) => {
      setFen(fen);
      setResult("");
      setRoasts([]);
    });

    socket.on("move:made", ({ fen }) => setFen(fen));
    socket.on("bot:move", ({ fen }) => setFen(fen));

    socket.on("bot:roast", ({ text }) => {
      setRoasts((prev) => [...prev,text].slice(0, 20));
    });

    socket.on("game:over", ({ result }) => setResult(result));

    return () => {
      socket.off();
    };
  }, []);

  return (
    <div className="app">

      <main className="main">
        <aside className="chat-section">
          <ChatBox roasts={roasts} />
        </aside>
        <div className="game-section">
          <div className="chessboard-container">
            <ChessBoard fen={fen} />
          </div>
          
          

          {result && (
            <div className="result-overlay">
              <div className="result-modal">
                <h3 className="result-title">Game Over</h3>
                <p className="result-text">{result}</p>
                <button 
                  className="play-again-btn"
                  onClick={() => socket.emit("reset")}
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>

        
      </main>
    </div>
  );
}