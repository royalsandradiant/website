'use client';

import { useState } from 'react';
import { createShippingRule, deleteShippingRule } from '@/app/lib/actions';
import type { ShippingRule } from '@/app/lib/definitions';

export default function ShippingRulesForm({ rules }: { rules: ShippingRule[] }) {
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await createShippingRule(
      parseFloat(minAmount),
      parseFloat(price),
      maxAmount ? parseFloat(maxAmount) : null
    );
    setMinAmount('');
    setMaxAmount('');
    setPrice('');
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this rule?')) {
      await deleteShippingRule(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Rules Table */}
      <div className="overflow-hidden rounded-md border border-gray-200 bg-white text-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-4 py-2">Order Range</th>
              <th className="px-4 py-2">Shipping Cost</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td className="px-4 py-2 font-medium">
                  ${rule.minAmount.toString()} {rule.maxAmount ? `- $${rule.maxAmount.toString()}` : '+'}
                </td>
                <td className="px-4 py-2">
                  {Number(rule.price) === 0 ? <span className="text-green-600 font-bold">FREE</span> : `$${rule.price.toString()}`}
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => handleDelete(rule.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-4 text-center text-gray-400 italic">No custom rules. Default flat rate applies.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Rule Form */}
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-white p-4 rounded-md border border-gray-100 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Min Order ($)</label>
          <input type="number" required value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="w-full rounded border border-gray-300 p-2" placeholder="0" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Max Order ($)</label>
          <input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="w-full rounded border border-gray-300 p-2" placeholder="99 (Optional)" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Shipping Price ($)</label>
          <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded border border-gray-300 p-2" placeholder="10 (0 for Free)" />
        </div>
        <button type="submit" disabled={isLoading} className="bg-green-600 text-white rounded p-2 text-sm font-bold hover:bg-green-700 disabled:opacity-50">
          Add Rule
        </button>
      </form>
    </div>
  );
}
