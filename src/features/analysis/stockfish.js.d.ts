declare module "stockfish.js" {
  interface StockfishEngine {
    postMessage: (command: string) => void;
    onmessage: ((event: { data?: string } | string) => void) | null;
  }

  function Stockfish(): StockfishEngine;
  export default Stockfish;
}
