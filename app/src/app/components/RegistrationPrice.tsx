'use client';

import { useEffect, useState } from 'react';

interface PriceData {
  estimatedEthNeeded: string;
  burnAmountFormatted: string;
  v2Deployed: boolean;
  error?: string;
}

export function RegistrationPrice({ className = '' }: { className?: string }) {
  const [price, setPrice] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const response = await fetch('/api/burns/estimate');
        const data = await response.json();
        setPrice(data);
      } catch (error) {
        console.error('Failed to fetch registration price:', error);
        setPrice({
          estimatedEthNeeded: '0.1',
          burnAmountFormatted: '25,000,000 CLAWDIA',
          v2Deployed: false,
          error: 'Failed to load price',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchPrice();

    // Refresh price every 30 seconds
    const interval = setInterval(fetchPrice, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <span className={`text-zinc-500 ${className}`}>
        Loading price...
      </span>
    );
  }

  if (!price) {
    return (
      <span className={`text-zinc-500 ${className}`}>
        Price unavailable
      </span>
    );
  }

  return (
    <span className={className}>
      (~{parseFloat(price.estimatedEthNeeded).toFixed(3)} ETH)
      {price.error && (
        <span className="text-xs text-orange-400 ml-2">
          {price.v2Deployed ? 'Live pricing' : 'Estimated'}
        </span>
      )}
    </span>
  );
}