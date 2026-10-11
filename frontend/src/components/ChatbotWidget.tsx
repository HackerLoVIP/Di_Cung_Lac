import React, { useState } from 'react';
import axios from 'axios';
import { FaRobot, FaTimes, FaPaperPlane, FaKey, FaCog } from 'react-icons/fa';
import toast from 'react-hot-toast';

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showKeySetting, setShowKeySetting] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: 'Chào bạn! Mình là Trợ lý AI Đi Cùng Lạc kết nối trực tiếp với Google Gemini 2.0 / 1.5 Flash. Bạn có thể hỏi mình bất cứ điều gì về ẩm thực, bãi tắm, chi phí hay mẹo du lịch Vũng Tàu nhé!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setShowKeySetting(false);
    toast.success('Đã lưu Google Gemini API Key!');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chat', {
        message: userMsg,
        province_id: 1,
        api_key: apiKey.trim() || undefined,
      });
      setMessages((prev) => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Xin lỗi, trợ lý AI đang quá tải. Bạn hãy kiểm tra lại kết nối mạng hoặc dán Gemini API Key trong phần cài đặt nhé!' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-2xl shadow-emerald-400/50 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
          title="Trợ lý AI Gemini Đi Cùng Lạc"
        >
          <FaRobot className="text-2xl" />
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-80 sm:w-96 flex flex-col h-[520px] overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <FaRobot />
              </div>
              <div>
                <h3 className="font-bold text-sm">Đi Cùng Lạc AI (Gemini)</h3>
                <span className="text-[10px] text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Google GenAI Realtime
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowKeySetting(!showKeySetting)}
                title="Cài đặt Gemini API Key"
                className="text-white/80 hover:text-white p-1 text-xs"
              >
                <FaCog />
              </button>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1">
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Key Setting Panel */}
          {showKeySetting && (
            <div className="bg-slate-100 p-3 border-b border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-1 font-bold text-slate-700">
                <FaKey className="text-amber-500" /> Cấu hình Google Gemini API Key:
              </div>
              <p className="text-[11px] text-slate-500">
                Lấy key miễn phí tại <b>aistudio.google.com</b> để kích hoạt trí tuệ nhân tạo Gemini 2.0 / 1.5 Flash thật 100%.
              </p>
              <form onSubmit={handleSaveKey} className="flex gap-2">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                >
                  Lưu
                </button>
              </form>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 text-slate-400 italic text-[11px] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Gemini AI đang phân tích dữ liệu và suy nghĩ câu trả lời...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi AI về món ăn, bãi tắm, chi phí..."
              className="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <FaPaperPlane className="text-xs" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
