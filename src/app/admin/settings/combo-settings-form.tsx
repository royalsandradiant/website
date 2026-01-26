'use client';

import { useState } from 'react';
import { updateComboSettings } from '@/app/lib/actions';

export default function ComboSettingsForm({ currentPrice }: { currentPrice: number }) {
  const [price, setPrice] = useState(currentPrice.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid price greater than 0.' });
      setIsLoading(false);
      return;
    }

    const result = await updateComboSettings(numericPrice);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Combo price updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update settings.' });
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="comboPrice" className="block text-sm font-medium text-gray-700 mb-2">
          Combo Price (for 3 items)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            id="comboPrice"
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="pl-8 block w-full max-w-xs rounded-md border border-gray-300 py-2 px-4 text-sm outline-2 focus:border-purple-500 focus:ring-purple-500"
            placeholder="100.00"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          This is the total price customers will pay for any 3 combo-eligible items.
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex h-10 items-center rounded-lg bg-purple-600 px-4 text-sm font-medium text-white transition-colors hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
}
