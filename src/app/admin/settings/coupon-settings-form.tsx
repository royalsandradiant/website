'use client';

import { useState } from 'react';
import { createCoupon, deleteCoupon } from '@/app/lib/actions';
import { Coupon } from '@/app/lib/definitions';
import { Trash2, Plus, Loader2 } from 'lucide-react';

export default function CouponSettingsForm({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: '',
    minOrderAmount: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('code', newCoupon.code);
    formData.append('discountType', newCoupon.discountType);
    formData.append('discountValue', newCoupon.discountValue);
    formData.append('minOrderAmount', newCoupon.minOrderAmount);

    const result = await createCoupon(formData);
    if (result.success && result.coupon) {
      setCoupons([result.coupon, ...coupons]);
      setNewCoupon({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minOrderAmount: '',
      });
    } else {
      alert(result.error || 'Failed to create coupon');
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    setIsDeleting(id);
    const result = await deleteCoupon(id);
    if (result.success) {
      setCoupons(coupons.filter(c => c.id !== id));
    } else {
      alert(result.error || 'Failed to delete coupon');
    }
    setIsDeleting(null);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-white p-4 rounded-lg border border-border shadow-sm">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Code</label>
          <input
            type="text"
            value={newCoupon.code}
            onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
            placeholder="SAVE20"
            className="w-full px-3 py-2 bg-secondary/30 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Type</label>
          <select
            value={newCoupon.discountType}
            onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
            className="w-full px-3 py-2 bg-secondary/30 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Fixed Amount ($)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Value</label>
          <input
            type="number"
            value={newCoupon.discountValue}
            onChange={e => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
            placeholder="20"
            className="w-full px-3 py-2 bg-secondary/30 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Min Order ($)</label>
            <input
              type="number"
              value={newCoupon.minOrderAmount}
              onChange={e => setNewCoupon({ ...newCoupon, minOrderAmount: e.target.value })}
              placeholder="0"
              className="w-full px-3 py-2 bg-secondary/30 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[44px]"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/50 text-foreground/70 uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Min Order</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-foreground/50 italic">
                  No coupons created yet.
                </td>
              </tr>
            ) : (
              coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold">{coupon.code}</td>
                  <td className="px-4 py-3">
                    {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                  </td>
                  <td className="px-4 py-3">
                    {coupon.minOrderAmount ? `$${coupon.minOrderAmount}` : 'None'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      disabled={isDeleting === coupon.id}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 p-1"
                    >
                      {isDeleting === coupon.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
