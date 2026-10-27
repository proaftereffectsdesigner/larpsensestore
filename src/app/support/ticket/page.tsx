import { Suspense } from "react";
import TicketForm from "@/components/TicketForm";

export default function TicketPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 sm:p-8 bg-[#050505]">
      <div className="w-full max-w-4xl mt-24 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Suspense fallback={<div className="w-full flex justify-center items-center h-[600px]"><div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" /></div>}>
          <TicketForm />
        </Suspense>
      </div>
    </div>
  );
}
