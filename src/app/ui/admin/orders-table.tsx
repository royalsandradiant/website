"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useMemo, useState } from "react";
import { markOrderShipped, updateTrackingNumber } from "@/app/lib/actions";
import { buildTrackingLink } from "@/app/lib/shipping-tracking";
import { cn } from "@/app/lib/utils";

export type OrderItemRow = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
};

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
  carrier: string | null;
  totalAmount: number;
  createdAt: string;
  items: OrderItemRow[];
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
  const [modalMode, setModalMode] = useState<"ship" | "edit">("ship");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const selectedOrder = useMemo(
    () => localOrders.find((order) => order.id === selectedOrderId) || null,
    [localOrders, selectedOrderId],
  );

  function toggleExpandOrder(orderId: string) {
    setExpandedOrderId((current) => (current === orderId ? null : orderId));
  }

  function openShipModal(order: AdminOrderRow) {
    setSelectedOrderId(order.id);
    setModalMode("ship");
    setTrackingNumber(order.trackingNumber || "");
    setError("");
  }

  function openEditTrackingModal(order: AdminOrderRow) {
    setSelectedOrderId(order.id);
    setModalMode("edit");
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

    // Recompute carrier from new tracking number
    const { carrierLabel: newCarrier } = buildTrackingLink(trimmedTracking);

    setLocalOrders((prev) =>
      prev.map((order) =>
        order.id === selectedOrder.id
          ? {
              ...order,
              status: "SHIPPED",
              trackingNumber: trimmedTracking,
              carrier: newCarrier,
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

  async function handleUpdateTracking(event: React.FormEvent<HTMLFormElement>) {
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

    const result = await updateTrackingNumber(selectedOrder.id, trimmedTracking);

    if (!result.success) {
      setError(result.error || "Failed to update tracking number.");
      setIsSubmitting(false);
      return;
    }

    // Recompute carrier from new tracking number
    const { carrierLabel: newCarrier } = buildTrackingLink(trimmedTracking);

    setLocalOrders((prev) =>
      prev.map((order) =>
        order.id === selectedOrder.id
          ? {
              ...order,
              trackingNumber: trimmedTracking,
              carrier: newCarrier,
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
                  <th scope="col" className="px-2 py-5 font-medium">
                    {/* Expand */}
                  </th>
                  <th scope="col" className="px-3 py-5 font-medium sm:pl-3">
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
                    Carrier
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
                  <>
                    <tr
                      key={order.id}
                      className="w-full border-b py-3 text-sm last-of-type:border-none"
                    >
                      <td className="whitespace-nowrap py-3 pl-4 pr-2">
                        <button
                          type="button"
                          onClick={() => toggleExpandOrder(order.id)}
                          className="rounded p-1 hover:bg-gray-100"
                          aria-label={
                            expandedOrderId === order.id
                              ? "Collapse order details"
                              : "Expand order details"
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={cn(
                              "transition-transform",
                              expandedOrderId === order.id && "rotate-180",
                            )}
                            aria-hidden="true"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </td>
                      <td className="whitespace-nowrap py-3 pl-3 pr-3 font-mono text-xs">
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
                      <td className="whitespace-nowrap px-3 py-3">
                        {order.carrier ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                            {order.carrier}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
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
                        ) : order.status === "SHIPPED" ? (
                          <button
                            type="button"
                            onClick={() => openEditTrackingModal(order)}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Edit Tracking
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                    {expandedOrderId === order.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <h4 className="mb-3 text-sm font-semibold text-gray-900">
                              Order Items ({order.items.length})
                            </h4>
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="py-2 pr-4 text-left font-medium text-gray-600">
                                    Product
                                  </th>
                                  <th className="py-2 pr-4 text-center font-medium text-gray-600">
                                    Qty
                                  </th>
                                  <th className="py-2 pr-4 text-left font-medium text-gray-600">
                                    Size
                                  </th>
                                  <th className="py-2 pr-4 text-left font-medium text-gray-600">
                                    Color
                                  </th>
                                  <th className="py-2 text-right font-medium text-gray-600">
                                    Price
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item) => (
                                  <tr
                                    key={item.id}
                                    className="border-b border-gray-100 last:border-0"
                                  >
                                    <td className="py-2 pr-4">
                                      <div className="font-medium text-gray-900">
                                        {item.productName}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        ID: {item.productId.slice(-8)}
                                      </div>
                                    </td>
                                    <td className="py-2 pr-4 text-center">
                                      {item.quantity}
                                    </td>
                                    <td className="py-2 pr-4 text-gray-600">
                                      {item.size || "—"}
                                    </td>
                                    <td className="py-2 pr-4 text-gray-600">
                                      {item.color || "—"}
                                    </td>
                                    <td className="py-2 text-right tabular-nums">
                                      ${(item.price * item.quantity).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t border-gray-200">
                                  <td
                                    colSpan={4}
                                    className="py-2 pr-4 text-right font-semibold"
                                  >
                                    Total:
                                  </td>
                                  <td className="py-2 text-right font-semibold tabular-nums">
                                    ${order.totalAmount.toFixed(2)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
              {modalMode === "ship" ? "Mark as Shipped" : "Edit Tracking Number"}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600">
              {modalMode === "ship"
                ? "Enter a tracking number for order"
                : "Update the tracking number for order"}{" "}
              {selectedOrder ? selectedOrder.id.slice(-8) : ""}.
            </AlertDialog.Description>

            <form
              className="mt-5 space-y-4"
              onSubmit={modalMode === "ship" ? handleMarkAsShipped : handleUpdateTracking}
            >
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
                  className={cn(
                    "rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50",
                    modalMode === "ship"
                      ? "bg-foreground hover:bg-foreground/90"
                      : "bg-blue-600 hover:bg-blue-700",
                  )}
                >
                  {isSubmitting
                    ? "Saving..."
                    : modalMode === "ship"
                      ? "Mark as Shipped"
                      : "Update Tracking"}
                </button>
              </div>
            </form>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
