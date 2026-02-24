"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  FileSpreadsheet,
  CalendarCheck 
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { generateHistoryExcel, generateDailyExcel } from "@/lib/generateHistoryReport";

// --- DATA INTERFACE ---
export interface Job {
  id: string; 
  deliveryNo: string;
  deliveryDate: string; 
  location: string;
  jobName: string;
  client: string;
  invoiceNo: string;
  amount: number;
  paymentInfo: "Credit" | "Drop Sample" | "CC Payment" | "Paid" | "Partial Delivery";
  salesPerson: string;
  status: "Active" | "Completed"; 
  createdAt: Timestamp;
  completedAt?: Timestamp; 
  driver?: string; 
  deliveryType?: string; // <--- NEW PROPERTY
}

export default function HistoryPage() {
  const [data, setData] = useState<Job[]>([]);
  const [filteredData, setFilteredData] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Table States
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // Date Range State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // --- FETCH HISTORY ---
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "jobs"),
        where("status", "==", "Completed"),
        orderBy("completedAt", "desc"),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Job[];
      
      setData(logs);
      setFilteredData(logs); 
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  // --- DATE FILTER LOGIC ---
  useEffect(() => {
    if (!startDate && !endDate) {
        setFilteredData(data);
        return;
    }

    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() + 86400000 : Infinity; 

    const filtered = data.filter(job => {
        const timestamp = job.completedAt || job.createdAt;
        const jobDate = timestamp?.seconds ? timestamp.seconds * 1000 : 0;
        return jobDate >= start && jobDate <= end;
    });
    setFilteredData(filtered);

  }, [startDate, endDate, data]);

  const resetDates = () => {
    setStartDate("");
    setEndDate("");
    setFilteredData(data);
    toast.info("Filters reset");
  };

  // --- EXPORT FUNCTIONS ---
  const handleExportFull = async () => {
    if (filteredData.length === 0) {
      toast.error("No data to export");
      return;
    }
    try {
        await generateHistoryExcel(filteredData);
        toast.success("Full History Report Generated");
    } catch (error) {
        console.error(error);
        toast.error("Failed to generate report");
    }
  };

  const handleExportDaily = async () => {
    try {
        await generateDailyExcel(data);
        toast.success("Daily Report Generated");
    } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : "Failed to generate daily report";
        toast.error(message);
    }
  };

  // --- COLUMNS ---
  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: "invoiceNo",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Invoice <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <span className="font-mono font-bold text-blue-600">#{row.getValue("invoiceNo")}</span>,
    },
    {
      accessorKey: "deliveryDate",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Del. Date <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <span className="text-gray-600 text-sm whitespace-nowrap">{row.getValue("deliveryDate")}</span>,
    },
    {
      accessorKey: "client",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Client Name <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <span className="font-bold text-gray-800">{row.getValue("client")}</span>,
    },
    {
      accessorKey: "jobName",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Job Name <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <span className="text-sm font-medium text-gray-600">{row.getValue("jobName")}</span>,
    },
    {
      accessorKey: "location",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Location <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <span className="text-gray-700 py-1 rounded text-xs font-medium">
          {row.getValue("location")}
        </span>
      )
    },
    // --- NEW COLUMN: DELIVERY TYPE ---
    {
      accessorKey: "deliveryType", 
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Del. Type <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const type = row.getValue("deliveryType") as string;
        return (
          <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded-md whitespace-nowrap">
            {type || "Spectrum Delivery"} {/* Fallback for old jobs */}
          </span>
        );
      }
    },
    {
      accessorKey: "driver", 
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Driver <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <span className="text-sm font-medium pl-4 whitespace-nowrap">{row.getValue("driver") || "-"}</span>
      )
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <div className="text-right">
             <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Amount <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => <div className="text-right font-medium whitespace-nowrap">AED {formatCurrency(row.getValue("amount"))}</div>,
    },
    {
        accessorKey: "paymentInfo",
        header: "Payment",
        cell: ({ row }) => {
          const val = row.getValue("paymentInfo") as string;
          const isPaid = val === "Paid" || val === "CC Payment";
          const isCredit = val === "Credit";
          
          return (
            <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                isPaid ? "bg-green-100 text-green-800" : 
                isCredit ? "bg-blue-100 text-blue-800" : 
                "bg-yellow-100 text-yellow-800"
            }`}>
                {val}
            </span>
          );
        }
    }
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  return (
    <div className="p-6 max-w-400 mx-auto space-y-6">
       
       {/* HEADER */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="flex items-center gap-4">
            <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft /></Button></Link>
            <h1 className="text-3xl font-bold tracking-tight">History Log</h1>
         </div>
         
         <div className="flex gap-2">
            <Button variant="default" onClick={handleExportDaily} className="bg-blue-600 hover:bg-blue-700">
                <CalendarCheck className="mr-2 h-4 w-4" /> Daily Report
            </Button>
            <Button variant="outline" onClick={handleExportFull} title="Export current view" className="border-green-600 text-green-700 hover:bg-green-50">
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Full Export
            </Button>
            <Button variant="secondary" onClick={fetchHistory}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
         </div>
       </div>

       {/* FILTERS CONTAINER */}
       <div className="flex flex-col xl:flex-row gap-4 justify-between items-end bg-slate-50 p-4 rounded-lg border">
          <div className="flex flex-wrap items-end gap-4 w-full xl:w-auto">
             <div>
                <span className="text-xs font-bold text-gray-500 block mb-1">Start Date</span>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white w-40" />
             </div>
             <div>
                <span className="text-xs font-bold text-gray-500 block mb-1">End Date</span>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white w-40" />
             </div>
             {(startDate || endDate) && (
                 <Button variant="ghost" onClick={resetDates} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <X className="h-4 w-4 mr-2" /> Clear Date Filter
                 </Button>
             )}
          </div>
          <div className="relative w-full xl:w-72">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
             <Input
                placeholder="Search invoice, client, job..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 bg-white"
              />
          </div>
       </div>

       {/* TABLE */}
       <div className="border rounded-lg shadow-sm bg-white overflow-hidden w-full overflow-x-auto">
         <Table className="w-full table-fixed">
            <TableHeader>
                {table.getHeaderGroups().map(hg => (
                    <TableRow key={hg.id}>
                      {hg.headers.map(h => (
                        <TableHead
                          key={h.id}
                          style={{ width: h.getSize() }}
                          className="whitespace-normal wrap-break-word"
                        >
                          {h.isPlaceholder
                            ? null
                            : flexRender(h.column.columnDef.header, h.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={10} className="text-center h-24">Loading history...</TableCell></TableRow>
                ) : table.getRowModel().rows.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center h-24 text-gray-500 truncate max-w-50">No completed jobs found.</TableCell></TableRow>
                ) : (
                    table.getRowModel().rows.map(row => (
                        <TableRow key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <TableCell key={cell.id} className="whitespace-normal wrap-break-word">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                            ))}
                        </TableRow>
                    ))
                )}
            </TableBody>
         </Table>
       </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-end space-x-2">
        <div className="text-sm text-gray-500 mr-4">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

    </div>
  );
}