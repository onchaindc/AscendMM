import {
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { shortenAddress } from "@/lib/format";
import type { VaultActivityItem } from "@/lib/types";

function ActivityTypeCell({ item }: { item: VaultActivityItem }) {
  const isDeposit = item.type === "Deposit";
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-flex size-6 items-center justify-center rounded-md border",
          isDeposit
            ? "border-positive/25 bg-positive/10 text-positive"
            : "border-negative/25 bg-negative/10 text-negative",
        )}
      >
        {isDeposit ? (
          <ArrowDownToLine className="size-3" />
        ) : (
          <ArrowUpFromLine className="size-3" />
        )}
      </span>
      <span className="text-sm text-fg">{item.type}</span>
    </span>
  );
}

/**
 * Recent vault activity. Desktop renders the full table; mobile renders the
 * same data as compact rows so no columns are squeezed or clipped.
 */
export function VaultActivity({ items }: { items: VaultActivityItem[] }) {
  return (
    <div>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <ActivityTypeCell item={item} />
                </TableCell>
                <TableCell className="data text-sm text-fg">
                  {item.amount}
                </TableCell>
                <TableCell className="data text-sm text-muted">
                  {shortenAddress(item.address)}
                </TableCell>
                <TableCell className="text-right text-sm text-faint">
                  {item.time}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-line sm:hidden">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2.5">
              <ActivityTypeCell item={item} />
            </div>
            <div className="text-right">
              <p className="data text-sm text-fg">{item.amount}</p>
              <p className="data mt-0.5 text-xs text-faint">
                {shortenAddress(item.address)} · {item.time}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
