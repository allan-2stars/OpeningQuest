import PageShell from "../../components/PageShell.tsx";

// ── Static Vite imports — each resolves to a hashed URL at build time ──
import sirKnightMain    from "../../assets/worlds/knight-meadows/characters/sir-knight-main.png";
import castleMain       from "../../assets/worlds/knight-meadows/structures/castle-main.png";
import trainingCampMain from "../../assets/worlds/knight-meadows/structures/training-camp-main.png";
import woodenBridgeMain from "../../assets/worlds/knight-meadows/terrain/wooden-bridge-main.png";
import treeOakA         from "../../assets/worlds/knight-meadows/environment/tree-oak-a.png";
import treePineA        from "../../assets/worlds/knight-meadows/environment/tree-pine-a.png";
import riverbankA       from "../../assets/worlds/knight-meadows/terrain/river-bank-a.png";
import riverbankB       from "../../assets/worlds/knight-meadows/terrain/river-bank-b.png";

type AssetEntry = {
  label: string;
  url: string;
  requestedPath: string;
  resolvedPath: string;
  note?: string;
};

const ASSETS: AssetEntry[] = [
  {
    label: "sir-knight-main.png",
    url: sirKnightMain,
    requestedPath: "characters/sir-knight-main.png",
    resolvedPath: "characters/sir-knight-main.png",
  },
  {
    label: "castle-main.png",
    url: castleMain,
    requestedPath: "structures/castle-main.png",
    resolvedPath: "structures/castle-main.png",
  },
  {
    label: "training-camp-main.png",
    url: trainingCampMain,
    requestedPath: "structures/training-camp-main.png",
    resolvedPath: "structures/training-camp-main.png",
  },
  {
    label: "wooden-bridge-main.png",
    url: woodenBridgeMain,
    requestedPath: "terrain/wooden-bridge-main.png",
    resolvedPath: "terrain/wooden-bridge-main.png",
  },
  {
    label: "tree-oak-a.png",
    url: treeOakA,
    requestedPath: "environment/tree-oak-a.png",
    resolvedPath: "environment/tree-oak-a.png",
  },
  {
    label: "tree-pine-a.png",
    url: treePineA,
    requestedPath: "environment/tree-pine-a.png",
    resolvedPath: "environment/tree-pine-a.png",
  },
  {
    label: "river-bank-a.png",
    url: riverbankA,
    requestedPath: "terrain/river-bank-a.png",
    resolvedPath: "terrain/river-bank-a.png",
  },
  {
    label: "river-bank-b.png",
    url: riverbankB,
    requestedPath: "terrain/river-bank-b.png",
    resolvedPath: "terrain/river-bank-b.png",
  },
];

export default function AssetTest() {
  return (
    <PageShell title="Asset Test — Knight Meadows">
      <p className="text-sm text-text-secondary mb-6">
        Static Vite imports verified. Each card shows the resolved URL Vite assigned.
        A broken image icon means the file was not found at the import path.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {ASSETS.map((asset) => (
          <AssetCard key={asset.label} asset={asset} />
        ))}
      </div>
    </PageShell>
  );
}

function AssetCard({ asset }: { asset: AssetEntry }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-surface p-3 flex flex-col gap-2">
      {/* Image preview */}
      <div className="rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden"
           style={{ height: 160 }}>
        <img
          src={asset.url}
          alt={asset.label}
          className="max-h-full max-w-full object-contain p-2"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = "none";
            const msg = el.nextElementSibling as HTMLElement | null;
            if (msg) msg.style.display = "flex";
          }}
        />
        <div
          className="hidden flex-col items-center justify-center gap-1 text-center p-2"
          aria-hidden="true"
        >
          <span className="text-3xl">❌</span>
          <span className="text-xs text-error font-semibold">Load failed</span>
        </div>
      </div>

      {/* Metadata */}
      <p className="text-xs font-bold text-text-primary truncate" title={asset.label}>
        {asset.label}
      </p>
      <p className="text-[10px] text-text-muted break-all leading-snug">
        <span className="text-text-secondary">Resolved: </span>
        {asset.resolvedPath}
      </p>
      {asset.note && (
        <p className="text-[10px] text-warning leading-snug">
          ⚠ {asset.note}
        </p>
      )}
      <p className="text-[10px] text-text-muted break-all leading-snug">
        <span className="text-text-secondary">Vite URL: </span>
        {asset.url}
      </p>
    </div>
  );
}
