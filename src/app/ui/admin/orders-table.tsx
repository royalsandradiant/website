"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useMemo, useState } from "react";
import { markOrderShipped } from "@/app/lib/actions";
import { cn } from "@/app/lib/utils";

export type AdminOrderRow = {
  id: string;
  customerName: string;
  customerEmail: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string;
  country: string;
  status: "PENDING" | "SHIPPED" | "DELIVERED";
  trackingNumber: string | null;
  totalAmount: number;
  createdAt: string;
};

function getStatusBadgeClass(status: AdminOrderRow["status"]) {
  if (status === "SHIPPED") {
    return "bg-blue-100 text-blue-700";
  }
  if (status === "DELIVERED") {
    return "bg-green-100 text-green-700";
  }
  return "bg-yellow-100 text-yellow-700";
}

export default function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const [localOrders, setLocalOrders] = useState(orders);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOrder = useMemo(
    () => localOrders.find((order) => order.id === selectedOrderId) || null,
    [localOrders, selectedOrderId],
  );

  function openShipModal(order: AdminOrderRow) {
    setSelectedOrderId(order.id);
    setTrackingNumber(order.trackingNumber || "");
    setError("");
  }

  function closeShipModal() {
    setSelectedOrderId(null);
    setTrackingNumber("");
    setError("");
  }

  async function handleMarkAsShipped(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrder) {
      return;
    }

    const trimmedTracking = trackingNumber.trim();
    if (!trimmedTracking) {
      setError("Tracking number is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setWarning("");

    const result = await markOrderShipped(selectedOrder.id, trimmedTracking);

    if (!result.success) {
      setError(result.error || "Failed to mark order as shipped.");
      setIsSubmitting(false);
      return;
    }

    setLocalOrders((prev) =>
      prev.map((order) =>
        order.id === selectedOrder.id
          ? {
              ...order,
              status: "SHIPPED",
              trackingNumber: trimmedTracking,
            }
          : order,
      ),
    );

    if (result.warning) {
      setWarning(result.warning);
    }

    setIsSubmitting(false);
    closeShipModal();
  }

  if (localOrders.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
        No orders yet.
      </div>
    );
  }

  return (
    <>
      <div className="flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
            {warning ? (
              <div className="m-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {warning}
              </div>
            ) : null}

            <table className="min-w-full text-gray-900">
              <thead className="rounded-lg text-left text-sm font-normal">
                <tr>
                  <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                    Order ID
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Customer
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Shipping Address
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Tracking
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Total
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {localOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="w-full border-b py-3 text-sm last-of-type:border-none"
                  >
                    <td className="whitespace-nowrap py-3 pl-6 pr-3 font-mono text-xs">
                      {order.id.slice(-8)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div>{order.customerName}</div>
                      <div className="text-xs text-gray-500">
                        {order.customerEmail}
                      </div>
                    </td>
                    <td className="px-3 py-3 max-w-xs truncate">
                      {order.addressLine1}, {order.city}, {order.postalCode},{" "}
                      {order.country}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs",
                          getStatusBadgeClass(order.status),
                        )}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">
                      {order.trackingNumber || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {order.status === "PENDING" ? (
                        <button
                          type="button"
                          onClick={() => openShipModal(order)}
                          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90"
                        >
                          Mark as Shipped
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AlertDialog.Root
        open={selectedOrder !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeShipModal();
          }
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl">
            <AlertDialog.Title className="text-lg font-semibold">
              Mark as Shipped
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600">
              Enter a tracking number for order{" "}
              {selectedOrder ? selectedOrder.id.slice(-8) : ""}.
            </AlertDialog.Description>

            <form className="mt-5 space-y-4" onSubmit={handleMarkAsShipped}>
              <div>
                <label
                  htmlFor="trackingNumber"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Tracking Number
                </label>
                <input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
                {error ? (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="flex justify-end gap-3">
                <AlertDialog.Cancel asChild>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    className="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </AlertDialog.Cancel>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Mark as Shipped"}
                </button>
              </div>
            </form>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
