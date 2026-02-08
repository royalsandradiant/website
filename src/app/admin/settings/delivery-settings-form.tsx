'use client';

import { useState } from 'react';
import { updateStoreSettings } from '@/app/lib/actions';

export default function DeliverySettingsForm({ minDays, maxDays, allowPickup, pickupAddr }: { minDays: number, maxDays: number, allowPickup: boolean, pickupAddr: string | null }) {
  const [min, setMin] = useState(minDays.toString());
  const [max, setMax] = useState(maxDays.toString());
  const [allowStorePickup, setAllowStorePickup] = useState(allowPickup);
  const [pickupAddress, setPickupAddress] = useState(pickupAddr || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const result = await updateStoreSettings({
      estimatedDeliveryMin: parseInt(min),
      estimatedDeliveryMax: parseInt(max),
      allowStorePickup,
      pickupAddress: allowStorePickup ? pickupAddress : null,
    });
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Settings updated!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Update failed.' });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Delivery Timeline</h3>
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
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Store Pickup</h3>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allowStorePickup"
            checked={allowStorePickup}
            onChange={(e) => setAllowStorePickup(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="allowStorePickup" className="text-sm font-medium text-gray-700">
            Allow Store Pickup
          </label>
        </div>
        
        {allowStorePickup && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Pickup Address</label>
            <textarea
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="Enter the full address for store pickup..."
              className="w-full rounded-md border border-gray-300 p-2 text-sm h-24"
              required={allowStorePickup}
            />
          </div>
        )}
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
        {isLoading ? 'Saving...' : 'Update Settings'}
      </button>
    </form>
  );
}
