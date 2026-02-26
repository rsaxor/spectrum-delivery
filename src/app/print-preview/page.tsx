"use client";

import { LabelTemplate } from "@/components/print/LabelTemplate";
import { MasterDeliveryNote } from "@/components/print/MasterDeliveryNote";
import { Job, PrintData, Package } from "@/types/job";

export default function PrintPreviewPage() {
  // --- DUMMY DATA ---
  const dummyJob: Job = {
    client: "Acme Corp",
    jobName: "Q3 Marketing Materials",
    location: "Dubai Marina, Tower B, Office 402",
    invoiceNo: "INV-2026-0899",
    deliveryNo: "DEL-88321",
    deliveryDate: "YEAR-MM-DD",
  };

  const dummyPackage: Package = {
    id: 1,
    size: "A4",
    // itemNo: "ITEM-001",
    desc: "1000x Business Cards (Matte Finish) & 500x Flyers",
    qty: "1500",
    // remarks: "Handle with care, keep dry.",
  };

  const dummyPrintData: PrintData = {
    ...dummyPackage,
    job: dummyJob,
    driver: "Shahul",
    totalBoxes: 3,
    totalQuantity: "3000"
  };

  const dummyPackagesList: Package[] = [
    dummyPackage,
    // { id: 2, size: "A4", itemNo: "ITEM-002", desc: "A3 Posters", qty: "50", remarks: "Rolled in tube" },
    // { id: 3, size: "A5", itemNo: "ITEM-003", desc: "Branded Pens", qty: "200", remarks: "" }
    { id: 2, size: "A4", desc: "A3 Posters", qty: "50" },
    { id: 3, size: "A5", desc: "Branded Pens", qty: "200" }
  ];

  return (
    <div className="min-h-screen bg-neutral-800 p-10 flex flex-col gap-10 items-center">
      
      <div className="text-white text-center">
        <h1 className="text-3xl font-bold">Print Template Sandbox</h1>
      </div>

      {/* --- PREVIEW a5: LABEL a5 --- */}
      <div className="flex flex-col gap-2">
        <h2 className="text-white font-bold tracking-widest text-sm uppercase">A5 Label Template Preview</h2>
        {/* We wrap it in a white div with a shadow to simulate paper */}
        <div className="bg-white shadow-2xl overflow-hidden" style={{ width: '210mm', minHeight: '297mm' }}>
           <LabelTemplate data={dummyPrintData} size="A5" />
        </div>
      </div>

      {/* --- PREVIEW 1: LABEL --- */}
      <div className="flex flex-col gap-2">
        <h2 className="text-white font-bold tracking-widest text-sm uppercase">A4 Label Template Preview</h2>
        {/* We wrap it in a white div with a shadow to simulate paper */}
        <div className="bg-white shadow-2xl overflow-hidden relative" style={{ width: '210mm', minHeight: '297mm' }}>
          <LabelTemplate data={dummyPrintData} size="A4" />
          <div className="absolute left-0 right-0 top-1/2 border-t-2 border-dashed border-gray-300 pointer-events-none"></div>
        </div>
      </div>

      <hr className="w-full border-neutral-600 my-10" />

      {/* --- PREVIEW 2: MASTER NOTE --- */}
      <div className="flex flex-col gap-2">
        <h2 className="text-white font-bold tracking-widest text-sm uppercase">Master Delivery Note Preview</h2>
        <div className="bg-white shadow-2xl overflow-hidden" style={{ width: '210mm', minHeight: '297mm' }}>
           <MasterDeliveryNote job={dummyJob} driver="Shahul" packages={dummyPackagesList} />
        </div>
      </div>

    </div>
  );
}