/** SVG-based tinted chess pieces for customPieces prop on react-chessboard. */

export type PieceTintRenderer = (args: {
  squareWidth: number;
  isDragging?: boolean;
}) => React.ReactElement;

const PIECE_UNICODE: Record<string, string> = {
  wP: "♙", wN: "♘", wB: "♗", wR: "♖", wQ: "♕", wK: "♔",
  bP: "♟", bN: "♞", bB: "♝", bR: "♜", bQ: "♛", bK: "♚",
};

function makePieceRenderer(
  pieceChar: string,
  tint: string,
  squareWidth: number,
): React.ReactElement {
  // Scale font size proportionally to square width
  const fontSize = Math.round(squareWidth * 0.78);
  const isLight = pieceChar.charCodeAt(0) >= 9812 && pieceChar.charCodeAt(0) <= 9817;

  return (
    <div
      style={{
        width: squareWidth,
        height: squareWidth,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        userSelect: "none",
        color: isLight ? tint : "#1a202c",
        textShadow: isLight
          ? `0 1px 3px ${tint}80`
          : "0 1px 2px rgba(0,0,0,0.4)",
        filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))",
      }}
    >
      {pieceChar}
    </div>
  );
}

export function buildCustomPieces(
  tint: string,
): Record<string, (args: { squareWidth: number; isDragging?: boolean }) => React.ReactElement> {
  const pieces: Record<string, (args: { squareWidth: number; isDragging?: boolean }) => React.ReactElement> = {};

  for (const [key, char] of Object.entries(PIECE_UNICODE)) {
    pieces[key] = ({ squareWidth }: { squareWidth: number; isDragging?: boolean }) =>
      makePieceRenderer(char, tint, squareWidth);
  }

  return pieces;
}
