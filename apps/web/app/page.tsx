import Link from 'next/link';
export default function HomePage() {
  return (
    <div className="space-y-12">
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-5xl font-bold tracking-tight text-cosmos-text">Coordinate-Based<br/><span className="text-cosmos-accent">Data Atomization</span></h1>
        <p className="text-cosmos-dim max-w-xl mx-auto">Original data split into elements, randomly assigned to coordinates, stored across two separate locations. Neither side alone can reconstruct the original.</p>
      </div>
      <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-6">
        <h2 className="text-xs font-mono text-cosmos-dim uppercase tracking-widest mb-4">Patent Architecture — US 12,411,980 B2</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="bg-cosmos-bg border border-cosmos-border rounded-lg p-4">
            <div className="text-xs font-mono text-cosmos-dim">INPUT</div>
            <div className="text-sm font-mono text-cosmos-text mt-1">Original Data</div>
            <div className="text-[10px] font-mono text-cosmos-warn mt-2">→ Deleted after processing</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-2 border-cosmos-accent glow-blue mx-auto flex items-center justify-center text-cosmos-accent text-xl">⚛</div>
            <div className="text-xs font-mono text-cosmos-dim mt-2">Split → Scramble → Separate</div>
          </div>
          <div className="space-y-3">
            <div className="bg-cosmos-bg border border-blue-900/50 rounded-lg p-3 glow-blue">
              <div className="text-[10px] font-mono text-cosmos-accent">SERVER (Upstash Redis)</div>
              <div className="text-xs text-cosmos-dim mt-1">Fragments · No order info</div>
            </div>
            <div className="bg-cosmos-bg border border-purple-900/50 rounded-lg p-3">
              <div className="text-[10px] font-mono text-cosmos-purple">USER DEVICE (IndexedDB)</div>
              <div className="text-xs text-cosmos-dim mt-1">Coordinate Map · No content</div>
            </div>
          </div>
        </div>
        <div className="border-t border-cosmos-border pt-4 mt-4 text-center text-xs font-mono text-cosmos-dim">
          Reconstruction requires <span className="text-cosmos-success font-bold">BOTH</span> sources + passphrase
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/protect" className="group bg-cosmos-surface border border-cosmos-border hover:border-cosmos-accent rounded-xl p-6 transition-all space-y-3">
          <div className="text-2xl">🔒</div>
          <div className="font-semibold text-cosmos-text group-hover:text-cosmos-accent transition-colors">Protect Data</div>
          <div className="text-xs text-cosmos-dim">Atomize & store fragments on server, coordinate map on device</div>
        </Link>
        <Link href="/breach-simulation" className="group bg-cosmos-surface border border-cosmos-border hover:border-red-500/50 rounded-xl p-6 transition-all space-y-3">
          <div className="text-2xl">⚠️</div>
          <div className="font-semibold text-cosmos-text group-hover:text-cosmos-danger transition-colors">Breach Simulation</div>
          <div className="text-xs text-cosmos-dim">Prove server fragments alone cannot reconstruct original data</div>
        </Link>
        <Link href="/vault" className="group bg-cosmos-surface border border-cosmos-border hover:border-purple-500/50 rounded-xl p-6 transition-all space-y-3">
          <div className="text-2xl">🗄️</div>
          <div className="font-semibold text-cosmos-text group-hover:text-cosmos-purple transition-colors">Vault Manager</div>
          <div className="text-xs text-cosmos-dim">Export, import, backup coordinate maps</div>
        </Link>
      </div>
    </div>
  );
}
