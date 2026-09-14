import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, Smile, FileText, Download } from 'lucide-react';
import type { ChatMessage } from '../types';

export interface ChatPanelProps {
  isOpen: boolean;
  messages: ChatMessage[];
  chatEnabled: boolean;
  localRole: 'host' | 'co-host' | 'participant';
  onSendMessage: (content: string, type?: 'text' | 'file', fileUrl?: string, fileName?: string) => void;
  onClose: () => void;
  localPeerId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  messages,
  chatEnabled,
  localRole,
  onSendMessage,
  onClose,
  localPeerId
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emojis = ['👍', '👋', '🎉', '😂', '🔥', '👀', '💯', '🙏'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const canChat = chatEnabled || localRole === 'host' || localRole === 'co-host';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canChat) return;
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
      setShowEmoji(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canChat) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Max size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onSendMessage(file.name, 'file', base64, file.name);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 z-50 w-80 lg:w-96 bg-surface-light/95 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl pb-20 md:pb-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-surface/50">
            <h2 className="text-lg font-semibold text-white">Chat</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/50 space-y-2">
                <p>No messages yet.</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                // System message
                if (msg.type === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <span className="bg-white/5 px-3 py-1 rounded-full text-xs text-slate-400 italic">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                const isLocal = msg.userId === localPeerId;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isLocal ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-baseline gap-2 mb-1 px-1">
                      <span className="text-xs font-medium text-white/70">
                        {isLocal ? 'You' : msg.userName}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm text-white shadow-sm overflow-hidden ${
                        isLocal
                          ? 'bg-primary rounded-tr-sm'
                          : 'bg-surface-lighter rounded-tl-sm border border-white/5'
                      }`}
                    >
                      {msg.type === 'file' ? (
                        <div className="flex flex-col gap-2">
                          {msg.fileUrl?.startsWith('data:image') ? (
                            <img src={msg.fileUrl} alt={msg.fileName} className="rounded-lg max-w-full max-h-48 object-cover" />
                          ) : (
                            <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg">
                              <FileText className="w-8 h-8 text-white/70" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs truncate">{msg.fileName}</p>
                              </div>
                            </div>
                          )}
                          <a 
                            href={msg.fileUrl} 
                            download={msg.fileName}
                            className="flex items-center justify-center gap-1 mt-1 text-xs bg-white/10 hover:bg-white/20 py-1.5 rounded-lg transition-colors"
                          >
                            <Download className="w-3 h-3" /> Download
                          </a>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Emoji Picker Popover */}
          <AnimatePresence>
            {showEmoji && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-[72px] right-4 bg-surface-lighter border border-white/10 p-2 rounded-xl shadow-xl flex gap-1 z-10"
              >
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setInputText((prev) => prev + emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="p-4 bg-surface/50 border-t border-white/10">
            {!canChat ? (
              <div className="text-center py-2 bg-surface-lighter rounded-xl border border-white/5">
                <p className="text-sm text-slate-400">The host has disabled chat.</p>
              </div>
            ) : (
              <form onSubmit={handleSend} className="relative flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-surface-lighter border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-full bg-primary hover:bg-primary-light text-white disabled:bg-surface-lighter disabled:text-white/30 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
