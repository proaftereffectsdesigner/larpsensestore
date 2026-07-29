"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
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

  const faqs = [
    {
      question: "What is an NFA Account?",
      answer: "Non-Full Access accounts are high-quality, hand-verified profiles perfect for immediate matchmaking. While you don't own the original email, our token system ensures seamless and secure access."
    },
    {
      question: "How do I log into the purchased account?",
      answer: "Logging in is entirely automated through our proprietary LarpSense NFA Tool. Simply download the tool from your dashboard, drag and drop your token file into the client, and it will securely launch the game for you. It is 100% safe and bypasses the need for manual password entry."
    },
    {
      question: "How does the 6-hour warranty work?",
      answer: "If your token expires or the account is inaccessible within 6 hours of purchase, please contact support for a diagnostic. If we verify that the issue is on our end, we will provide a 1:1 replacement. Please note this covers initial access and delivery, but does not cover bans resulting from user actions."
    },
    {
      question: "Is my main Steam account safe?",
      answer: "Absolutely. Our desktop client uses native Windows DPAPI encryption to secure your session data locally. The environment is heavily isolated from your main HWID and registry traces."
    },
    {
      question: "Are these accounts VAC clean?",
      answer: "Every account is hand-verified before dispatch. While we maintain a highly undetectable environment and test our systems daily, we cannot guarantee immunity from future bans once the account is in your possession. We do not offer refunds if a ban occurs outside of our control."
    }
  ];

  return (
    <section ref={containerRef} className="w-full max-w-3xl mx-auto py-24 px-4">
      <div className={`text-center mb-16 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        <p className="text-gray-400 font-medium">Everything you need to know about our NFA system.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'bg-[#0f0f0f] border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]' : 'bg-[#0a0a0a] hover:bg-[#0c0c0c] hover:border-white/10'} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ transitionDelay: `${isVisible ? 100 + index * 100 : 0}ms`, transitionDuration: '500ms' }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
            >
              <span className={`font-bold text-sm md:text-base transition-colors ${openIndex === index ? 'text-white' : 'text-gray-300'}`}>
                {faq.question}
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-emerald-500' : ''}`} />
            </button>
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="px-6 pb-6 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4 mt-2">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
