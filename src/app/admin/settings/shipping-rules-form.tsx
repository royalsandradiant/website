'use client';

import { useMemo, useState } from 'react';
import { createShippingRule, deleteShippingRule } from '@/app/lib/actions';
import type { ShippingCategory, ShippingRule } from '@/app/lib/definitions';

export default function ShippingRulesForm({ rules }: { rules: ShippingRule[] }) {
  const [localRules, setLocalRules] = useState<ShippingRule[]>(rules);
  const [category, setCategory] = useState<ShippingCategory>('jewelry');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sortedRules = useMemo(
    () =>
      [...localRules].sort((a, b) =>
        a.category === b.category
          ? a.minAmount - b.minAmount
          : a.category.localeCompare(b.category),
      ),
    [localRules],
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const parsedMin = parseFloat(minAmount);
    const parsedPrice = parseFloat(price);
    const parsedMax = maxAmount ? parseFloat(maxAmount) : null;

    const result = await createShippingRule(category, parsedMin, parsedPrice, parsedMax);
    if (!result.success) {
      setError(result.error || 'Failed to add rule.');
      setIsLoading(false);
      return;
    }

    if (result.rule) {
      setLocalRules((prev) => [...prev, result.rule]);
    }

    setMinAmount('');
    setMaxAmount('');
    setPrice('');
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this rule?')) {
      setError('');
      setLocalRules((prev) => prev.filter((rule) => rule.id !== id));
      const result = await deleteShippingRule(id);
      if (!result.success) {
        setError(result.error || 'Failed to delete rule.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-amber-100 bg-amber-50/60 p-3 text-xs text-amber-900">
        If the cart contains both clothes and jewelry items, checkout automatically applies
        <strong> clothes shipping rules</strong>.
      </div>

      {/* Existing Rules Table */}
      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white text-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Order Range</th>
              <th className="px-4 py-2">Shipping Cost</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedRules.map((rule) => (
              <tr key={rule.id}>
                <td className="px-4 py-2">
                  <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
                    {rule.category}
                  </span>
                </td>
                <td className="px-4 py-2 font-medium">
                  ${rule.minAmount.toString()} {rule.maxAmount ? `- $${rule.maxAmount.toString()}` : '+'}
                </td>
                <td className="px-4 py-2">
                  {Number(rule.price) === 0 ? <span className="text-green-600 font-bold">FREE</span> : `$${rule.price.toString()}`}
                </td>
                <td className="px-4 py-2">
                  <button type="button" onClick={() => handleDelete(rule.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {sortedRules.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-gray-400 italic">No custom rules configured yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Rule Form */}
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-white p-4 rounded-md border border-gray-100 shadow-sm">
        <div>
          <label htmlFor="shipping-rule-category" className="block text-xs font-medium text-gray-500 uppercase mb-1">Category</label>
          <select
            id="shipping-rule-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ShippingCategory)}
            className="w-full rounded border border-gray-300 p-2 bg-white"
          >
            <option value="jewelry">Jewelry</option>
            <option value="clothes">Clothes</option>
          </select>
        </div>
        <div>
          <label htmlFor="shipping-rule-min" className="block text-xs font-medium text-gray-500 uppercase mb-1">Min Order ($)</label>
          <input id="shipping-rule-min" type="number" min="0" step="0.01" required value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="w-full rounded border border-gray-300 p-2" placeholder="0" />
        </div>
        <div>
          <label htmlFor="shipping-rule-max" className="block text-xs font-medium text-gray-500 uppercase mb-1">Max Order ($)</label>
          <input id="shipping-rule-max" type="number" min="0" step="0.01" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="w-full rounded border border-gray-300 p-2" placeholder="99 (Optional)" />
        </div>
        <div>
          <label htmlFor="shipping-rule-price" className="block text-xs font-medium text-gray-500 uppercase mb-1">Shipping Price ($)</label>
          <input id="shipping-rule-price" type="number" min="0" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded border border-gray-300 p-2" placeholder="10 (0 for Free)" />
        </div>
        <button type="submit" disabled={isLoading} className="bg-green-600 text-white rounded p-2 text-sm font-bold hover:bg-green-700 disabled:opacity-50">
          Add Rule
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
