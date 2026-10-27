"use client";
import { Package, Download, Terminal } from "lucide-react";
import { useEffect, useState, useRef } from "react";

export default function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -150px 0px' }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      icon: <Package className="w-6 h-6 text-emerald-500" />,
      title: "1. Get Your Account",
      description: "Instant delivery of your secure account file right after the payment clears."
    },
    {
      icon: <Download className="w-6 h-6 text-emerald-500" />,
      title: "2. Download Client",
      description: "Get our proprietary LarpSense NFA Tool directly from your user dashboard."
    },
    {
      icon: <Terminal className="w-6 h-6 text-emerald-500" />,
      title: "3. Quick Launch",
      description: "Launch the tool, drag & drop your account file, and jump straight into matchmaking in seconds."
    }
  ];

  return (
    <section ref={containerRef} className="w-full max-w-7xl mx-auto py-24 px-4 border-t border-white/5">
      <div className={`text-center mb-16 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it Works</h2>
        <p className="text-gray-400 font-medium">Three steps to seamless matchmaking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`flex flex-col items-start p-8 bg-[#111111] rounded-[24px] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ transitionDelay: `${isVisible ? 100 + index * 100 : 0}ms`, transitionDuration: '1000ms' }}
          >
            <div className="mb-6">
              {step.icon}
            </div>
            <h3 className="text-white font-semibold text-[20px] tracking-tight mb-2">{step.title}</h3>
            <p className="text-[#f5f5f7]/60 text-[15px] leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
