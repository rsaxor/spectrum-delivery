// src/app/jobs/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { SALES_TEAM } from "@/lib/constants";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [invoiceNo, setInvoiceNo] = useState("");
  const [deliveryNo, setDeliveryNo] = useState(""); 
  const [deliveryDate, setDeliveryDate] = useState(""); 
  const [location, setLocation] = useState("");
  
  const [jobName, setJobName] = useState(""); 
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState(""); 
  const [salesPerson, setSalesPerson] = useState(""); 
  const [paymentInfo, setPaymentInfo] = useState("Credit"); 

  // Get today's date in YYYY-MM-DD format for the input min attribute
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDATION: Check for all required fields
    if (!invoiceNo || !client || !deliveryDate || !location || !jobName) {
      toast.error("Missing Information", {
        description: "Please fill in Delivery Date, Location, Client, and Job Name."
      });
      return;
    }

    setLoading(true);

    try {
      // Use Invoice No as ID
      await setDoc(doc(db, "jobs", invoiceNo), {
        invoiceNo,
        deliveryNo,
        deliveryDate,
        location,
        jobName,
        client,
        amount: Number(amount),
        salesPerson,
        paymentInfo,
        status: "Active", // Force Active status
        createdAt: serverTimestamp(),
      });

      toast.success("Job Created");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Error saving job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <h1 className="text-3xl font-bold">Encode New Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT: DELIVERY DETAILS */}
        <Card>
          <CardHeader><CardTitle>Delivery Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Delivery No.</Label>
              <Input value={deliveryNo} onChange={e => setDeliveryNo(e.target.value)} placeholder="e.g. DN-2024-001" />
            </div>
            <div className="space-y-2">
              <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Delivery Date</Label>
              {/* min={today} blocks past dates */}
              <Input 
                type="date" 
                min={today}
                value={deliveryDate} 
                onChange={e => setDeliveryDate(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Location</Label>
              <Input 
                value={location} 
                onChange={e => setLocation(e.target.value)} 
                placeholder="Dafza, Emaar, etc." 
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: JOB INFO */}
        <Card>
          <CardHeader><CardTitle>Job Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Invoice No (ID)</Label>
                    <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} required placeholder="162241" />
                </div>
                <div className="space-y-2">
                    <Label>Amount (AED)</Label>
                    <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Client/Company Name</Label>
                <Input value={client} onChange={e => setClient(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Job Name</Label>
                <Input value={jobName} onChange={e => setJobName(e.target.value)} required placeholder="Business Cards" />
            </div>
            <div className="space-y-2">
                <Label>Sales Person</Label>
                <Select onValueChange={setSalesPerson}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Sales" /></SelectTrigger>
                  <SelectContent>
                    {SALES_TEAM.map((salesTeamMember) => (
                        <SelectItem key={salesTeamMember} value={salesTeamMember}>
                            {salesTeamMember}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Payment Info</Label>
                <Select value={paymentInfo} onValueChange={setPaymentInfo}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit">Credit</SelectItem>
                    <SelectItem value="Drop Sample">Drop Sample</SelectItem>
                    <SelectItem value="CC Payment">CC Payment</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Partial Delivery">Partial Delivery</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
            <Button type="submit" className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? "Saving..." : "Save Job"} <Save className="ml-2" />
            </Button>
        </div>
      </form>
    </div>
  );
}