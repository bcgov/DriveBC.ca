// React
import React, { useEffect, useState } from 'react';

// External Imports
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

// Internal imports
import EventTypeIcon from '../EventTypeIcon';
import FriendlyTime from '../FriendlyTime';

// External assets
import {
  faArrowUpLong,
  faArrowDownLong,
} from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button';

// Styling
import './EventsTable.scss';

export default function EventsTable(props) {
  // Props
  const { data, routeHandler, showLoader, sortingKey } = props;

  // States
  const [sorting, setSorting] = useState([{ desc: true, id: 'severity' }]);

  // react-table columns
  const getEventTypeCell = (data) => {
    const getTypeDisplay = () => {
      const severityText = data.severity == 'MAJOR' ? 'Major' : 'Minor';

      switch (data.display_category) {
        case 'closures':
          return 'Closure';

        case 'futureEvents':
          return severityText + ' future event'

        default:
          return severityText + (data.event_type == 'INCIDENT' ? ' incident' : ' current event');
      }
    }

    return (
      <div className={'typeDisplayContainer'}>
        <EventTypeIcon event={data} />
        <p className={'typeDisplay'}>{getTypeDisplay()}</p>
      </div>
    );
  }

  const columns = [
    {
      header: 'Type',
      accessorKey: 'display_category',
      sortingFn: 'typeSort',
      cell: (props) => getEventTypeCell(props.row.original),
    },
    {
      header: 'Location',
      accessorKey: 'location_description',
      sortingFn: 'severitySort', // override to sort by severity instead
      cell: (props) => <span>{props.getValue()}</span>,
    },
    {
      header: 'Closest Landmark',
      accessorKey: 'closest_landmark',
      sortingFn: 'routeSort', // override to sort by severity instead
      cell: (props) => <span>{props.getValue() ? props.getValue() : '-'}</span>,
    },
    {
      header: 'Description',
      accessorKey: 'optimized_description',
      enableSorting: false,
    },
    {
      header: 'Last Update',
      accessorKey: 'last_updated',
      cell: (props) => <FriendlyTime date={props.getValue()} />,
    },
    {
      header: 'Next Update',
      accessorKey: 'next_update',
      cell: (props) => props.getValue() ? <FriendlyTime date={props.getValue()} /> : '-',
      enableSorting: false,
    },
  ];

  // react-table sorting functions
  const defaultSortFn = (rowA, rowB, columnId) => {
    const aValue = rowA.original[columnId];
    const bValue = rowB.original[columnId];

    return aValue > bValue ? 1 : -1;
  }

  const routeSortFn = (rowA, rowB) => {
    return defaultSortFn(rowA, rowB,
      // Use highway ref as secondary sort
      rowA.original.route_at != rowB.original.route_at ? 'route_at' : 'start_point_linear_reference'
    );
  }

  const typeSortFn = (rowA, rowB, columnId) => {
    // Alphabetical primary sort
    if (rowA.original.display_category != rowB.original.display_category) {
      return defaultSortFn(rowA, rowB, 'display_category');

    // Route secondary sort
    } else {
      return routeSortFn(rowA, rowB);
    }
  }

  const severitySortFn = (rowA, rowB, columnId) => {
    // Reversed due to desc priority logic
    if (rowA.original.display_category != rowB.original.display_category) {
      return defaultSortFn(rowA, rowB, 'severity') * -1;

    // Reversed route secondary sort
    } else {
      return routeSortFn(rowA, rowB) * -1;
    }
  }

  // react-table initiation
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

  // react-table sorting handler and hook
  const getSortColumnIndex = (key) => {
    switch (key) {
      case 'severity_desc':
      case 'severity_asc':
        return 1;
      case 'road_name_desc':
      case 'road_name_asc':
        return 2;
      case 'last_updated_desc':
      case 'last_updated_asc':
        return 4;
    }
  }

  const sortingHandler = () => {
    const k = getSortColumnIndex(sortingKey);
    table.getAllColumns()[k].toggleSorting(sortingKey.endsWith('_desc'));
  }

  useEffect(() => {
    sortingHandler(sortingKey);
  }, [sortingKey]);

  // Rendering - loader
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

  // Rendering - table
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

  const renderTable = (rows) => {
    const res = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      res.push(
        <tr className={`${row.original.severity.toLowerCase()} headerRow`} onClick={() => routeHandler(row.original)}>
          <td colSpan={10}>
            <p className={'roadName'}>{row.original.route_at}</p>
            <p className={'directionDisplay'}>{row.original.direction_display}</p>
          </td>
        </tr>
      );

      res.push(
        <tr className={`${row.original.severity.toLowerCase()} dataRow`} onClick={() => routeHandler(row.original)} key={row.id}>
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
    }

    return (
      <tbody>
        {res}
      </tbody>
    );
  }

  // Rendering - main component
  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <th className={header.id} key={header.id} colSpan={header.colSpan}>
                  {!header.isPlaceholder && !showLoader && (
                    <span>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
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
        renderTable(table.getRowModel().rows)
      }

      {showLoader &&
        renderLoader()
      }
    </table>
  );
}
