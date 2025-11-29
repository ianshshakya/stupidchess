import React, { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { socket } from "../socket";
import { Chess } from "chess.js";

export default function ChessBoard({ fen }) {
  const [game, setGame] = useState(new Chess());
  const [promotionData, setPromotionData] = useState(null);
  const [boardWidth, setBoardWidth] = useState(300);
  const [isConnected, setIsConnected] = useState(false);
  const whitePieceCapturedSound = new Audio("/audio/whitetake.mp3");
  const blackPieceCapturedSound = new Audio("/audio/blacktake.mp3");


  /* ================================
     SYNC GAME WITH BACKEND FEN (SAFE)
     ================================ */

  useEffect(() => {
    const updated = new Chess();

    const realFen =
      !fen || fen === "start"
        ? updated.fen() // default starting FEN
        : fen;

    try {
      updated.load(realFen);
      setGame(updated);
    } catch (error) {
      console.warn("Invalid FEN received:", realFen);
    }
  }, [fen]);

  /* Connection listeners */
  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  /* Responsive board size */
  useEffect(() => {
    const updateBoardSize = () => {
      if (window.innerWidth < 768) {
        setBoardWidth(Math.min(310, window.innerWidth - 40));
      } else if (window.innerWidth < 1024) {
        setBoardWidth(250);
      } else {
        setBoardWidth(300);
      }
    };

    updateBoardSize();
    window.addEventListener("resize", updateBoardSize);
    return () => window.removeEventListener("resize", updateBoardSize);
  }, []);

  /* ================================
     PROMOTION LOGIC
     ================================ */

  const isPromotion = (source, target) => {
    const piece = game.get(source);

    if (!piece) return false;

    if (piece.type === "p") {
      if (piece.color === "w" && target[1] === "8") return true;
      if (piece.color === "b" && target[1] === "1") return true;
    }

    return false;
  };

  /* ================================
     FIXED ONDROP – OPTIMISTIC UPDATE
     ================================ */

  const onDrop = (source, target) => {
    if (isPromotion(source, target)) {
      setPromotionData({ from: source, to: target });
      return false;
    }

    const tempGame = new Chess(game.fen());
    // check if target square had a piece BEFORE the move
    // BEFORE making the move → check if a piece exists on target
    const targetPieceBeforeMove = game.get(target);

    const move = tempGame.move({
      from: source,
      to: target,
      promotion: "q",
    });

    if (!move) return false;

    // 🔥 PLAY SOUND ONLY WHEN ACTUAL CAPTURE OCCURRED
    if (targetPieceBeforeMove) {
      if (targetPieceBeforeMove.color === "w") {
        // WHITE WAS TAKEN by black
        whitePieceCapturedSound.play();
      } else {
        // BLACK WAS TAKEN by white
        blackPieceCapturedSound.play();
      }
    }



    if (!move) return false;

    // 🔥 instant UI update
    setGame(tempGame);

    // send to backend
    socket.emit("player:move", {
      from: source,
      to: target,
      promotion: "q",
    });

    return true;
  };

  /* Promotion handler */
  const promote = (piece) => {
    const tempGame = new Chess(game.fen());

    tempGame.move({
      from: promotionData.from,
      to: promotionData.to,
      promotion: piece,
    });

    setGame(tempGame);

    socket.emit("player:move", {
      from: promotionData.from,
      to: promotionData.to,
      promotion: piece,
    });

    setPromotionData(null);
  };

  /* ================================
     CUSTOM PIECES (BLACK ONLY)
     ================================ */

  const importPiece = (name) => `/images/${name}.png`;

  const customPieces = {
    bK: () => <img src={importPiece("bK")} style={{ width: "100%", height: "100%" }} draggable="true" />,
    bQ: () => <img src={importPiece("bQ")} style={{ width: "100%", height: "100%" }} draggable="true" />,
    bR: () => <img src={importPiece("bR")} style={{ width: "100%", height: "100%" }} draggable="true" />,
    bB: () => <img src={importPiece("bB")} style={{ width: "100%", height: "100%" }} draggable="true" />,
    bN: () => <img src={importPiece("bN")} style={{ width: "100%", height: "100%" }} draggable="true" />,
    bP: () => <img src={importPiece("bP")} style={{ width: "100%", height: "100%" }} draggable="true" />,
  };

  return (
    <div className="chessboard-wrapper">
      <Chessboard
        id="HalloweenChess"
        position={game.fen()}   // always stable FEN
        onPieceDrop={onDrop}
        boardWidth={boardWidth}
        animationDuration={0}   // 🔥 no flicker/snap
        customBoardStyle={{
          borderRadius: "8px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
        customPieces={customPieces}
        customDarkSquareStyle={{ backgroundColor: "#ff6b35" }}
        customLightSquareStyle={{ backgroundColor: "#2a2a2a" }}
      />

      {/* connection + new game */}
      <div style={{ display: "flex", flexDirection: "row" }} className="controls">
        <div className="connection-status">
          <div className={`status-indicator ${isConnected ? "connected" : "disconnected"}`} />
          <span>Status: {isConnected ? "Connected" : "Disconnected"}</span>
        </div>

        <div className="control-buttons">
          <button className="control-btn reset-btn" onClick={() => socket.emit("reset")}>
            🎮 New Game
          </button>
        </div>
      </div>

      {/* Promotion overlay */}
      {promotionData && (
        <div className="promotion-overlay">
          <div className="promotion-modal">
            <h4>Promote Pawn</h4>
            <div className="promotion-options">
              <button className="promotion-btn" onClick={() => promote("q")}>♕ Queen</button>
              <button className="promotion-btn" onClick={() => promote("r")}>♖ Rook</button>
              <button className="promotion-btn" onClick={() => promote("b")}>♗ Bishop</button>
              <button className="promotion-btn" onClick={() => promote("n")}>♘ Knight</button>
            </div>
            <button className="promotion-cancel" onClick={() => setPromotionData(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
