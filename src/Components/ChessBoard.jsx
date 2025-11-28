import React, { useState , useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { socket } from "../socket";

export default function ChessBoard({ fen }) {
  const [promotionData, setPromotionData] = useState(null);
  const [boardWidth, setBoardWidth] = useState(300);
  const [isConnected, setIsConnected] = useState(false);
  
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
  
  // Responsive board size
  React.useEffect(() => {
    const updateBoardSize = () => {
      if (window.innerWidth < 768) {
        setBoardWidth(Math.min(290, window.innerWidth - 40));
      } else if (window.innerWidth < 1024) {
        setBoardWidth(250);
      } else {
        setBoardWidth(300);
      }
    };

    updateBoardSize();
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, []);

  const isPromotion = (source, target) => {
    const piece = fen.split(' ')[0].split('/')[7 - (parseInt(source[1]) - 1)]?.[source.charCodeAt(0) - 97];
    if (piece === 'P' && target[1] === '8') return true;
    if (piece === 'p' && target[1] === '1') return true;
    return false;
  };

  const onDrop = (source, target) => {
    if (isPromotion(source, target)) {
      setPromotionData({ from: source, to: target });
      return false;
    }

    socket.emit("player:move", { from: source, to: target });
    return true;
  };

  const promote = (piece) => {
    if (promotionData) {
      socket.emit("player:move", {
        from: promotionData.from,
        to: promotionData.to,
        promotion: piece,
      });
      setPromotionData(null);
    }
  };

  const customBoardStyle = {
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden'
  };
  const importPiece = (name) => {
  return `/src/assets/images/${name}.png`;
};

 const customPieces = {
  // wK: () => (
  //   <img src={importPiece("wK")} style={{ width: "100%" }} draggable="true" />
  // ),
  // wQ: () => (
  //   <img src={importPiece("wQ")} style={{ width:  "100%" }} draggable="true" />
  // ),
  // wR: () => (
  //   <img src={importPiece("wR")} style={{ width:  "100%" }} draggable="true" />
  // ),
  // wB: () => (
  //   <img src={importPiece("wB")} style={{ width: "100%"}} draggable="true" />
  // ),
  // wN: () => (
  //   <img src={importPiece("wN")} style={{ width:"100%" }} draggable="true" />
  // ),
  // wP: () => (
  //   <img src={importPiece("wP")} style={{ width: "100%" }} draggable="true" />
  // ),

  bK: () => (
    <img src={importPiece("bK")} style={{ width: "100%" ,height:"100%" }} draggable="true" />
  ),
  bQ: () => (
    <img src={importPiece("bQ")} style={{ width: "100%" ,height:"100%" }} draggable="true" />
  ),
  bR: () => (
    <img src={importPiece("bR")} style={{ width: "100%" , height:"100%" }} draggable="true" />
  ),
  bB: () => (
    <img src={importPiece("bB")} style={{ width: "100%" , height:"100%"}} draggable="true" />
  ),
  bN: () => (
    <img src={importPiece("bN")} style={{ width: "100%" , height:"100%"}} draggable="true" />
  ),
  bP:() => (
    <img src={importPiece("bP")} style={{ width: "100%", height:"100%" }} draggable="true" />
  ),
};


  return (
    <div className="chessboard-wrapper" >
      <Chessboard
        id="HalloweenChess"
        position={fen === "start" ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : fen}
        onPieceDrop={onDrop}
        boardWidth={boardWidth}
        customBoardStyle={customBoardStyle}
        customPieces={customPieces}
        customDarkSquareStyle={{ backgroundColor: '#ff6b35' }}
        customLightSquareStyle={{ backgroundColor: '#2a2a2a' }}
        customSquareStyles={{
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)'
        }}
      />


      <div  style={{display:"flex", flexDirection:"row"}} className="controls">
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
        <span>Status: {isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
      
      <div className="control-buttons">
        <button 
          className="control-btn reset-btn"
          onClick={() => socket.emit("reset")}
        >
          🎮 New Game
        </button>

      </div>
    </div>

      {promotionData && (
        <div className="promotion-overlay">
          <div className="promotion-modal">
            <h4>Promote Pawn</h4>
            <div className="promotion-options">
              <button onClick={() => promote("q")} className="promotion-btn">
                ♕ Queen
              </button>
              <button onClick={() => promote("r")} className="promotion-btn">
                ♖ Rook
              </button>
              <button onClick={() => promote("b")} className="promotion-btn">
                ♗ Bishop
              </button>
              <button onClick={() => promote("n")} className="promotion-btn">
                ♘ Knight
              </button>
            </div>
            <button 
              onClick={() => setPromotionData(null)} 
              className="promotion-cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}