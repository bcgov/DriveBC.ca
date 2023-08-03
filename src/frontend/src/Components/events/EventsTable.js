// React
import React, { useState } from "react";

// Third party packages
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpLong,
  faArrowDownLong
} from "@fortawesome/free-solid-svg-icons";

// Styling
import "./EventsTable.scss";

export default function EventsTable({ columns, data }) {
  const [sorting, setSorting] = useState([]);

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
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const asc_icon = <FontAwesomeIcon icon={faArrowUpLong} alt="ascending order" />;
  const desc_icon = <FontAwesomeIcon icon={faArrowDownLong} alt="descending order" />;

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
                        className: header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : "",
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: asc_icon,
                        desc: desc_icon,
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
        {table
          .getRowModel()
          .rows
          .map((row) => {
            return (
              <tr className={row.original.severity.toLowerCase()} key={row.id}>
                {row.getVisibleCells().map((cell) => {
                    return <td className={cell.column.id} key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                })}
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}
