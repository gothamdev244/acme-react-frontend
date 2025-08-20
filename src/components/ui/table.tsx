import * as React from "react"

import { cn } from "../../lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn(
        // Sizing
        "w-full",
        // Typography
        "text-sm",
        // Caption position
        "caption-bottom",
        // Custom classes
        className
      )}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn(
    // Border styles
    "[&_tr]:border-b",
    // Custom classes
    className
  )} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      // Border styles
      "[&_tr:last-child]:border-0",
      // Custom classes
      className
    )}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      // Borders
      "border-t",
      // Colors
      "bg-muted/50",
      // Typography
      "font-medium",
      // Child styles
      "[&>tr]:last:border-b-0",
      // Custom classes
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      // Borders
      "border-b",
      // Transitions
      "transition-colors",
      // Hover state
      "hover:bg-muted/50",
      // Selected state
      "data-[state=selected]:bg-muted",
      // Custom classes
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      // Sizing
      "h-12",
      // Spacing
      "px-4",
      // Alignment
      "text-left align-middle",
      // Typography
      "font-medium",
      // Colors
      "text-muted-foreground",
      // Conditional styles
      "[&:has([role=checkbox])]:pr-0",
      // Custom classes
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      // Spacing
      "p-4",
      // Alignment
      "align-middle",
      // Conditional styles
      "[&:has([role=checkbox])]:pr-0",
      // Custom classes
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      // Spacing
      "mt-4",
      // Typography
      "text-sm",
      // Colors
      "text-muted-foreground",
      // Custom classes
      className
    )}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
