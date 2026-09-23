import { Metadata } from "next";
import ToolClient from "@/components/tool/ToolClient";

export const metadata: Metadata = {
  title: "Download LarpSense NFA Tool | Steam NFA Manager",
  description: "Download the official LarpSense NFA Client for automated, secure authentication. Features native Windows DPAPI encryption and 1-click login.",
  alternates: {
    canonical: "https://www.larpsensestore.com/tool",
  },
  openGraph: {
    title: "Download LarpSense NFA Tool | Steam NFA Manager",
    description: "Official LarpSense desktop client with native Windows DPAPI encryption and instant login.",
    url: "https://www.larpsensestore.com/tool",
    siteName: "LarpSense Store",
  },
};

export default function ToolPage() {
  return <ToolClient />;
}
