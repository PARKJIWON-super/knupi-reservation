'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Reservation = {
  id?: number;
  user_name: string;
  student_id: string;
  piano_name: string;
  data: string;
  start_time: number;
  end_time: number;
};

const getDateOnly = (value: string) => value.slice(0, 10);

const addDaysToDateString = (dateString: string, days: number) => {
  const date = new Date(`${getDateOnly(dateString)}T00:00:00`);
  date.setDate(date.getDate() + days);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const isDuplicateReservationError = (error: { code?: string; message?: string } | null) => {
  if (!error) return false;

  return (
    error.code === '23P01' ||
    error.code === '23505' ||
    error.message?.toLowerCase().includes('no_overlapping_reservations') ||
    error.message?.toLowerCase().includes('conflicting key value violates exclusion constraint')
  );
};

export default function ReservationPage() {
  const pianos = ["1번 피아노", "2번 피아노", "3번 피아노", "업라이트 피아노"];
  const timeSlots = Array.from({ length: 30 }, (_, i) => 9 + i * 0.5);
  const endSlots = Array.from({ length: 31 }, (_, i) => 9 + i * 0.5).filter(t => t > 9);

  const [dbReservations, setDbReservations] = useState<Reservation[]>([]);
  const [activePiano, setActivePiano] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [tooltip, setTooltip] = useState<{ piano: string; time: number; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedInfo, setConfirmedInfo] = useState<Reservation | null>(null);

  const dates = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dayNum: String(d.getDate()).padStart(2, '0'),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      year: d.getFullYear(),
      fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    };
  }), []);

  const [selectedDate, setSelectedDate] = useState(dates[0].fullDate);
  const [formData, setFormData] = useState({ 
    name: '', 
    studentId: '', 
    start: null as number | null, 
    end: null as number | null 
  });

  const fetchReservations = useCallback(async () => {
    const firstDate = dates[0].fullDate;
    const lastDateExclusive = addDaysToDateString(dates[dates.length - 1].fullDate, 1);

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .gte('data', firstDate)
      .lt('data', lastDateExclusive)
      .order('data', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('예약 목록을 불러오지 못했습니다:', error);
      alert('예약 목록을 불러오지 못했습니다. Supabase 권한/RLS 설정을 확인해주세요.');
      return;
    }

    setDbReservations(data || []);
  }, [dates]);

  useEffect(() => { 
    fetchReservations(); 

    const channel = supabase
      .channel('public:reservations_calendar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchReservations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReservations]);

  const formatTimeDisplay = (t: number) => {
    if (t === 24) return "24:00";
    return t % 1 === 0 ? `${t}:00` : `${Math.floor(t)}:30`;
  };

  const handleReserve = async (pianoName: string) => {
    if (isSubmitting) return;

    if (!formData.name || !formData.studentId || formData.start === null || formData.end === null) {
      return alert("모든 정보를 입력하고 시간을 선택해주세요.");
    }
    if (formData.studentId.length !== 10) {
      return alert("학번은 반드시 10자리로 입력해주세요.");
    }
    if (formData.start >= formData.end) {
      return alert("종료 시간은 시작 시간보다 늦어야 합니다.");
    }

    setIsSubmitting(true);

    // 빠른 안내를 위한 사전 검사입니다. 실제 동시 예약 방지는 DB 제약 조건이 최종적으로 처리합니다.
    const { data: latestReservations, error: latestReservationsError } = await supabase
      .from('reservations')
      .select('start_time, end_time')
      .eq('piano_name', pianoName)
      .gte('data', selectedDate)
      .lt('data', addDaysToDateString(selectedDate, 1))
      .lt('start_time', formData.end)
      .gt('end_time', formData.start);

    if (latestReservationsError) {
      setIsSubmitting(false);
      return alert("예약 정보를 확인하는 중 오류가 발생했습니다. 다시 시도해주세요.");
    }

    if ((latestReservations || []).length > 0) {
      await fetchReservations();
      setIsSubmitting(false);
      return alert("❌ 이미 예약된 시간입니다. 다른 시간을 선택해주세요.");
    }

    const reservationData: Reservation = { 
      user_name: formData.name, 
      student_id: formData.studentId, 
      piano_name: pianoName, 
      data: selectedDate,
      start_time: Number(formData.start), 
      end_time: Number(formData.end)
    };

    const { error } = await supabase.from('reservations').insert([reservationData]);

    if (!error) { 
      setConfirmedInfo(reservationData);
      setShowSuccessModal(true);
      setDbReservations((prev) => [...prev, reservationData]);
      setActivePiano(null); 
      setFormData({ name: '', studentId: '', start: null, end: null });
      await fetchReservations(); 
    } else if (isDuplicateReservationError(error)) {
      await fetchReservations();
      alert("❌ 죄송합니다. 방금 다른 사용자가 같은 시간대를 먼저 예약했습니다. 다른 시간을 선택해주세요.");
    } else {
      alert("예약에 실패했습니다. 다시 시도해주세요.");
    }

    setIsSubmitting(false);
  };

  const currentDisplayDate = dates.find(d => d.fullDate === selectedDate) || dates[0];

  return (
    <main className="min-h-screen bg-[#F9FAFB] font-['Pretendard'] text-[#1A1A1A] flex flex-col items-center pb-20 overflow-x-hidden">
      <div className="w-full max-w-[480px] h-[310px] absolute top-[-12px] rounded-[15px] z-0 shadow-sm"
        style={{ background: 'radial-gradient(137.53% 99.23% at 92.41% 7.26%, #FFF5E4 0%, #C7D4F4 100%)' }} />

      <div className="w-full max-w-[480px] px-[20px] relative z-10 pt-[60px]">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-[32px] font-bold tracking-tight">Calendar</h1>
          <Link href="/" className="transition-transform active:scale-90">
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
               <polyline points="9 22 9 12 15 12 15 22"></polyline>
             </svg>
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <span className="text-[24px] font-semibold tracking-tight">
            {currentDisplayDate.monthName}, {currentDisplayDate.year}
          </span>
        </div>

        <div className="flex gap-7 overflow-x-auto pb-6 scrollbar-hide px-1">
          {dates.map((d) => (
            <button key={d.fullDate} onClick={() => { setSelectedDate(d.fullDate); setTooltip(null); }}
              className={`flex flex-col items-center min-w-[35px] p-[10px_6px] rounded-[12px] ${
        selectedDate === d.fullDate 
        ? 'bg-white/45 shadow-sm' 
        : ''
      }`}
    >
              <span className={`text-[20px] font-bold ${selectedDate === d.fullDate ? 'text-black' : 'text-[#808080]'}`}>{d.dayNum}</span>
              <span className={`text-[14px] font-semibold ${selectedDate === d.fullDate ? 'text-[#666666]' : 'text-[#B2B2B2]'}`}>{d.dayName}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-start mb-8 mt-4">
          <button onClick={() => setShowMap(true)}
            className="flex items-center gap-2 bg-[#C7D4F4] px-5 py-2 rounded-full shadow-sm font-bold text-[15px]">
            피아노 배치도 <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="inline-block"
  >
    <path 
      d="M7 10L12 15L17 10H7Z" 
      fill="#1C1B1F" 
    />
  </svg>
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {pianos.map((piano) => {
            const isOpen = activePiano === piano;
            return (
              <div key={piano} className={`w-full bg-white rounded-[25px] transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.05)] overflow-hidden border-2 ${isOpen ? 'border-[#C7D4F4]' : 'border-transparent'}`}>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[20px] font-bold tracking-tight text-black">{piano}</h3>
                    <button 
                      onClick={() => {
                        setActivePiano(isOpen ? null : piano);
                        setFormData({ ...formData, start: null, end: null });
                        setTooltip(null);
                      }}
                      className="px-6 py-1.5 rounded-full text-[14px] font-bold bg-[#C7D4F4] text-black shadow-sm"
                    >
                      {isOpen ? '닫기' : '선택'}
                    </button>
                  </div>
                  <div className="relative pt-4 pb-2">
                    <div className="flex justify-between mb-2 px-1">
                      {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map(h => (
                        <span key={h} className="text-[10px] text-gray-400 font-medium w-0 flex justify-center">{h}</span>
                      ))}
                    </div>
                    <div className="relative h-2.5 bg-gray-100 rounded-full flex gap-[1px]">
                      {timeSlots.map(t => {
                        const res = dbReservations.find(r => r.piano_name === piano && getDateOnly(String(r.data)) === selectedDate && t >= r.start_time && t < r.end_time);
                        return (
                          <div key={t} onClick={(e) => { e.stopPropagation(); if (res) setTooltip(tooltip?.time === t && tooltip?.piano === piano ? null : { piano, time: t, name: res.user_name }); }}
                            className={`flex-1 h-full first:rounded-l-full last:rounded-r-full transition-all relative ${res ? 'bg-[#C7D4F4] cursor-help' : 'bg-transparent'}`}>
                            {tooltip?.piano === piano && tooltip?.time === t && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[10px] rounded whitespace-nowrap z-50 animate-in fade-in slide-in-from-bottom-1">
                                    {tooltip.name} 님
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                                </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-6 pb-8 pt-4 bg-[#F3F6FC] flex flex-col gap-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="이름" value={formData.name} className="w-full p-4 rounded-full bg-white text-[14px] text-black outline-none shadow-sm placeholder:text-gray-400" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                      <input type="text" placeholder="학번" maxLength={10} value={formData.studentId} className="w-full p-4 rounded-full bg-white text-[14px] text-black outline-none shadow-sm placeholder:text-gray-400" onChange={(e) => setFormData({...formData, studentId: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select className={`w-full p-4 rounded-full bg-white text-[14px] outline-none appearance-none px-5 ${formData.start === null ? 'text-gray-400' : 'text-black'}`} value={formData.start ?? ""} onChange={(e) => setFormData({...formData, start: e.target.value === "" ? null : Number(e.target.value)})}>
                        <option value="" disabled hidden>시작 시간</option>
                        {timeSlots.map(t => <option key={t} value={t}>{formatTimeDisplay(t)}</option>)}
                      </select>
                      <select className={`w-full p-4 rounded-full bg-white text-[14px] outline-none appearance-none px-5 ${formData.end === null ? 'text-gray-400' : 'text-black'}`} value={formData.end ?? ""} onChange={(e) => setFormData({...formData, end: e.target.value === "" ? null : Number(e.target.value)})}>
                        <option value="" disabled hidden>종료 시간</option>
                        {endSlots.map(t => <option key={t} value={t}>{formatTimeDisplay(t)}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => handleReserve(piano)}
                      disabled={isSubmitting}
                      className="w-full bg-[#C7D4F4] text-black font-bold py-4 rounded-[18px] mt-2 shadow-md active:scale-95 transition-all text-[16px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? '예약 확인 중...' : '예약 신청하기'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ✅ 예약 확정 성공 모달 - #FFF5E4와 #C7D4F4가 섞인 배경 적용 */}
        {showSuccessModal && confirmedInfo && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 py-4 backdrop-blur-sm transition-all animate-in fade-in duration-300">
            <div 
              className="relative flex w-full max-w-[430px] flex-col items-center rounded-[34px] p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
              style={{ background: 'linear-gradient(135deg, #FFF5E4 0%, #C7D4F4 100%)' }}
            >
              <div className="w-10 h-1.5 bg-black/10 rounded-full mb-5"></div>
              
              <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <div className="w-9 h-9 rounded-full border-4 border-[#A5BBEF] flex items-center justify-center">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#6C86D3" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              </div>

              <h2 className="text-[23px] font-bold mb-5 text-black tracking-tight">
                예약이 <span className="text-[#C7A27C]">확정되었습니다</span>
              </h2>

              <div className="w-full bg-white/90 rounded-[22px] p-5 shadow-sm mb-5 flex flex-col items-center">
                <span className="text-[18px] font-bold text-gray-800 mb-2">{confirmedInfo.piano_name}</span>
                <span className="text-[16px] font-medium text-[#6C86D3]">
                  {confirmedInfo.data.replace(/-/g, '.')} <span className="text-gray-900 ml-1">{formatTimeDisplay(confirmedInfo.start_time)}~{formatTimeDisplay(confirmedInfo.end_time)}</span>
                </span>
              </div>

              <div className="w-full bg-white/60 rounded-[18px] p-5 mb-5 border border-white/20">
                <p className="font-bold text-[14px] mb-3 flex items-center gap-2 text-black">⚠️ 이용 주의사항</p>
                <ul className="text-[13px] text-gray-700 space-y-2 font-medium">
                  <li className="flex items-center gap-2">• 음식물 섭취 후 뒷정리 필수 ‼️</li>
                  <li className="flex items-center gap-2">• 노쇼 시 향후 이용이 제한될 수 있습니다. 😔</li>
                </ul>
                <div className="mt-4 pt-3 border-t border-dashed border-black/10 text-center">
                   <p className="text-[12px] text-gray-500 mb-1">💬 문의 : 크누피 집행부</p>
                   <a 
                    href="https://open.kakao.com/o/s5DRwRei" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[13px] font-bold text-[#6C86D3] underline underline-offset-4 hover:text-[#4A63B1] transition-colors"
                   >
                     사이소리함 (카카오톡 채팅)
                   </a>
                </div>
              </div>

              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-[#1A1A1A] text-white font-bold py-4 rounded-[18px] text-[16px] shadow-lg active:scale-95 transition-all"
              >
                확인
              </button>
            </div>
          </div>
        )}

        {showMap && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowMap(false)}>
            <div className="relative max-w-[400px] w-full bg-white rounded-[30px] p-2 shadow-2xl overflow-hidden">
              <img src="/piano-layout.png" alt="배치도" className="w-full h-auto rounded-[20px]" />
              <button className="absolute top-4 right-4 bg-black/20 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold">✕</button>
            </div>
          </div>
        )}

        <footer className="text-center mt-20 pb-10">
          <p className="text-[12px] font-light tracking-[0.04em] text-[#999999]">© KYUNGPOOK NATIONAL UNIV. PIANO CLUB KNUPI</p>
        </footer>
      </div>
    </main>
  );
}