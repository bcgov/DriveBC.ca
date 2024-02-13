// React
import React, {useEffect, useState} from 'react';

// Third party packages
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';

// External assets
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpLong,
  faArrowDownLong,
} from '@fortawesome/free-solid-svg-icons';

// Styling
import './EventsTable.scss';

export default function EventsTable({columns, data, sortingHandler, routeHandler}) {
  const [sorting, setSorting] = useState([{ desc: false, id: 'severity' }]);

  const prioritySortFn = (rowA, rowB, columnId) => {
    const aValue = rowA.getValue(columnId).value;
    const bValue = rowA.getValue(columnId).value;

    if (aValue != bValue) {
      return aValue < bValue ? 1 : -1;

    // Equal value, order by priority
    } else {
      const aPriority = rowA.original.priority;
      const bPriority = rowB.original.priority;

      return aPriority < bPriority ? 1 : -1;
    }
  }

  const table = useReactTable({
    data: data,
    columns: columns,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: -1,
      },
    },
    onSortingChange: setSorting,
    sortingFns: {
      prioritySort: prioritySortFn,
    },
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    sortingHandler(sorting);
  }, [sorting]);

  const toggleSortingHandler = (column) => {
    const nextOrder = column.getNextSortingOrder();
    column.toggleSorting(!nextOrder ? nextOrder : null);
  }

  const ascIcon = <FontAwesomeIcon icon={faArrowUpLong} alt="ascending order" />;
  const descIcon = <FontAwesomeIcon icon={faArrowDownLong} alt="descending order" />;

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <th className={header.id} key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder ? null : (
                    <span
                      {...{
                        className: header.column.getCanSort() ?
                          'cursor-pointer select-none' :
                          '',
                        onClick: () => toggleSortingHandler(header.column),
                      }}
                    >
                      {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                      )}
                      {{
                        asc: ascIcon,
                        desc: descIcon,
                      }[header.column.getIsSorted()] ?? null}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => {
          return (
            <tr className={row.original.severity.toLowerCase()} onClick={() => routeHandler(row.original)} key={row.id}>
              {row.getVisibleCells().map((cell) => {
                return <td
                className={cell.column.id}
                key={cell.id}
                title={
                  cell.column.id === "event_type"
                    ? cell.row.original.event_type.charAt(0) + cell.row.original.event_type.slice(1).toLowerCase() + " - "
                    + cell.row.original.severity.charAt(0) + cell.row.original.severity.slice(1).toLowerCase() + " delay"
                    : cell.column.id === "map"
                    ? "View on map"
                    : ""
                }
                >
                  {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                  )}
                </td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
