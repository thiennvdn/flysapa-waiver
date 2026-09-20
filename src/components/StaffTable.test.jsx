import { render, screen, within } from '@testing-library/react';
import StaffTable from './StaffTable';

test('renders the staff-only pricing grid with 4 product columns and 2 blank rows', () => {
  render(<StaffTable />);
  const table = screen.getByRole('table');
  const headers = within(table).getAllByRole('columnheader').map((th) => th.textContent);
  expect(headers).toEqual(['', 'Flight Ticket', 'Combo', '360', 'Drone']);

  const rowHeaders = within(table).getAllByRole('rowheader').map((th) => th.textContent);
  expect(rowHeaders).toEqual(['Amount', 'Payment method']);

  // 2 rows x 4 product cells, all empty for hand-filling after printing
  const cells = within(table).getAllByRole('cell');
  expect(cells).toHaveLength(8);
  cells.forEach((td) => expect(td.textContent).toBe(''));
});
