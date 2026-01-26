'use client';

import { useState } from 'react';
import { updateComboSettings } from '@/app/lib/actions';

export default function ComboSettingsForm({ currentDiscount2, currentDiscount3 }: { currentDiscount2: number, currentDiscount3: number }) {
  const [discount2, setDiscount2] = useState(currentDiscount2.toString());
  const [discount3, setDiscount3] = useState(currentDiscount3.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const numericDiscount2 = parseInt(discount2);
    const numericDiscount3 = parseInt(discount3);

    if (isNaN(numericDiscount2) || numericDiscount2 < 0 || numericDiscount2 > 100 || 
        isNaN(numericDiscount3) || numericDiscount3 < 0 || numericDiscount3 > 100) {
      setMessage({ type: 'error', text: 'Please enter valid percentage discounts (0-100).' });
      setIsLoading(false);
      return;
    }

    const result = await updateComboSettings(numericDiscount2, numericDiscount3);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Combo discounts updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update settings.' });
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="comboDiscount2" className="block text-sm font-medium text-gray-700 mb-2">
            2-Item Combo Discount (%)
          </label>
          <div className="relative">
            <input
              id="comboDiscount2"
              type="number"
              min="0"
              max="100"
              value={discount2}
              onChange={(e) => setDiscount2(e.target.value)}
              className="block w-full rounded-md border border-gray-300 py-2 px-4 text-sm outline-2 focus:border-primary focus:ring-primary"
              placeholder="10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Percentage off when buying any 2 combo-eligible items.
          </p>
        </div>

        <div>
          <label htmlFor="comboDiscount3" className="block text-sm font-medium text-gray-700 mb-2">
            3-Item Combo Discount (%)
          </label>
          <div className="relative">
            <input
              id="comboDiscount3"
              type="number"
              min="0"
              max="100"
              value={discount3}
              onChange={(e) => setDiscount3(e.target.value)}
              className="block w-full rounded-md border border-gray-300 py-2 px-4 text-sm outline-2 focus:border-primary focus:ring-primary"
              placeholder="15"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Percentage off when buying any 3 combo-eligible items.
          </p>
        </div>
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
        className="flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
}
