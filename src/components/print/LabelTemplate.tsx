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
      <div className="p-4 h-full flex flex-col justify-between">
        <div className="border-b border-dotted border-black flex flex-row items-stretch">
          <div className="w-2/3">
            <div className="bg-green-900 py-3 text-white mb-4 flower-bg">
              <Image
                src="/spec-white.png"
                alt="Spectrum logo"
                width={87}
                height={87}
                className={`h-auto object-contain block mx-auto`}
                priority
                unoptimized
              />
            </div>
            <div className="leading-none">
              <div className="border-black border-b border-dotted pb-2">
                <p className="text-xl">Client: <span className="uppercase text-3xl font-bold">{data.job?.client}</span></p>
                <p className="text-xl">Invoice No: {data.job?.invoiceNo}</p>
              </div>
              <div className="border-black border-b border-dotted py-2">
                <p className="text-xl">Job name: <span className="uppercase text-xl font-bold">{data.job?.jobName}</span></p>
              </div>
              <div className="border-black border-b border-dotted py-2 flex flex-row items-stretch pr-5">
                <p className="text-xl w-full">Address/Delivery to: <span className="uppercase text-xl font-bold"><br />{data.job?.location}</span></p>
                <p className="text-xl pr-3">Contact No: {data.job?.contactNo || "N/A"}</p>
              </div>
              <div className="border-black py-2 flex flex-row items-stretch pr-5">
                <p className="text-xl pr-3">Package/Item description: </p>
                <p className="text-3xl font-bold w-full">{data.desc}</p>
              </div>
            </div>
          </div>
          <div className="w-1/3 border-black border-l border-dotted">
            <div className="border-black border-b border-dotted pl-3 pb-1">
              <p className="m-0">Quantity:</p>
              <p className="text-center text-5xl pb-3 font-bold">{data.qty} / {data.totalQuantity}</p>
            </div>
            <div className="pl-3 pt-1">
              <p className="m-0">No. of Boxes</p>
              <p className="text-center text-6xl">
                <span className="pt-2 block font-bold">{data.id}</span>
                <span className="block py-5 text-4xl">of</span>
                <span className="block font-bold">{data.totalBoxes}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-row items-stretch py-3">
          <div>
            <Image
              src="/productcare.png"
              alt="product care"
              width={220}
              height={220}
              className={`h-auto object-contain`}
              priority
              unoptimized
            />
          </div>
          <div className="pl-4">
            <p className="text-[8px] mb-1 leading-none">
              Spectrum Sustainable Printing Solutions is committed to sustainable printing practices and values respect for people, tradition and the environment. Our papers are ECF FSC™-certified (FSC™ C018501) and all of our printing material contains paper from the finest paper mills around the world.
            </p>
            <p className="text-[8px] mb-1 leading-none">
              To ensure the quality of our sustainable printing products, such as books, packaging, boxes, and hard case covers, it is important to store them at room temperature of 20°C. The materials must be kept in a dry environment with a relative humidity of 60% and should not be exposed to direct sunlight or heat.
            </p>
            <p className="text-[8px] mb-1 leading-none">
              Please be aware that customized sustainable printing products may be more sensitive to temperature and humidity variations. As such, it is the responsibility of the customer to ensure proper storage and handling during transportation, as we cannot be held responsible for any damage that may occur during international or local transportation. </p>
            <p className="text-[8px] mb-1 leading-none">
              Level B1, The Gate, P.O. Box 482043, DIFC, Dubai, UAE | Tel.: +971 4 362 0566 | E-mail: info@spectrumdubai.com | www.spectrumdubai.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

LabelTemplate.displayName = "LabelTemplate";