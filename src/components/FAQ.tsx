"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ({ hideTitle = false }: { hideTitle?: boolean }) {
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
      question: "What do we sell?",
      answer: "We sell a variety of high-quality, hand-verified NFA accounts perfect for immediate gameplay. Our automated system provides seamless and secure access through isolated environments."
    },
    {
      question: "How long does delivery take?",
      answer: "Delivery is completely automated. Your account will be available in your dashboard instantly after your payment is confirmed."
    },
    {
      question: "Can I change the account details (email/password)?",
      answer: "No, these are NFA accounts. You cannot change the email, password, or any other account details."
    },
    {
      question: "How do I log into the purchased account?",
      answer: "Logging in is entirely automated through our proprietary LarpSense NFA Tool. Simply download the client from your dashboard, drag and drop your account file into it, and it will securely launch the game for you. It simplifies the authentication process and ensures maximum reliability."
    },
    {
      question: "Do I need any extra software to use the account?",
      answer: "Yes, you need a launcher to handle the account file. You can use our lightweight LarpSense NFA Tool (available in your dashboard) or any other trusted alternative available on the internet."
    },
    {
      question: "Are these accounts Verified & Match-Ready?",
      answer: "Yes, every account is hand-verified and ready for matchmaking before it's delivered. Please note that after delivery, any in-game restrictions or bans caused by your actions are out of our control and non-refundable."
    },
    {
      question: "How does the 6-hour warranty work?",
      answer: "If your account expires or the environment is inaccessible within 6 hours of purchase, please contact support for a diagnostic. If we verify that the issue is on our end, we will provide a 1:1 replacement. Please note this covers initial access and delivery, but does not cover restrictions resulting from user actions."
    },
    {
      question: "Is my primary software environment safe?",
      answer: "Absolutely. Our client uses native Windows DPAPI encryption to secure your session data locally. The environment is heavily isolated from your primary operating system."
    }
  ];

  return (
    <section ref={containerRef} className="w-full max-w-3xl mx-auto py-12 px-4">
      {!hideTitle && (
        <div className={`text-center mb-16 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
          <h2 className="text-2xl md:text-3xl font-black text-[#f5f5f7] mb-4 uppercase tracking-widest">[ FAQ ]</h2>
          <p className="text-[#f5f5f7]/50 text-xs tracking-widest uppercase">Everything you need to know about our NFA system.</p>
        </div>
      )}

      <div className="space-y-0">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`border-b border-[#262626] transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${isVisible ? index * 50 : 0}ms`, transitionDuration: '500ms' }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full py-6 flex items-center justify-between text-left focus:outline-none"
            >
              <span className={`font-bold text-xs uppercase tracking-widest transition-colors ${openIndex === index ? 'text-accent' : 'text-[#f5f5f7]/80 hover:text-[#f5f5f7]'}`}>
                {faq.question}
              </span>
              <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-accent' : 'text-[#f5f5f7]/30'}`} />
            </button>
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="pb-6 text-[#f5f5f7]/50 text-sm leading-relaxed pr-8">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
