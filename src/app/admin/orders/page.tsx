import { fetchOrders } from '@/app/lib/data';

export default async function OrdersPage() {
  const orders = await fetchOrders();

  return (
    <div className="w-full">
      <h1 className="mb-8 text-2xl font-bold">Orders</h1>
      <div className="flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
            <table className="min-w-full text-gray-900">
              <thead className="rounded-lg text-left text-sm font-normal">
                <tr>
                  <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Order ID</th>
                  <th scope="col" className="px-3 py-5 font-medium">Customer</th>
                   <th scope="col" className="px-3 py-5 font-medium">Shipping Address</th>
                  <th scope="col" className="px-3 py-5 font-medium">Status</th>
                  <th scope="col" className="px-3 py-5 font-medium">Total</th>
                  <th scope="col" className="px-3 py-5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {orders?.map((order) => (
                  <tr key={order.id} className="w-full border-b py-3 text-sm last-of-type:border-none">
                    <td className="whitespace-nowrap py-3 pl-6 pr-3 font-mono text-xs">
                      {order.id.slice(-8)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div>{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.customerEmail}</div>
                    </td>
                    <td className="px-3 py-3 max-w-xs truncate">
                        {order.addressLine1}, {order.city}, {order.postalCode}, {order.country}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      ${Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
