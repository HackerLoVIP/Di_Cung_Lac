import React, { useState, useEffect } from 'react';
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-amber-200/80 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-amber-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-300 text-amber-950 flex items-center justify-center text-lg shadow-2xs">
              <FaCrown />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">Nâng Cấp VIP Travel Pro</h3>
              <p className="text-xs text-slate-400">Mở khóa toàn bộ sức mạnh AI & Bản đồ không giới hạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Canh bao neu chua dang nhap */}
        {!user && (
          <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="text-amber-900 font-medium">
              ⚠️ Bạn chưa đăng nhập. Vui lòng đăng nhập để hệ thống kích hoạt VIP cho tài khoản của bạn.
            </div>
            <a
              href="/login"
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black rounded-xl whitespace-nowrap shadow-2xs"
            >
              Đăng nhập
            </a>
          </div>
        )}

        {/* Step 1: Chon goi nang cap (khi chua tao order) */}
        {!order && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Goi 7 ngay */}
              <button
                type="button"
                onClick={() => setSelectedPlan('vip_trial')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all text-center space-y-2 relative flex flex-col items-center justify-between ${
                  selectedPlan === 'vip_trial'
                    ? 'border-amber-500 bg-amber-50/90 ring-3 ring-amber-300/80 shadow-sm scale-102'
                    : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trải nghiệm</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'vip_trial' ? 'border-amber-600 bg-amber-500' : 'border-slate-300'}`}>
                    {selectedPlan === 'vip_trial' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">7 Ngày</p>
                  <p className="text-base font-black text-amber-900 mt-0.5">19.000 đ</p>
                </div>
              </button>

              {/* Goi 30 ngay */}
              <button
                type="button"
                onClick={() => setSelectedPlan('vip_1month')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all text-center space-y-2 relative flex flex-col items-center justify-between ${
                  selectedPlan === 'vip_1month'
                    ? 'border-amber-500 bg-amber-50/90 ring-3 ring-amber-300/80 shadow-sm scale-102'
                    : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 bg-white'
                }`}
              >
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-black bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full shadow-xs border border-amber-300">
                  Phổ biến nhất 🔥
                </span>
                <div className="flex items-center justify-between w-full pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phượt thủ</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'vip_1month' ? 'border-amber-600 bg-amber-500' : 'border-slate-300'}`}>
                    {selectedPlan === 'vip_1month' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">1 Tháng</p>
                  <p className="text-base font-black text-amber-900 mt-0.5">49.000 đ</p>
                </div>
              </button>

              {/* Goi tron doi */}
              <button
                type="button"
                onClick={() => setSelectedPlan('vip_lifetime')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all text-center space-y-2 relative flex flex-col items-center justify-between ${
                  selectedPlan === 'vip_lifetime'
                    ? 'border-amber-500 bg-amber-50/90 ring-3 ring-amber-300/80 shadow-sm scale-102'
                    : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trọn đời</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'vip_lifetime' ? 'border-amber-600 bg-amber-500' : 'border-slate-300'}`}>
                    {selectedPlan === 'vip_lifetime' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Vĩnh viễn</p>
                  <p className="text-base font-black text-amber-900 mt-0.5">149.000 đ</p>
                </div>
              </button>
            </div>

            {/* Quyen loi VIP */}
            <div className="pastel-card p-4 rounded-2xl border border-amber-200/60 space-y-2 text-xs">
              <p className="font-black text-slate-800 text-[11px] uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <FaBolt className="text-amber-500" /> Đặc quyền thành viên VIP:
              </p>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                  <span>AI tạo lịch trình dài ngày không giới hạn & đề xuất ẩm thực sâu</span>
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                  <span>Tự động tối ưu hóa cung đường Google Maps thông minh nhất</span>
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                  <span>Xuất file PDF & Lịch trình Offline độ phân giải cao</span>
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                  <span>Huy hiệu <b>VIP Gold</b> cạnh tên tài khoản</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCreateOrder(selectedPlan)}
              disabled={loading}
              className="w-full pastel-yellow-btn py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaQrcode />}
              Tạo mã QR SePay & Thanh toán
            </button>
          </div>
        )}

        {/* Step 2: Hien thi Ma QR SePay VietQR & Thong tin chuyen khoan */}
        {order && order.status !== 'completed' && (
          <div className="space-y-4">
            {/* Banner thong tin SePay */}
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Gói đã chọn</span>
              <p className="text-sm font-black text-slate-900">{order.plan_name}</p>
              <p className="text-xl font-black text-amber-900">{order.amount.toLocaleString('vi-VN')} VNĐ</p>
            </div>

            {/* Khung hien thi QR Code SePay VietQR */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="w-52 h-52 bg-white p-2 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center">
                <img
                  src={order.qr_url}
                  alt="SePay VietQR Code"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <FaSpinner className="animate-spin text-amber-500 text-xs" />
                <span>Hệ thống đang tự động lắng nghe giao dịch SePay...</span>
              </div>
            </div>

            {/* Chi tiet so tai khoan & noi dung chuyen khoan */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold text-slate-800">{order.bank_name}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm">{order.account_no}</span>
                  <button
                    onClick={() => handleCopy(order.account_no, 'Số tài khoản')}
                    className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
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
                    onClick={() => handleCopy(order.transfer_content, 'Nội dung chuyển khoản')}
                    className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FaCopy /> {copiedField === 'Nội dung chuyển khoản' ? 'Đã chép' : 'Chép'}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic text-center">
              * Mở ứng dụng ngân hàng của bạn (MBBank, Vietcombank, Techcombank, Momo...) và quét mã QR trên để chuyển khoản. Khi tiền vào SePay, hệ thống tự động kích hoạt VIP trong 3 - 5 giây!
            </p>
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
  );
};

