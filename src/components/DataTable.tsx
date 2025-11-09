import { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  actions?: ReactNode;
  footer?: ReactNode;
}

export function DataTable<T>({
  title,
  subtitle,
  columns,
  data,
  emptyMessage = 'No records yet.',
  actions,
  footer
}: DataTableProps<T>) {
  return (
    <section className="section">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h3>{title}</h3>
          {subtitle && <p style={{ marginTop: 6 }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 12 }}>{actions}</div>}
      </header>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '24px' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td key={`${rowIndex}-${column.key}`}>{column.render(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer && <div>{footer}</div>}
    </section>
  );
}
