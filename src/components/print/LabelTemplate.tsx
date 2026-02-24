import { forwardRef } from "react";
import { PrintData } from "@/types/job";
import Image from "next/image";


interface LabelTemplateProps {
  data: PrintData | null,
  size: string | null
}

export const LabelTemplate = forwardRef<HTMLDivElement, LabelTemplateProps>(({ data, size }, ref) => {
  if (!data) return null;
  if (!size) return null;
  const isA4 = data.size === "A4";
  const sizePreview = size === "A4";

  return (
    <div ref={ref} className={`font-sans bg-white text-black ${sizePreview ? "sheet-a4" : "sheet-a5"}`}>
      <div className="p-5 h-full flex flex-col justify-between">
        {/* Header */}
        <div className="bg-green-900 print-header text-white">
          <div className="flex md:flex-row items-stretch">
              {/* LEFT COLUMN - 2/3 */}
              <div className="w-full md:w-3/5">
                <p className="text-md font-bold">
                  Client: <br />
                  <span className="border-b border-white w-full block font-normal text-sm">
                    {data.job?.client}
                  </span>
                </p>

                <p className="text-md mt-5 font-bold">
                  Address: <br />
                  <span className="border-b border-white w-full block font-normal text-sm">
                    {data.job?.location}
                  </span>
                </p>
                <p className="text-md mt-5 font-bold">
                  Despatch Date: <br />
                  <span className="border-b border-white w-full block font-normal text-sm">
                    {new Date().toLocaleDateString()}
                  </span>
                </p>
                <p className="text-md mt-5 font-bold">
                  Logistics: <br />
                  <span className="border-b border-white w-full block font-normal text-sm">
                    {data.driver}
                  </span>
                </p>
              </div>

              {/* RIGHT COLUMN - 1/3 */}
              <div className="text-leading-7 w-full md:w-2/5 text-right uppercase text-white font-black text-4xl md:mt-0 pl-5 flex flex-col justify-between">
                <Image
                  src="/spec-white.png"
                  alt="Spectrum logo"
                  width={170}
                  height={170}
                  className={`print-logo h-auto object-contain block ml-auto`}
                  priority
                />
                <p>Package <br />Slip</p>
              </div>
          </div>
        </div>

        {/* Description */}
        <div className="text-center">
          <p className="mt-5 text-2xl font-bold">{data.desc}</p>
        </div>

        {/* Details Grid */}
        <div className="grow flex flex-col justify-center gap-8 py-8">
          <div className="grid grid-cols-2 gap-4 text-md">
            <p><strong>Job Name:</strong> {data.job?.jobName}</p>
            <p><strong>Invoice No:</strong> {data.job?.invoiceNo}</p>
            <p><strong>Item No:</strong> {data.itemNo}</p>
            <p><strong>Quantity:</strong> {data.qty}</p>
          </div>

          {/* Sequence Badge */}
          <div className="text-center p-6 rounded-xl border-2 border-dashed border-gray-400 h-1/2 flex flex-col justify-center">
            <div>
              <p className="text-md uppercase text-gray-500 mb-2">Package Sequence</p>
              <p className="text-8xl font-black tracking-tighter">
                {data.id} <span className="text-5xl text-gray-400 tracking-tight">/ {data.totalBoxes}</span>
              </p>
            </div>
          </div>

          {/* Remarks */}
          {data.remarks && (
            <div className="bg-yellow-50 p-4 border border-yellow-200 text-sm">
              <p className="font-bold">Remarks:</p>
              <p>{data.remarks}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-green-900 print-footer text-white">
          <p className="font-bold mb-9 text-md">Checked by:</p>
          <div className="flex md:flex-row justify-end">
            <div className="w-full md:w-1/2">
              <p className="text-sm border-t border-white w-3/4">Signature</p>
            </div>
            <div className="w-full md:w-1/2">
              <p className="text-sm border-t border-white w-3/4">Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

LabelTemplate.displayName = "LabelTemplate";