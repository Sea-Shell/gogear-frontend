import { useMemo, useState, type ReactNode } from 'react';

import './AdminTable.css';

/** Helper: type-safe index into a record by string key */
function getVal<T>(obj: T, key: string): unknown {
  return (obj as Record<string, unknown>)[key];
}

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  width?: string;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function AdminTable<T>({
  columns,
  data,
  keyField,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = 'No records.'
}: AdminTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const hasActions = Boolean(onEdit ?? onDelete);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    if (sortKey === column.key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column.key);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = getVal(a, sortKey);
      const bVal = getVal(b, sortKey);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const renderCell = (item: T, column: Column<T>): ReactNode => {
    if (column.render) return column.render(item);
    const val = getVal(item, column.key);
    return (val != null ? String(val) : '—') as ReactNode;
  };

  if (loading) {
    return (
      <div className="admin-table">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </th>
              ))}
              {hasActions && <th className="admin-table-actions-head" />}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key}>
                    <span className="admin-table-skeleton" />
                  </td>
                ))}
                {hasActions && <td />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="admin-table">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </th>
              ))}
              {hasActions && <th className="admin-table-actions-head" />}
            </tr>
          </thead>
          <tbody />
        </table>
        <div className="admin-table-empty">{emptyMessage}</div>
      </div>
    );
  }

  const sortIndicator = (key: string): string => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="admin-table">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.sortable ? 'admin-th-sortable' : ''}
                style={col.width ? { width: col.width } : undefined}
                onClick={() => handleSort(col)}
              >
                {col.label}
                {col.sortable && <span className="admin-sort-indicator">{sortIndicator(col.key)}</span>}
              </th>
            ))}
            {hasActions && <th className="admin-table-actions-head">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => {
            const val = getVal(item, keyField);
            const key = val != null ? String(val) : undefined;
            return (
              <tr key={key ?? Math.random()}>
                {columns.map((col) => (
                  <td key={col.key}>{renderCell(item, col)}</td>
                ))}
            {hasActions && (
              <td className="admin-table-actions">
                {onEdit && (
                  <button className="admin-table-action-btn edit" type="button" onClick={() => onEdit(item)} title="Edit" aria-label="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button className="admin-table-action-btn delete" type="button" onClick={() => onDelete(item)} title="Delete" aria-label="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                )}
              </td>
            )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
