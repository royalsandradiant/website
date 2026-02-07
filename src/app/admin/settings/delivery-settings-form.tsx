'use client';

import { useState } from 'react';
import { updateStoreSettings } from '@/app/lib/actions';

export default function DeliverySettingsForm({ minDays, maxDays }: { minDays: number, maxDays: number }) {
  const [min, setMin] = useState(minDays.toString());
  const [max, setMax] = useState(maxDays.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const result = await updateStoreSettings({
      estimatedDeliveryMin: parseInt(min),
      estimatedDeliveryMax: parseInt(max),
    });
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Delivery settings updated!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Update failed.' });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Min Days</label>
          <input
            type="number"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 text-sm"
          />
        </div>
        <span className="mt-6 text-gray-400">to</span>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Max Days</label>
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 text-sm"
          />
        </div>
      </div>
      
      {message && (
        <div className={`p-2 rounded text-xs ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : 'Update Timeline'}
      </button>
    </form>
  );
}
