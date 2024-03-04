// React
import React, { useEffect, useState } from 'react';

// Third party packages
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// External assets
import {
  faArrowUpLong,
  faArrowDownLong,
} from '@fortawesome/free-solid-svg-icons';

// Styling
import './EventsTable.scss';

export default function EventsTable(props) {
  // Props
  const { columns, data, sortingHandler, routeHandler, showLoader } = props;

  // States
  const [sorting, setSorting] = useState([{ desc: true, id: 'severity' }]);

  // Sort functions for react-table
  const defaultSortFn = (rowA, rowB, columnId) => {
    const aValue = rowA.original[columnId];
    const bValue = rowB.original[columnId];

    return aValue > bValue ? 1 : -1;
  }

  // Use highway ref as secondary sort
  const routeSortFn = (rowA, rowB, columnId) => {
    return defaultSortFn(rowA, rowB,
      rowA.getValue(columnId) != rowB.getValue(columnId) ? columnId : 'start_point_linear_reference'
    );
  }

  const typeSortFn = (rowA, rowB, columnId) => {
    // Alphabetical primary sort
    if (rowA.getValue(columnId) != rowB.getValue(columnId)) {
      return defaultSortFn(rowA, rowB, columnId);

    // Route secondary sort
    } else {
      return routeSortFn(rowA, rowB, 'route_at');
    }
  }

  const severitySortFn = (rowA, rowB, columnId) => {
    // Reversed due to desc priority logic
    return typeSortFn(rowA, rowB, columnId) * -1;
  }

  // react-table
  const table = useReactTable({
    data: data,
    columns: columns,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        // Large number to show all rows, do NOT use -1 here
        // https://github.com/TanStack/table/issues/3740
        pageSize: 65536,
      },
    },
    onSortingChange: setSorting,
    sortingFns: {
      routeSort: routeSortFn,
      severitySort: severitySortFn,
      typeSort: typeSortFn,
    },
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // UseEffect
  useEffect(() => {
    sortingHandler(sorting);
  }, [sorting]);

  // Handlers
  const toggleSortingHandler = (column) => {
    if (!column.getCanSort()) return;

    const nextOrder = column.getNextSortingOrder();

    // sort by asc when nextOrder is not 'asc' or 'desc', or desc on sortDescFirst columns
    const isDescFirst = column.id == 'severity' || column.id == 'last_updated';
    column.toggleSorting(!nextOrder ? isDescFirst : null);
  }

  const ascIcon = <FontAwesomeIcon icon={faArrowUpLong} alt="ascending order" />;
  const descIcon = <FontAwesomeIcon icon={faArrowDownLong} alt="descending order" />;

  // Rendering
  const getEventTitle = (cell) => {
    const columnId = cell.column.id;
    const eventType = cell.row.original.event_type;
    const severity = cell.row.original.severity;

    if (columnId === "event_type") {
      return eventType.charAt(0) +
        eventType.slice(1).toLowerCase() +
        " - " +
        severity.charAt(0) +
        severity.toLowerCase() +
        " delay";

    } else if (columnId === "map") {
      return "View on map";
    }

    return "";
  }

  const renderLoader = () => {
    const rows = [];
    for (let i = 0; i < 20; i++) {
      rows.push(
        <tr key={`loader-row-${i}`}>
          {table.getAllColumns().map((column, j) => {
            return (
              <td className={`${column.id} loading`} key={`loader-column-${i}-${j}`}>
                <Skeleton />
              </td>
            );
          })}
        </tr>
      );
    }

    return (
      <tbody>
        {rows}
      </tbody>
    );
  }

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <th className={header.id} key={header.id} colSpan={header.colSpan}>
                  {!header.isPlaceholder && !showLoader && (
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
                        header.getContext()
                      )}

                      {{
                        asc: ascIcon,
                        desc: descIcon,
                      }[header.column.getIsSorted()] ?? null}
                    </span>
                  )}

                  {showLoader &&
                    <Skeleton />
                  }
                </th>
              );
            })}
          </tr>
        ))}
      </thead>

      {!showLoader &&
        <tbody>
          {table.getRowModel().rows.map((row) => {
            return (
              <tr className={row.original.severity.toLowerCase()} onClick={() => routeHandler(row.original)} key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td className={cell.column.id}
                      key={cell.id}
                      title={getEventTitle(cell)}>

                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      }

      {showLoader &&
        renderLoader()
      }
    </table>
  );
}
