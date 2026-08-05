export function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-status/30 bg-status/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-status">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status opacity-75 motion-reduce:animate-none" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status" />
      </span>
      {label}
    </span>
  );
}
