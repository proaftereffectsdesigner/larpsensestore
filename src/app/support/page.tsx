
import ParticlesBackground from "@/components/ParticlesBackground";
import TicketForm from "@/components/TicketForm";
import { Mail, MessageSquare } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-4 sm:p-8">
      <ParticlesBackground />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="relative z-10 w-full max-w-4xl mt-12 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <TicketForm />
      </div>
    </div>
  );
}
