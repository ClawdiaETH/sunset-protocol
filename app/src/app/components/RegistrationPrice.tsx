'use client';

export function RegistrationPrice({ className = '' }: { className?: string }) {
  // Current market price for 25M CLAWDIA (updated 2026-02-02)
  const currentPrice = '0.013';
  
  return (
    <span className={className}>
      (~{currentPrice} ETH)
      <span className="text-xs text-zinc-400 ml-2">
        Current market
      </span>
    </span>
  );
}