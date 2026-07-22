import ProductTable from "@/components/ProductTable";
import ParticlesBackground from "@/components/ParticlesBackground";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-10">
      <ParticlesBackground />
      <ProductTable />
    </div>
  );
}
