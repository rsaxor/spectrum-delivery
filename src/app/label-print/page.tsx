"use client";

import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import Link from "next/link";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, ArrowLeft, Box, FileText, Tag } from "lucide-react"; 

// Types & Templates
import { Job, Package, PrintData } from "@/types/job";
import { LabelTemplate } from "@/components/print/LabelTemplate";
import { AllLabelsTemplate } from "@/components/print/AllLabelsTemplate";
import { MasterDeliveryNote } from "@/components/print/MasterDeliveryNote";

export default function StandaloneLabelPrintPage() {
  // --- 1. MANUAL JOB FIELDS ---
  const [invoiceNo, setInvoiceNo] = useState("");
  const [client, setClient] = useState("");
  const [jobName, setJobName] = useState("");
  const [location, setLocation] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  const [salesPerson, setSalesPerson] = useState("");
  
  // --- 2. PRINT SPECIFICS ---
  const [deliveredBy, setDeliveredBy] = useState(""); 
  const [totalBoxes, setTotalBoxes] = useState(1);
  const [totalQuantity, setTotalQuantity] = useState("");

  const [packages, setPackages] = useState<Package[]>([
    { id: 1, size: "A5", desc: "", qty: "" } 
  ]);

  // --- 3. PACKAGE LOGIC ---
  const handleTotalQuantityChange = (newTotal: string) => {
    setTotalQuantity(newTotal);
    const resetPackages = packages.map(pkg => ({ ...pkg, qty: "" }));
    setPackages(resetPackages);
  };

  const handleBoxCountChange = (count: number) => {
    setTotalBoxes(count);
    const newPackages = Array.from({ length: count }).map((_, i) => {
      return packages[i] || { id: i + 1, size: "A5", desc: "", qty: "" };
    });
    setPackages(newPackages);
  };

  const handleQtyChange = (index: number, value: string) => {
    if (!totalQuantity) {
      updatePackage(index, "qty", value);
      return;
    }

    const totalNum = parseInt(totalQuantity.replace(/\D/g, "")) || 0;
    const inputNum = parseInt(value.replace(/\D/g, "")) || 0;

    if (inputNum > totalNum) {
      toast.error("Quantity Limit Exceeded");
      updatePackage(index, "qty", ""); 
      return;
    }

    let sumOfOtherPackages = 0;
    packages.forEach((pkg, i) => {
        if (i !== index) sumOfOtherPackages += parseInt(pkg.qty.replace(/\D/g, "")) || 0;
    });

    if ((sumOfOtherPackages + inputNum) > totalNum) {
        toast.error("Total Quantity Exceeded");
        const remainingAllowed = totalNum - sumOfOtherPackages;
        updatePackage(index, "qty", remainingAllowed > 0 ? remainingAllowed.toString() : "0");
        return;
    }
    updatePackage(index, "qty", value);
  };

  const updatePackage = (index: number, field: keyof Package, value: string) => {
    const newPkgs = [...packages];
    newPkgs[index] = { ...newPkgs[index], [field]: value } as Package;
    setPackages(newPkgs);
  };

// --- 4. CONSTRUCT DUMMY DATA FOR TEMPLATES ---
  // Directly to the templates. 
  const mockJob = {
    invoiceNo: invoiceNo || "N/A",
    client: client || "N/A",
    jobName: jobName || "N/A",
    location: location || "N/A",
    contactNo: contactNo,
    deliveryDate: deliveryDate,
    salesPerson: salesPerson,
    deliveryNo: "",
  } as unknown as Job;

  // --- 5. PRINTING LOGIC ---
  const labelRef = useRef<HTMLDivElement>(null);
  const allLabelsRef = useRef<HTMLDivElement>(null);
  const masterRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<PrintData | null>(null);

  const handleLabelPrint = useReactToPrint({ contentRef: labelRef, documentTitle: "Quick_Label" });
  const handlePrintAllLabels = useReactToPrint({ contentRef: allLabelsRef, documentTitle: `All_Labels_${invoiceNo || "Quick"}` });
  const handleMasterPrint = useReactToPrint({ contentRef: masterRef, documentTitle: `Master_Note_${invoiceNo || "Quick"}` });

  const triggerLabelPrint = (pkg: Package) => {
    setPrintData({ ...pkg, job: mockJob, driver: deliveredBy, totalBoxes, totalQuantity });
    setTimeout(() => handleLabelPrint(), 100);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <Link href="/dashboard"><Button variant="ghost"><ArrowLeft /></Button></Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Tag className="h-6 w-6 text-blue-600"/> Quick Print utility
              </h1>
              <p className="text-gray-500">Print labels and notes without saving to database.</p>
            </div>
        </div>

        <div className="flex gap-2">
            <Button onClick={() => handleMasterPrint()} variant="outline" className="border-slate-300 bg-white">
                <FileText className="mr-2 h-4 w-4" /> Print Master Delivery
            </Button>
            {packages.length > 1 && (
                <Button onClick={() => handlePrintAllLabels()} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Printer className="mr-2 h-4 w-4" /> Print All Labels
                </Button>
            )}
        </div>
      </div>

      {/* MANUAL JOB DETAILS */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
            <CardTitle className="text-lg">Job Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label>Invoice No.</Label>
                <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. 12345" />
            </div>
            <div className="space-y-2">
                <Label>Client Name</Label>
                <Input value={client} onChange={e => setClient(e.target.value)} placeholder="Spectrum" />
            </div>
            <div className="space-y-2">
                <Label>Job Name</Label>
                <Input value={jobName} onChange={e => setJobName(e.target.value)} placeholder="Business Cards" />
            </div>
            <div className="space-y-2">
                <Label>Delivery Date</Label>
                <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Delivery Location</Label>
                <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="DIFC" />
            </div>
            <div className="space-y-2">
                <Label>Contact No.</Label>
                <Input value={contactNo} onChange={e => setContactNo(e.target.value)} placeholder="+971..." />
            </div>
            <div className="space-y-2">
                <Label>Sales Person</Label>
                <Input value={salesPerson} onChange={e => setSalesPerson(e.target.value)} placeholder="e.g. John Doe" />
            </div>
        </CardContent>
      </Card>

      {/* PRINT SETTINGS */}
      <Card className="bg-slate-50 border-slate-200 shadow-sm">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
                <Label>Delivered By (For Master Note)</Label>
                <Input 
                   placeholder="e.g. Driver / Courier"
                   value={deliveredBy} 
                   onChange={(e) => setDeliveredBy(e.target.value)} 
                   className="bg-white"
                />
            </div>
            <div className="space-y-2">
                <Label>Total Quantity</Label>
                <Input 
                   type="text" 
                   placeholder="e.g. 500 pcs"
                   value={totalQuantity} 
                   onChange={(e) => handleTotalQuantityChange(e.target.value)} 
                   className="bg-white"
                />
            </div>
            <div className="space-y-2">
                <Label>Total Boxes Packaged</Label>
                <Input 
                   type="number" 
                   min={1} 
                   value={totalBoxes} 
                   onChange={(e) => handleBoxCountChange(Number(e.target.value))} 
                   className="bg-white"
                />
            </div>
        </CardContent>
      </Card>

      {/* PACKAGE REPEATER */}
      <div className="space-y-4">
        {packages.map((pkg, index) => (
           <Card key={index} className="border-l-4 border-l-slate-400 shadow-sm bg-white">
             <CardHeader className="pb-2">
                <CardTitle className="text-base flex justify-between items-center text-slate-700">
                    <span className="flex items-center gap-2"><Box className="h-4 w-4" /> Package {index + 1} of {totalBoxes}</span>
                    <Button size="sm" variant="outline" onClick={() => triggerLabelPrint(pkg)}>
                        <Printer className="mr-2 h-4 w-4" /> Print Label
                    </Button>
                </CardTitle>
             </CardHeader>
             <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label>Size</Label>
                    <Select value={pkg.size} onValueChange={(v) => updatePackage(index, "size", v as "A4" | "A5")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="A4">A4 (Full Sheet)</SelectItem>
                            <SelectItem value="A5">A5 (Half Sheet)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Input value={pkg.desc} onChange={(e) => updatePackage(index, "desc", e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input 
                        value={pkg.qty} 
                        onChange={(e) => handleQtyChange(index, e.target.value)} 
                        disabled={!totalQuantity}
                        placeholder={!totalQuantity ? "Set Total Qty first" : ""}
                    />
                </div>
             </CardContent>
           </Card>
        ))}
      </div>

      {/* --- HIDDEN PRINT TEMPLATES --- */}
      <div style={{ display: "none" }}>
         <LabelTemplate ref={labelRef} data={printData} size={printData?.size || null} />
         <AllLabelsTemplate ref={allLabelsRef} job={mockJob} driver={deliveredBy} packages={packages} totalBoxes={totalBoxes} totalQuantity={totalQuantity} />
         <MasterDeliveryNote ref={masterRef} job={mockJob} driver={deliveredBy} packages={packages} totalQuantity={totalQuantity} />
      </div>

    </div>
  );
}