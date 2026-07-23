import { Globe2 } from "lucide-react";

export default function CountryStats({ data }: { data: any }) {
  if (!data) return null;

  const topCountries = data?.advanced?.topCountries;

  if (!topCountries) return null;

  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Globe2 className="w-5 h-5 text-gray-400" /> Top Countries
      </h3>
      <div className="flex-1 flex flex-col gap-4 justify-center">
        {topCountries.map((country: any, idx: number) => (
          <div key={idx} className="flex items-center gap-4">
            <span className="text-2xl" title={country.name}>{country.code}</span>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300 font-bold">{country.name}</span>
                <span className="text-white font-mono">{country.percent}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div 
                  className="bg-accent h-2 rounded-full" 
                  style={{ width: `${country.percent}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
