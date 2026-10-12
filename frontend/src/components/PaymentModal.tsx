import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { paymentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  FaCrown,
  FaCheckCircle,
  FaCopy,
  FaSpinner,
  FaQrcode,
  FaShieldAlt,
  FaBolt,
  FaFlask
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface OrderData {
  order_code: string;
  amount: number;
  plan_name: string;
  bank_name: string;
  account_no: string;
  account_name: string;
  transfer_content: string;
  qr_url: string;
  status: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, login } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('vip_1month');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setOrder(null);
    }
  }, [isOpen]);

  // Polling kiem tra thanh toan moi 3 giay khi co order pending
  useEffect(() => {
    if (!order || order.status === 'completed') return;

    const interval = setInterval(async () => {
      try {
        const res = await paymentAPI.checkStatus(order.order_code);
        if (res.is_paid) {
          toast.success('🎉 Thanh toán thành công! Bạn đã là thành viên VIP Travel Pro');
          setOrder((prev) => (prev ? { ...prev, status: 'completed' } : null));
          clearInterval(interval);
          if (onSuccess) onSuccess();
        }
      } catch {
        // Bo qua loi tam thoi
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [order, onSuccess]);

  if (!isOpen) return null;

  const handleCreateOrder = async (planType: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập tài khoản trước khi thanh toán và nâng cấp gói VIP!', {
        icon: '🔒',
        duration: 4000
      });
      return;
    }

    setSelectedPlan(planType);
    setLoading(true);
    try {
      const data = await paymentAPI.createOrder(planType);
      setOrder(data);
      toast.success('Đã tạo mã QR thanh toán SePay thành công!');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Không thể tạo đơn hàng thanh toán';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Khoa scroll cua trang khi modal mo
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-amber-200/90 relative z-[1000000] flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-amber-100 pb-3.5 mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-300 text-amber-950 flex items-center justify-center text-xl shadow-xs shrink-0">
              <FaCrown />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">Nâng Cấp Gói VIP Travel Pro</h3>
              <p className="text-xs text-slate-500 mt-0.5">Mở khóa toàn bộ sức mạnh AI, quản lý chi tiêu & bản đồ không giới hạn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center font-bold text-sm cursor-pointer transition shrink-0"
            title="Đóng popup"
          >
            ✕
          </button>
        </div>

        {/* Modal Body with smooth internal scroll */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* Canh bao neu chua dang nhap */}
          {!user && (
            <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="text-amber-950 font-medium">
                ⚠️ Bạn chưa đăng nhập. Vui lòng đăng nhập để hệ thống tự động kích hoạt VIP cho tài khoản của bạn ngay khi thanh toán xong!
              </div>
              <a
                href="/login"
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black rounded-xl whitespace-nowrap shadow-xs text-center self-end sm:self-auto cursor-pointer"
              >
                Đăng nhập ngay
              </a>
            </div>
          )}

        {/* Step 1: Chon goi nang cap (khi chua tao order) */}
        {!order && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
              {/* Goi 7 ngay */}
              <button
                type="button"
                onClick={() => setSelectedPlan('vip_trial')}
                className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all text-center space-y-2 relative flex flex-col items-center justify-between ${
                  selectedPlan === 'vip_trial'
                    ? 'border-amber-500 bg-amber-50/90 ring-4 ring-amber-300/60 shadow-lg scale-102'
                    : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trải nghiệm</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'vip_trial' ? 'border-amber-600 bg-amber-500' : 'border-slate-300'}`}>
                    {selectedPlan === 'vip_trial' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="py-2">
                  <p className="text-base font-black text-slate-900">7 Ngày</p>
                  <p className="text-lg font-black text-amber-900 mt-0.5">19.000 đ</p>
                </div>
              </button>

              {/* Goi 30 ngay */}
              <button
                type="button"
                onClick={() => setSelectedPlan('vip_1month')}
                className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all text-center space-y-2 relative flex flex-col items-center justify-between ${
                  selectedPlan === 'vip_1month'
                    ? 'border-amber-500 bg-amber-50/90 ring-4 ring-amber-300/60 shadow-lg scale-102'
                    : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 bg-white'
                }`}
              >
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-black bg-amber-400 text-amber-950 px-3 py-0.5 rounded-full shadow-md border border-amber-300 z-10 whitespace-nowrap">
                  Phổ biến nhất 🔥
                </span>
                <div className="flex items-center justify-between w-full pt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phượt thủ</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'vip_1month' ? 'border-amber-600 bg-amber-500' : 'border-slate-300'}`}>
                    {selectedPlan === 'vip_1month' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="py-2">
                  <p className="text-base font-black text-slate-900">1 Tháng</p>
                  <p className="text-lg font-black text-amber-900 mt-0.5">49.000 đ</p>
                </div>
              </button>

              {/* Goi tron doi */}
              <button
                type="button"
                onClick={() => setSelectedPlan('vip_lifetime')}
                className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all text-center space-y-2 relative flex flex-col items-center justify-between ${
                  selectedPlan === 'vip_lifetime'
                    ? 'border-amber-500 bg-amber-50/90 ring-4 ring-amber-300/60 shadow-lg scale-102'
                    : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trọn đời</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'vip_lifetime' ? 'border-amber-600 bg-amber-500' : 'border-slate-300'}`}>
                    {selectedPlan === 'vip_lifetime' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="py-2">
                  <p className="text-base font-black text-slate-900">Vĩnh viễn</p>
                  <p className="text-lg font-black text-amber-900 mt-0.5">149.000 đ</p>
                </div>
              </button>
            </div>

            {/* Quyen loi VIP */}
            <div className="pastel-card p-5 rounded-2xl border border-amber-200/80 space-y-3 text-xs sm:text-sm">
              <p className="font-black text-slate-800 text-xs uppercase tracking-wider text-amber-900 flex items-center gap-2">
                <FaBolt className="text-amber-500 text-sm" /> Đặc quyền độc quyền của thành viên VIP:
              </p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-center gap-2.5">
                  <FaCheckCircle className="text-emerald-500 flex-shrink-0 text-base" />
                  <span>AI tạo lịch trình dài ngày không giới hạn & đề xuất ẩm thực sâu sát thực tế</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <FaCheckCircle className="text-emerald-500 flex-shrink-0 text-base" />
                  <span>Tự động tính toán & tối ưu hóa cung đường Google Maps thông minh nhất</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <FaCheckCircle className="text-emerald-500 flex-shrink-0 text-base" />
                  <span>Quản lý sổ tay chi tiêu nhóm, xuất file PDF & Lịch trình Offline</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <FaCheckCircle className="text-emerald-500 flex-shrink-0 text-base" />
                  <span>Huy hiệu <b>VIP Gold</b> cạnh tên tài khoản trên toàn bộ chuyến đi</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCreateOrder(selectedPlan)}
              disabled={loading}
              className="w-full pastel-yellow-btn py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? <FaSpinner className="animate-spin text-lg" /> : <FaQrcode className="text-lg" />}
              Tạo mã QR SePay & Thanh toán ngay
            </button>
          </div>
        )}

        {/* Step 2: Hien thi Ma QR SePay VietQR & Thong tin chuyen khoan */}
        {order && order.status !== 'completed' && (
          <div className="space-y-4">
            {/* 2-column grid: Left is QR Code, Right is Payment Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              {/* Left Column: QR Code */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
                <div className="w-48 h-48 sm:w-52 sm:h-52 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                  <img
                    src={order.qr_url}
                    alt="SePay VietQR Code"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 text-center font-medium">
                  <FaSpinner className="animate-spin text-amber-500 text-xs shrink-0" />
                  <span>Hệ thống đang tự động lắng nghe giao dịch SePay...</span>
                </div>
              </div>

              {/* Right Column: Order & Bank details */}
              <div className="space-y-3 text-xs">
                {/* Banner thong tin goi */}
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Gói đã chọn</span>
                  <p className="text-base font-black text-slate-900">{order.plan_name}</p>
                  <p className="text-xl font-black text-amber-900">{order.amount.toLocaleString('vi-VN')} VNĐ</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <span className="font-bold text-slate-800">{order.bank_name}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{order.account_no}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(order.account_no, 'Số tài khoản')}
                        className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md"
                      >
                        <FaCopy /> {copiedField === 'Số tài khoản' ? 'Đã chép' : 'Chép'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-300">
                    <span className="text-amber-800 font-medium">Nội dung CK:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-950 font-mono text-sm">{order.transfer_content}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(order.transfer_content, 'Nội dung chuyển khoản')}
                        className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded-md"
                      >
                        <FaCopy /> {copiedField === 'Nội dung chuyển khoản' ? 'Đã chép' : 'Chép'}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic text-center">
                  * Quét mã QR trên app ngân hàng để thanh toán nhanh. Sau khi chuyển, hệ thống sẽ kích hoạt VIP trong 3 - 5 giây!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Da thanh toan thanh cong */}
        {order && order.status === 'completed' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
              <FaCheckCircle />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900">Kích Hoạt VIP Thành Công!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Tài khoản của bạn đã được nâng cấp lên <b>VIP Travel Pro</b>. Hãy tận hưởng các tính năng du lịch cao cấp!
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-black text-white font-bold py-3 px-8 rounded-2xl text-xs transition cursor-pointer"
            >
              Bắt đầu trải nghiệm ngay
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

