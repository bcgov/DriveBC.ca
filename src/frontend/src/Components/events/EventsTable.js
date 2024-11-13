// React
import React, { useEffect, useState } from 'react';

// External Imports
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot } from '@fortawesome/pro-solid-svg-icons';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Button from 'react-bootstrap/Button';

// Internal imports
import { getTypeDisplay, routeAtSortFn, routeOrderSortFn, severitySortFn } from './functions';
import EventTypeIcon from './EventTypeIcon';
import FriendlyTime from '../shared/FriendlyTime';

// Styling
import './EventsTable.scss';

export default function EventsTable(props) {
  // Props
  const { data, routeHandler, showLoader, sortingKey } = props;

  // States
  const [sorting, setSorting] = useState([{ desc: true, id: 'location_description' }]);

  // react-table columns
  const getEventTypeCell = (data) => {
    return (
    <OverlayTrigger placement="top" overlay={getDelayTooltip(data)}>
      <button className="eventType" aria-label={getTypeDisplay(data)} aria-describedby={getDelayTooltip(data)}>
        <EventTypeIcon event={data} state={data.display_category === 'majorEvents' ? 'static' : 'active'} />
        <span>{getTypeDisplay(data)}</span>
      </button>
      </OverlayTrigger>
    );
  }


  const getDelayTooltip = (data) =>{
    const eventType = data.display_category;
    switch(eventType){
      case "closures":
        return <Tooltip id="tooltip" className="tooltip-content">
          <p>Travel is not possible in one or both directions on this road. Find an alternate route or a detour where possible.</p>
        </Tooltip>
      case "majorEvents":
        return <Tooltip id="tooltip" className="tooltip-content">
        <p>Expect delays of at least 30 minutes or more on this road. This could be due to a traffic incident, road work, or construction.</p>
          </Tooltip>
      case "minorEvents":
        return <Tooltip id="tooltip" className="tooltip-content">
         <p>Expect delays up to 30 minutes on this road. This could be due to a traffic incident, road work, or construction.</p>
        </Tooltip>
      case "futureEvents":
        return <Tooltip id="tooltip" className="tooltip-content">
          <p>Future road work or construction is planned for this road.</p>
        </Tooltip>
    }
  }

  const columns = [
    {
      header: <span tabIndex={0}>{'Location'}</span>,
      accessorKey: 'location_description',
      sortingFn: 'severitySort', // override to sort by severity instead
      cell: (props) => <span>{props.getValue()}</span>,
    },
    {
      header: <span tabIndex={0}>{'Closest Landmark'}</span>,
      accessorKey: 'closest_landmark',
      sortingFn: 'routeAtSort', // override to sort by route at instead
      cell: (props) => <span>{props.getValue() ? props.getValue() : '-'}</span>,
    },
    {
      header: <span tabIndex={0}>{'Description'}</span>,
      accessorKey: 'optimized_description',
      sortingFn: 'routeOrderSort', // override to sort by route order instead
    },
    {
      header: <span tabIndex={0}>{'Last Update'}</span>,
      accessorKey: 'last_updated',
      cell: (props) => <FriendlyTime date={props.getValue()} />,
    },
    {
      header: <span tabIndex={0}>{'Next Update'}</span>,
      accessorKey: 'next_update',
      cell: (props) => props.getValue() ? <FriendlyTime date={props.getValue()} isNextUpdate={true} /> : '-',
      enableSorting: false,
    },
  ];

  const columnCount = columns.length

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
      routeAtSort: routeAtSortFn,
      severitySort: severitySortFn,
      routeOrderSort: routeOrderSortFn,
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
        return 0;
      case 'road_name_desc':
      case 'road_name_asc':
        return 1;
      case 'route_order':
        return 2;
      case 'last_updated_desc':
      case 'last_updated_asc':
        return 3;
    }
  }

  const sortingHandler = () => {
    const k = getSortColumnIndex(sortingKey);
    table.getAllColumns()[k].toggleSorting(sortingKey.endsWith('_desc'));
  }

  useEffect(() => {
    sortingHandler();
  }, [sortingKey]);

  // Rendering - loader
  const renderLoader = () => {
    const rows = [];
    for (let i = 0; i < 20; i++) {
      rows.push(
        <tr key={`loader-row-${i}-header`} className={'headerRow'}>
          <td colSpan={columnCount}>
            <p>
              <Skeleton width={200} />
              <Skeleton width={100} />
            </p>
          </td>
        </tr>
      );

      rows.push(
        <tr key={`loader-row-${i}-data`} className={'dataRow'}>
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
        <tr className={`${row.original.severity.toLowerCase()} headerRow ${row.original.highlight ? 'highlighted' : ''}`} tabIndex={0} key={`${row.id}-header-row`}>
          <td colSpan={2}>
            <p className={'roadName'}>{row.original.route_at}</p>
            <p className={'directionDisplay'}>{row.original.direction_display}</p>
            <Button
              className="viewOnMap-btn"
              aria-label="View on map"
              onClick={() => routeHandler(row.original)}>
              <FontAwesomeIcon icon={faLocationDot} />
              <span>View on map</span>
            </Button>
          </td>
          <td colSpan={3}>
            <div className="space-between-row">
              {getEventTypeCell(row.original)}
              {row.original.highlight &&
                <div className="updated-pill">Updated</div>
              }
            </div>
          </td>
        </tr>
      );

      res.push(
        <tr className={`${row.original.severity.toLowerCase()} dataRow`} key={`${row.id}-data-row`}>
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
                <th className={'event-table-header ' + header.id} key={header.id} colSpan={header.colSpan}>
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
