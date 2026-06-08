'use client'

import type { CSSProperties } from 'react'
import { useEffect, useId, useMemo, useState } from 'react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Cell, ColumnDef, Header, SortingState } from '@tanstack/react-table'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { ChevronDownIcon, ChevronUpIcon, GripVerticalIcon } from 'lucide-react'

type DynamicRow = Record<string, any>

interface DynamicDataTableProps {
  data: DynamicRow[]
}

export function DynamicDataTable({ data }: DynamicDataTableProps) {
  const dndId = useId()
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<DynamicRow>[]>(() => {
    if (!data || data.length === 0) return []
    return Object.keys(data[0]).map((key) => ({
      id: key,
      header: key,
      accessorKey: key,
      cell: ({ row }) => {
        const value = row.getValue(key)
        return (
          <div className="truncate max-w-[220px] text-neutral-600" title={String(value ?? '')}>
            {String(value ?? '')}
          </div>
        )
      },
    }))
  }, [data])

  const [columnOrder, setColumnOrder] = useState<string[]>([])

  useEffect(() => {
    if (columns.length > 0) {
      setColumnOrder(columns.map((col) => col.id as string))
    }
  }, [columns])

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting, columnOrder },
    onColumnOrderChange: setColumnOrder,
    enableSortingRemoval: false,
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setColumnOrder((order) => {
        const oldIndex = order.indexOf(active.id as string)
        const newIndex = order.indexOf(over.id as string)
        return arrayMove(order, oldIndex, newIndex)
      })
    }
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-white text-sm text-neutral-400">
        Data tidak tersedia.
      </div>
    )
  }

  return (
    <DndContext
      id={dndId}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      {/* 
        Key fix: the table wrapper needs to be a flex column with min-h-0
        so the inner scroll container can actually shrink inside the parent.
        The parent layout must also be a flex column with a fixed/bounded height.
      */}
      <div className="flex flex-col w-full h-full min-h-0 rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        {/* Memaksa wrapper bawaan Shadcn <Table> untuk mengambil tinggi penuh dan menjadi scroll container-nya */}
        <div className="flex-1 min-h-0 [&>div]:h-full [&>div]:overflow-auto">
          <Table className="w-full border-collapse">
            <TableHeader className="sticky top-0 z-20 shadow-[0_1px_0_0_#e5e5e5]">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-neutral-50 border-b border-neutral-200 [&>th]:border-t-0 hover:bg-neutral-50"
                >
                  <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                    {headerGroup.headers.map((header) => (
                      <DraggableTableHeader key={header.id} header={header} />
                    ))}
                  </SortableContext>
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row, i) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={`border-b border-neutral-100 transition-colors hover:bg-blue-50/30 ${
                      i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/40'
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <SortableContext key={cell.id} items={columnOrder} strategy={horizontalListSortingStrategy}>
                        <DragAlongCell key={cell.id} cell={cell} />
                      </SortableContext>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-neutral-400">
                    Tidak ada data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer row count */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-100 bg-neutral-50/80">
          <span className="text-xs text-neutral-400">
            {table.getRowModel().rows.length} baris
          </span>
        </div>
      </div>
    </DndContext>
  )
}

const DraggableTableHeader = ({ header }: { header: Header<any, unknown> }) => {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: header.column.id,
  })

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition,
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    zIndex: isDragging ? 10 : 0,
  }

  const sorted = header.column.getIsSorted()

  return (
    <TableHead
      ref={setNodeRef}
      className="h-10 px-2 border-r last:border-r-0 border-neutral-200/70 select-none bg-neutral-50"
      style={style}
      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
    >
      <div className="flex items-center gap-1 w-full min-w-0">
        {/* Drag handle */}
        <button
          className="flex items-center justify-center h-5 w-5 shrink-0 rounded text-neutral-300 hover:text-neutral-500 hover:bg-neutral-200/60 cursor-grab active:cursor-grabbing transition-colors"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVerticalIcon className="size-3" aria-hidden />
        </button>

        {/* Column label */}
        <span className="flex-1 truncate font-semibold text-[10px] tracking-widest uppercase text-neutral-500">
          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
        </span>

        {/* Sort button */}
        <button
          className="group flex items-center justify-center h-5 w-5 shrink-0 rounded text-neutral-300 hover:text-neutral-600 hover:bg-neutral-200/60 transition-colors"
          onClick={header.column.getToggleSortingHandler()}
          aria-label="Toggle sorting"
        >
          {sorted === 'asc' ? (
            <ChevronUpIcon className="size-3 text-blue-500" aria-hidden />
          ) : sorted === 'desc' ? (
            <ChevronDownIcon className="size-3 text-blue-500" aria-hidden />
          ) : (
            <ChevronUpIcon className="size-3 opacity-0 group-hover:opacity-60 transition-opacity" aria-hidden />
          )}
        </button>
      </div>
    </TableHead>
  )
}

const DragAlongCell = ({ cell }: { cell: Cell<any, unknown> }) => {
  const { isDragging, setNodeRef, transform, transition } = useSortable({
    id: cell.column.id,
  })

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition,
    width: cell.column.getSize(),
    zIndex: isDragging ? 10 : 0,
  }

  return (
    <TableCell
      ref={setNodeRef}
      className="py-2.5 px-3 text-sm text-neutral-600 border-r last:border-r-0 border-neutral-100"
      style={style}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  )
}