// Small grid in the top-right corner of page 1 that FlySapa staff fill in by
// hand after printing (amount + payment method per product). Cells are
// intentionally empty.
const PRODUCTS = ['Flight Ticket', 'Combo', '360', 'Drone'];
const ROWS = ['Amount', 'Payment method'];

export default function StaffTable() {
  const cell = 'border border-black px-2 text-center';
  return (
    <table className="ml-auto border-collapse text-xs text-gray-900 whitespace-nowrap">
      <thead>
        <tr>
          <th scope="col" className={`${cell} h-6 font-normal`} />
          {PRODUCTS.map((p) => (
            <th key={p} scope="col" className={`${cell} h-6 min-w-[6rem] font-normal`}>
              {p}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map((r) => (
          <tr key={r}>
            <th scope="row" className={`${cell} h-7 font-normal`}>
              {r}
            </th>
            {PRODUCTS.map((p) => (
              <td key={p} className={`${cell} h-7`} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
