import React, { useState } from 'react';
import axios from 'axios';
import { Location } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  FaStar,
  FaMapMarkerAlt,
  FaClock,
  FaHeart,
  FaDirections,
  FaUtensils,
  FaLightbulb,
  FaParking,
  FaCommentAlt
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface LocationCardProps {
  location: Location;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location }) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Form viet review
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'beach':
        return <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2.5 py-0.5 rounded-full">Bãi biển</span>;
      case 'restaurant':
        return <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">Ẩm thực</span>;
      case 'cafe':
        return <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-0.5 rounded-full">Cà phê</span>;
      case 'hotel':
        return <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full">Khách sạn</span>;
      case 'shopping':
        return <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2.5 py-0.5 rounded-full">Mua sắm</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">Tham quan</span>;
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast('Vui lòng đăng nhập để lưu địa điểm yêu thích', { icon: '🔒' });
      return;
    }
    try {
      const res = await axios.post(`/api/wishlist/${location.id}`);
      setIsSaved(res.data.saved);
      toast.success(res.data.message);
    } catch {
      toast.error('Không thể lưu lúc này');
    }
  };

  const handleOpenDetail = async () => {
    setShowDetailModal(true);
    setLoadingReviews(true);
    try {
      const res = await axios.get(`/api/reviews/location/${location.id}`);
      setReviews(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast('Vui lòng đăng nhập để gửi đánh giá', { icon: '🔒' });
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    try {
      await axios.post('/api/reviews', {
        location_id: location.id,
        rating: Number(newRating),
        comment: newComment,
      });
      toast.success('Đã gửi đánh giá thành công!');
      setNewComment('');
      // Reload reviews
      const res = await axios.get(`/api/reviews/location/${location.id}`);
      setReviews(res.data || []);
    } catch {
      toast.error('Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <>
      <div
        onClick={handleOpenDetail}
        className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 flex flex-col group cursor-pointer"
      >
        <div className="relative h-48 w-full overflow-hidden bg-slate-100">
          <img
            src={location.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'}
            alt={location.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            {getCategoryBadge(location.category)}
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              onClick={handleToggleWishlist}
              className={`p-2 rounded-full backdrop-blur-md shadow-md transition cursor-pointer ${
                isSaved ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-500 hover:text-rose-500'
              }`}
              title="Lưu yêu thích"
            >
              <FaHeart className="text-xs" />
            </button>
            <div className="bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md text-xs font-extrabold text-amber-600">
              <FaStar className="text-amber-400" />
              {location.rating}
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
              {location.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 line-clamp-1">
              <FaMapMarkerAlt className="text-red-500 flex-shrink-0" />
              {location.address}
            </p>
          </div>

          {/* Gia & Google Maps button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Giá trung bình</span>
              <span className="font-extrabold text-emerald-600 text-sm">
                {location.avg_cost_vnd === 0 ? 'Miễn phí' : `${location.avg_cost_vnd.toLocaleString('vi-VN')} đ`}
              </span>
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1.5 rounded-xl border border-blue-200 transition"
              title="Mở chỉ đường trên Google Maps"
            >
              <FaDirections /> Google Maps
            </a>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getCategoryBadge(location.category)}
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    <FaStar className="text-amber-400" /> {location.rating}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">{location.name}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <FaMapMarkerAlt className="text-red-500 flex-shrink-0" />
                  {location.address}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Anh dia diem */}
            {location.image_url && (
              <div className="h-52 rounded-2xl overflow-hidden border border-slate-200">
                <img src={location.image_url} alt={location.name} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Tips & Thong tin di chuyen */}
            <div className="space-y-2.5 text-xs">
              {location.tips && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 flex items-start gap-2">
                  <FaLightbulb className="text-amber-500 text-sm flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Mẹo du lịch thực tế:</span> {location.tips}
                  </div>
                </div>
              )}

              {location.transport_info && (
                <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl text-sky-900 flex items-start gap-2">
                  <FaParking className="text-sky-600 text-sm flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Di chuyển & Đậu xe:</span> {location.transport_info}
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            {location.menu_items && location.menu_items.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FaUtensils className="text-amber-500" /> Bảng giá & Món nổi tiếng:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {location.menu_items.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-100"
                    >
                      <span className="font-medium text-slate-800">{m.name}</span>
                      <span className="font-bold text-emerald-600">{m.price_vnd.toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Community Reviews Section */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FaCommentAlt className="text-blue-500" /> Đánh giá từ cộng đồng ({reviews.length})
              </h4>

              {/* Form gui danh gia */}
              <form onSubmit={handleSubmitReview} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Gửi nhận xét của bạn:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className={`text-sm cursor-pointer ${star <= newRating ? 'text-amber-400' : 'text-slate-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm thực tế của bạn tại đây..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </div>
              </form>

              {/* Danh sach danh gia */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{r.user_name}</span>
                        <span className="text-amber-500">⭐ {r.rating}</span>
                      </div>
                      <p className="text-slate-600 italic">"{r.comment}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Nut Mo Google Maps Native */}
            <div className="flex justify-between items-center pt-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}&travelmode=driving`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition"
              >
                <FaDirections /> Chỉ đường bằng Google Maps
              </a>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
