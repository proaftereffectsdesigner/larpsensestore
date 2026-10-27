"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';

interface ChatMessage {
  sender: 'user' | 'admin';
  content: string;
  author?: string;
  authorAvatar?: string | null;
  attachments?: string[];
}

interface TicketChatProps {
  sessionId: string;
  initialMessage?: string;
  initialAttachments?: string[];
  onCloseTicket: () => void;
  userAvatar?: string | null;
  userName?: string;
  isTicketClosed?: boolean;
  onTicketClosedRemotely?: () => void;
}

export default function TicketChat({ sessionId, initialMessage, initialAttachments, onCloseTicket, userAvatar, userName = 'User', isTicketClosed = false, onTicketClosedRemotely }: TicketChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const initialMessageSentRef = useRef(false);
  const [ticketInfo, setTicketInfo] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch ticket details for the top info box
  useEffect(() => {
    const fetchTicket = async () => {
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('ticket_number', parseInt(sessionId))
        .single();
      if (data) {
        setTicketInfo(data);
      }
    };
    fetchTicket();
  }, [sessionId]);

  const parsedTicketInfo = React.useMemo(() => {
    if (!ticketInfo) return null;
    
    let text = ticketInfo.description || '';
    let paymentMethod = null;
    let transactionId = null;
    
    const lines = text.split('\n');
    const newLines = [];
    
    for (const line of lines) {
      if (line.startsWith('Transaction ID: ')) {
        transactionId = line.replace('Transaction ID: ', '');
      } else if (line.startsWith('Payment Method: ')) {
        paymentMethod = line.replace('Payment Method: ', '');
      } else {
        newLines.push(line);
      }
    }
    
    return {
      ...ticketInfo,
      paymentMethod,
      transactionId,
      description: newLines.join('\n').trim()
    };
  }, [ticketInfo]);

  // Connect to WebSocket
  useEffect(() => {
    if (!sessionId || isTicketClosed) return;

    let isUnmounted = false;
    let reconnectTimeout: any = null;

    const connectWs = async () => {
      if (isUnmounted || ws.current) return;

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      
      if (!token) {
        console.warn('Waiting for session token before connecting to Ticket Chat WS...');
        reconnectTimeout = setTimeout(connectWs, 2000);
        return;
      }

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://larpsense-bot.onrender.com';
      console.log(`Connecting to Ticket Chat WS: ${wsUrl}/ws/chat/${sessionId}`);
      const socket = new WebSocket(`${wsUrl}/ws/chat/${sessionId}?token=${token}`);
      
      socket.onopen = () => {
        if (isUnmounted) {
          socket.close();
          return;
        }
        setIsConnected(true);
        console.log('Connected to Ticket Chat');
        
        // If we have an initial message from the form and haven't sent it yet, send it once
        if (!initialMessageSentRef.current && (initialMessage || (initialAttachments && initialAttachments.length > 0))) {
          initialMessageSentRef.current = true;
          socket.send(JSON.stringify({ 
            sender: 'user',
            author: userName,
            content: initialMessage || '', 
            attachments: initialAttachments || [] 
          }));
        }
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.sender === 'system' && data.content === 'TICKET_CLOSED') {
            if (onTicketClosedRemotely) {
              onTicketClosedRemotely();
            }
            return;
          }
          
          setMessages(prev => {
            // Merge late-loading embeds from Discord (on_message_edit)
            if (data.sender === 'admin' && data.content === '' && data.attachments && data.attachments.length > 0) {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.sender === 'admin' && lastMsg.author === data.author) {
                const updatedLast = {
                  ...lastMsg,
                  attachments: [...(lastMsg.attachments || []), ...data.attachments]
                };
                return [...prev.slice(0, -1), updatedLast];
              }
            }
            return [...prev, data];
          });

          // Clear unread flag if receiving message while chat is open
          const ticketNum = parseInt(sessionId);
          if (!isNaN(ticketNum)) {
            supabase.from('tickets').update({ has_unread: false }).eq('ticket_number', ticketNum).then();
          }
        } catch (e) {
          console.error("Error parsing message", e);
        }
      };
      
      socket.onclose = (event) => {
        console.log('Ticket Chat WS closed', event.code, event.reason);
        if (ws.current === socket) {
          setIsConnected(false);
          ws.current = null;
        }
        // Auto-reconnect after 3 seconds if not unmounted and ticket is still open
        if (!isUnmounted && !isTicketClosed) {
          reconnectTimeout = setTimeout(connectWs, 3000);
        }
      };

      socket.onerror = (err) => {
        console.error('Ticket Chat WS error:', err);
      };
      
      ws.current = socket;
      
      // Clear unread flag on open
      const ticketNum = parseInt(sessionId);
      if (!isNaN(ticketNum)) {
        supabase.from('tickets').update({ has_unread: false }).eq('ticket_number', ticketNum).then();
      }
    };

    connectWs();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [sessionId, isTicketClosed]);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !ws.current || !isConnected) return;

    const newMsg: ChatMessage = { sender: 'user', content: inputValue, author: userName };
    
    setMessages(prev => [...prev, newMsg]);
    ws.current.send(JSON.stringify(newMsg));
    setInputValue('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ws.current || !isConnected) return;
    
    // Discord has an 8MB limit for standard free accounts. 
    // Sending too large files over WS crashes the Python bot.
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File is too large! Maximum size is 8MB.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      
      const newMsg: ChatMessage = { 
        sender: 'user', 
        content: '', 
        author: userName,
        attachments: [base64Data] 
      };
      
      setMessages(prev => [...prev, newMsg]);
      
      ws.current?.send(JSON.stringify({
        sender: 'user',
        author: userName,
        image_base64: base64Data
      }));
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full h-[85vh] min-h-[750px] max-w-4xl mx-auto bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden flex flex-col shadow-none">
      
      {/* Lightbox for enlarged images */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="Enlarged" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        </div>
      )}

      {/* Close Confirmation Modal */}
      {showCloseConfirm && (
        <div className="absolute inset-0 bg-[#000000]/95 z-[110] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#262626] p-6 max-w-sm w-full shadow-none animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-[#ff3333] mb-3 uppercase tracking-widest border-b border-[#262626] pb-3">
              [ Close Ticket ]
            </h3>
            <p className="text-[#f5f5f7]/70 text-sm mb-8 leading-relaxed">
              Are you sure you want to close this ticket? You won't be able to continue the conversation.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="px-5 py-2.5 bg-[#0a0a0a] border border-[#262626] hover:bg-[#141414] text-[#f5f5f7] text-xs uppercase tracking-wider font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCloseConfirm(false);
                  onCloseTicket();
                }}
                className="px-5 py-2.5 bg-[#0a0a0a] border border-[#ff3333] text-[#ff3333] hover:bg-[#ff3333] hover:text-black text-xs uppercase tracking-wider font-bold transition-colors"
              >
                Confirm Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 bg-[#0a0a0a] border-b border-[#262626] p-4 sm:p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-accent' : 'bg-red-500'}`}></span>
            Live Support Ticket
          </h2>
          <p className="text-sm text-gray-400 mt-1">Ticket ID: #{sessionId}</p>
        </div>
        {!isTicketClosed && (
          <button 
            onClick={() => setShowCloseConfirm(true)}
            className="bg-[#0a0a0a] hover:bg-[#1a0a0a] text-[#ff3333] border border-[#ff3333] rounded-xl px-4 py-2 transition-colors text-sm font-bold flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Close Ticket
          </button>
        )}
      </div>
      
      {/* Scrollable chat area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar"
      >
        {parsedTicketInfo && (
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 sm:p-6 text-sm">
            <h3 className="font-bold text-[#f5f5f7] mb-4 text-base">Ticket Information</h3>
            <div className="grid grid-cols-2 gap-4 text-gray-300">
              <div>
                <span className="text-[#f5f5f7]/50 uppercase tracking-wider text-[10px] font-bold block mb-1">Issue Type</span>
                {parsedTicketInfo.issue_type.replace(/_/g, ' ')}
              </div>
              <div>
                <span className="text-[#f5f5f7]/50 uppercase tracking-wider text-[10px] font-bold block mb-1">Created At</span>
                {new Date(parsedTicketInfo.created_at).toLocaleString()}
              </div>
              {parsedTicketInfo.order_id && (
                <div className="col-span-2">
                  <span className="text-[#f5f5f7]/50 uppercase tracking-wider text-[10px] font-bold block mb-1">Order</span>
                  Order #{parsedTicketInfo.order_id.split('-')[0]}
                </div>
              )}
              {parsedTicketInfo.transactionId && (
                <div>
                  <span className="text-[#f5f5f7]/50 uppercase tracking-wider text-[10px] font-bold block mb-1">Transaction ID</span>
                  {parsedTicketInfo.transactionId}
                </div>
              )}
              {parsedTicketInfo.paymentMethod && (
                <div>
                  <span className="text-[#f5f5f7]/50 uppercase tracking-wider text-[10px] font-bold block mb-1">Payment Method</span>
                  {parsedTicketInfo.paymentMethod}
                </div>
              )}
              <div className="col-span-2 mt-2 min-w-0">
                <span className="text-[#f5f5f7]/50 uppercase tracking-wider text-[10px] font-bold block mb-1">Description</span>
                <p className="whitespace-pre-wrap break-words break-all text-[#f5f5f7]">{parsedTicketInfo.description}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center text-xs text-[#f5f5f7]/50 my-6">
          Your ticket has been submitted! An admin will reply shortly.<br/>
          You can safely leave this page – the chat will remain active in this tab.
        </div>
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] min-w-0 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className="shrink-0 pt-1">
                {msg.sender === 'user' ? (
                   userAvatar ? (
                     <img src={userAvatar} alt="User" className="w-8 h-8 rounded-full object-cover border border-[#262626]" />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#262626] flex items-center justify-center">
                       <span className="text-accent text-xs font-bold">{userName.charAt(0).toUpperCase()}</span>
                     </div>
                   )
                ) : (
                   msg.authorAvatar ? (
                     <img src={msg.authorAvatar} alt={msg.author || "Admin"} className="w-8 h-8 rounded-full object-cover border border-[#262626]" />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#262626] flex items-center justify-center">
                       <span className="text-[#f5f5f7]/50 text-xs font-bold">A</span>
                     </div>
                   )
                )}
              </div>

              {/* Message Content */}
              <div className="flex flex-col min-w-0">
                {msg.sender === 'admin' && msg.author && (
                  <span className="text-xs text-[#f5f5f7]/50 mb-1 ml-1 font-medium">{msg.author}</span>
                )}
                <div 
                  className={`p-4 rounded-xl text-sm leading-relaxed break-words break-all ${
                    msg.sender === 'user' 
                      ? 'bg-accent text-black rounded-tr-sm' 
                      : 'bg-[#141414] text-[#f5f5f7] border border-[#262626] rounded-tl-sm'
                  }`}
                >
                  {!(msg.content.trim().startsWith('http') && !msg.content.trim().includes(' ') && msg.attachments && msg.attachments.length > 0) && (
                    <span>{msg.content}</span>
                  )}
                  
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      {msg.attachments.map((url, idx) => {
                        const isImage = url.startsWith('data:image/') || url.match(/\.(jpeg|jpg|gif|png|webp)(\?|$)/i) || url.includes('tenor.com/') || url.includes('klipy.com/');
                        const isVideo = url.startsWith('data:video/') || url.match(/\.(mp4|webm|mov)(\?|$)/i);
                        const isAudio = url.startsWith('data:audio/') || url.match(/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i);
                        
                        if (isImage) {
                          return (
                            <img 
                              key={idx} 
                              src={url} 
                              alt="Attachment" 
                              className="max-w-full h-auto rounded-xl border border-white/10 object-contain max-h-64 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedImage(url)}
                              onLoad={scrollToBottom}
                            />
                          );
                        } else if (isVideo) {
                          return (
                            <video
                              key={idx}
                              src={url}
                              controls
                              className="max-w-full h-auto rounded-xl border border-white/10 max-h-64"
                              onLoadedData={scrollToBottom}
                            />
                          );
                        } else if (isAudio) {
                          return (
                            <audio
                              key={idx}
                              src={url}
                              controls
                              className="max-w-full rounded-xl border border-white/10"
                            />
                          );
                        } else {
                          return (
                            <a key={idx} href={url} download="attachment" target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                              <span className="text-sm font-medium truncate">Download File</span>
                            </a>
                          );
                        }
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {isTicketClosed && (
        <div className="w-full text-center py-3 bg-[#0a0a0a] border-t border-[#262626] z-10">
          <div className="inline-block bg-[#1a0a0a] border border-[#ff3333] text-[#ff3333] px-4 py-2 rounded-xl text-sm font-bold">
            🔒 This ticket has been closed by an admin.
          </div>
        </div>
      )}
      
      {/* Input area */}
      <div className="p-4 bg-[#0a0a0a] border-t border-[#262626]">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isTicketClosed}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isTicketClosed}
            className="p-3 text-[#f5f5f7]/50 hover:text-[#f5f5f7] hover:bg-[#141414] rounded-xl transition-colors shrink-0 disabled:opacity-50"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTicketClosed}
            placeholder={isTicketClosed ? "Ticket closed..." : "Type your message here..."}
            className="flex-1 bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || !isConnected || isTicketClosed}
            className="px-6 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/80 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
          >
            Send <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
