"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  Plus,
  Pencil,
  Search,
  Printer,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  HandHeart,
  Boxes,
	LogOut,
} from "lucide-react";

import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { formatCurrency } from "@/lib/format";

// --- 1. DATA SHAPE ---
export interface Job {
  id: string;
  deliveryNo: string;
  deliveryDate: string;
  location: string;
  jobName: string;
  client: string;
  invoiceNo: string;
  amount: number;
  paymentInfo:
    | "Credit"
    | "Drop Sample"
    | "CC Payment"
    | "Paid"
    | "Partial Delivery";
  salesPerson: string;
  status: "Active" | "Completed";
  createdAt: Timestamp;
}

export default function Dashboard() {
  const router = useRouter();
  
  const [data, setData] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
	const userEmail = auth.currentUser?.email || "";

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login"); // <-- Explicitly redirect the user
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  // Dialog States
  // Removed jobToComplete state
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  // --- 2. FETCH ACTIVE JOBS ---
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "jobs"),
        where("status", "==", "Active"),
      );
      const querySnapshot = await getDocs(q);

      const jobsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Job[];

      setData(jobsData);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // --- 3. ACTIONS ---
  // Removed handleMarkComplete function

  // Delete Job (Optimistic Update)
  const handleDeleteJob = async () => {
    if (!jobToDelete) return;

    setData((prev) => prev.filter((job) => job.id !== jobToDelete));
    setJobToDelete(null);

    try {
      await deleteDoc(doc(db, "jobs", jobToDelete));
      toast.success("Job Deleted Permanently");
    } catch (error) {
      toast.error("Failed to delete job");
      fetchJobs();
    }
  };

  // --- 4. NEW COLUMN DEFINITIONS ---
  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: "invoiceNo",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Invoice
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="font-mono font-bold text-blue-600">
          #{row.getValue("invoiceNo")}
        </span>
      ),
    },
    {
      accessorKey: "deliveryDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const deliveryDate = row.getValue("deliveryDate") as string;
        const todayStr = new Date().toISOString().split("T")[0];
        
        // Default styling (Future dates)
        let styleClass = "text-gray-600 bg-transparent";
        
        // Conditional styling
        if (deliveryDate < todayStr) {
          // Delayed: Red background
          styleClass = "bg-red-100 text-red-800 font-bold px-2 py-1 rounded";
        } else if (deliveryDate === todayStr) {
          // Due Today: Yellow background
          styleClass = "bg-yellow-100 text-yellow-800 font-bold px-2 py-1 rounded";
        }

        return (
          <span className={`text-sm whitespace-nowrap ${styleClass}`}>
            {deliveryDate}
          </span>
        );
      },
    },
    {
      accessorKey: "client",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Client/Company Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="font-bold text-gray-800">
          {row.getValue("client")}
        </span>
      ),
    },
    {
      accessorKey: "jobName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Job Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-600">
          {row.getValue("jobName")}
        </span>
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <span className="bg-gray-100 text-gray-900 px-2 py-1 rounded text-sm font-medium whitespace-nowrap">
          {row.getValue("location")}
        </span>
      ),
    },
    {
      accessorKey: "salesPerson",
      header: "Sales",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {row.getValue("salesPerson")}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(
                  column.getIsSorted() === "asc",
                )
              }
            >
              Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="text-right font-medium whitespace-nowrap">
          AED {formatCurrency(row.getValue("amount"))}
        </div>
      ),
    },
    {
      accessorKey: "paymentInfo",
      header: "Payment",
      cell: ({ row }) => {
        const p = row.original.paymentInfo;
        const colorClass =
          p === "Paid"
            ? "bg-green-100 text-green-800"
            : p === "Credit"
              ? "bg-blue-100 text-blue-800"
              : p === "CC Payment"
                ? "bg-purple-100 text-purple-800"
                : "bg-yellow-100 text-yellow-800";

        return (
          <span
            className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold whitespace-nowrap ${colorClass}`}
          >
            {p}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const job = row.original;
        return (
          <div className="flex justify-end gap-1">
            <TooltipProvider>
              {/* 1. EDIT */}
              <Link href={`/jobs/${job.id}/edit`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit Job"
                      className="h-8 w-8 hover:bg-gray-200"
                    >
                      <Pencil className="h-4 w-4 text-gray-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Edit Job</p>
                  </TooltipContent>
                </Tooltip>
              </Link>

              <Link href={`/sales-delivery/${job.id}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Sales Delivery"
                      className="h-8 w-8 hover:bg-gray-200"
                    >
                      <HandHeart className="h-4 w-4 text-slate-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Sales Delivery</p>
                  </TooltipContent>
                </Tooltip>
              </Link>


              {/* 2. PRINT (Includes Completion Logic) */}
              <Link href={`/print/${job.id}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Print & Complete"
                      className="h-8 w-8 hover:bg-gray-200"
                    >
                      <Printer className="h-4 w-4 text-slate-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Print / Mark Complete</p>
                  </TooltipContent>
                </Tooltip>
              </Link>

              <Link href={`/courier/${job.id}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Courier Service"
                      className="h-8 w-8 hover:bg-gray-200"
                    >
                      <Boxes className="h-4 w-4 text-slate-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Courier Service</p>
                  </TooltipContent>
                </Tooltip>
              </Link>

              {/* Removed Mark Complete Button from here */}

              {/* 3. DELETE */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:bg-red-100 hover:text-red-700"
                    title="Delete Job"
                    onClick={() => setJobToDelete(job.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Delete Job</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="p-6 max-w-400 mx-auto space-y-6">
      {/* HEADER */}
      <header className="bg-zinc-800 text-white shadow-lg top-0 z-50">
				<div className="w-full mx-auto px-6 py-4 flex flex-col md:flex-row gap-4">
					<div className="w-full md:flex-1">
						<h1 className="text-2xl font-bold tracking-tight">
							Spectrum Delivery Application
						</h1>
						<p className="text-slate-400 text-sm">
							Spectrum Sustainable Print
						</p>
						<p className="text-xs mt-3 text-slate-400">
							Logged in as: {userEmail}
						</p>
						<Button
							variant="secondary"
							size="xs"
							onClick={handleLogout}
							className="flex items-center gap-2 mt-2"
						>
							<LogOut className="h-4 w-4" />
							Logout
						</Button>
					</div>
				</div>
			</header>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Active Jobs
        </h1>
        <div className="flex gap-2">
          <Link href="/jobs/new">
            <Button className="bg-slate-900 text-white">
              <Plus className="mr-2 h-4 w-4" /> New Job
            </Button>
          </Link>
          <Link href="/history">
            <Button variant="outline">History</Button>
          </Link>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search invoice, client, job..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Metrics */}
      <DashboardMetrics jobs={data} />

      {/* TABLE */}
      <div className="border rounded-lg shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef
                            .header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center"
                >
                  No active jobs.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-end space-x-2">
        <div className="text-sm text-gray-500 mr-4">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* --- DIALOGS --- */}

      {/* Removed Completion Dialog */}

      {/* 2. DELETE DIALOG */}
      <AlertDialog
        open={!!jobToDelete}
        onOpenChange={() => setJobToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Delete Job Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently
              delete the job from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJob}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}