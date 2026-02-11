'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ReservationPage() {
  const pianos = ["1번 피아노", "2번 피아노", "3번 피아노", "업라이트 피아노"];
  const timeSlots = Array.from({ length: 30 }, (_, i) => 9 + i * 0.5);
  const endSlots = Array.from({ length: 31 }, (_, i) => 9 + i * 0.5).filter(t => t > 9);

  const [dbReservations, setDbReservations] = useState<any[]>([]);
  const [activePiano, setActivePiano] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  
  // ✅ 누가 예약했는지 보여주기 위한 상태 추가
  const [tooltip, setTooltip] = useState<{ piano: string; time: number; name: string } | null>(null);

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dayNum: String(d.getDate()).padStart(2, '0'),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      year: d.getFullYear(),
      fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    };
  });

  const [selectedDate, setSelectedDate] = useState(dates[0].fullDate);
  const [formData, setFormData] = useState({ 
    name: '', 
    studentId: '', 
    start: null as number | null, 
    end: null as number | null 
  });

  const fetchReservations = async () => {
    const { data } = await supabase.from('reservations').select('*');
    setDbReservations(data || []);
  };

  useEffect(() => { fetchReservations(); }, [selectedDate]);

  const formatTimeDisplay = (t: number) => {
    if (t === 24) return "24:00";
    return t % 1 === 0 ? `${t}:00` : `${Math.floor(t)}:30`;
  };

  const handleReserve = async (pianoName: string) => {
    if (!formData.name || !formData.studentId || formData.start === null || formData.end === null) {
      return alert("모든 정보를 입력하고 시간을 선택해주세요.");
    }
    if (formData.studentId.length !== 10) {
      return alert("학번은 반드시 10자리로 입력해주세요.");
    }
    if (formData.start >= formData.end) {
      return alert("종료 시간은 시작 시간보다 늦어야 합니다.");
    }

    const isOverlap = dbReservations.some(res => {
      return (
        res.piano_name === pianoName &&
        String(res.data) === String(selectedDate) &&
        formData.start! < res.end_time && 
        formData.end! > res.start_time
      );
    });

    if (isOverlap) {
      return alert("❌ 죄송합니다. 선택하신 시간대에 이미 예약이 존재합니다.");
    }

    const { error } = await supabase.from('reservations').insert([{ 
      user_name: formData.name, 
      student_id: formData.studentId, 
      piano_name: pianoName, 
      data: selectedDate,
      start_time: Number(formData.start), 
      end_time: Number(formData.end)
    }]);

    if (!error) { 
      alert("🎉 예약 성공!"); 
      setActivePiano(null); 
      setFormData({ name: '', studentId: '', start: null, end: null });
      fetchReservations(); 
    } else {
      alert("예약에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const currentDisplayDate = dates.find(d => d.fullDate === selectedDate) || dates[0];

  return (
    <main className="min-h-screen bg-[#F9FAFB] font-['Pretendard'] text-[#1A1A1A] flex flex-col items-center pb-20">
      <div className="w-full max-w-[480px] h-[310px] absolute top-[-12px] rounded-[15px] z-0 shadow-sm"
        style={{ background: 'radial-gradient(137.53% 99.23% at 92.41% 7.26%, #FFF5E4 0%, #C7D4F4 100%)' }} />

      <div className="w-full max-w-[480px] px-[20px] relative z-10 pt-[60px]">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-[32px] font-bold tracking-tight">Calendar</h1>
          {/* ✅ 사진 스타일로 변경된 홈 아이콘 */}
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
              className={`flex flex-col items-center min-w-[35px] transition-all ${selectedDate === d.fullDate ? 'bg-white/45 p-[10px_6px] rounded-[8px] -mt-[10px] shadow-sm' : ''}`}>
              <span className={`text-[20px] font-bold ${selectedDate === d.fullDate ? 'text-black' : 'text-[#808080]'}`}>{d.dayNum}</span>
              <span className={`text-[14px] font-semibold ${selectedDate === d.fullDate ? 'text-[#666666]' : 'text-[#B2B2B2]'}`}>{d.dayName}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-start mb-8 mt-4">
          <button onClick={() => setShowMap(true)}
            className="flex items-center gap-2 bg-[#C7D4F4] px-5 py-2 rounded-full shadow-sm font-bold text-[15px]">
            피아노 배치도
          </button>
        </div>

        <div className="flex justify-end gap-4 mb-4 px-1 text-gray-500 font-medium">
          <div className="flex items-center gap-1.5 text-[13px]">
            <div className="w-2 h-2 bg-[#C7D4F4]/40 rounded-full"></div> 예약 가능
          </div>
          <div className="flex items-center gap-1.5 text-[13px]">
            <div className="w-2 h-2 bg-[#C7D4F4] rounded-full"></div> 예약 불가
          </div>
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
                      className="px-6 py-1.5 rounded-full text-[14px] font-bold bg-[#C7D4F4] text-black shadow-sm transition-transform active:scale-95"
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
                        const res = dbReservations.find(r => r.piano_name === piano && String(r.data) === selectedDate && t >= r.start_time && t < r.end_time);
                        return (
                          <div 
                            key={t} 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (res) {
                                    setTooltip(tooltip?.time === t && tooltip?.piano === piano ? null : { piano, time: t, name: res.user_name });
                                } else {
                                    setTooltip(null);
                                }
                            }}
                            className={`flex-1 h-full first:rounded-l-full last:rounded-r-full transition-all relative ${res ? 'bg-[#C7D4F4] cursor-help' : 'bg-transparent'}`} 
                          >
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
                      <input type="text" placeholder="이름" value={formData.name} className="w-full p-4 rounded-full bg-white text-[14px] outline-none shadow-sm border border-transparent focus:border-[#C7D4F4] placeholder:text-gray-400" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                      <input type="text" placeholder="학번" maxLength={10} value={formData.studentId} className="w-full p-4 rounded-full bg-white text-[14px] outline-none shadow-sm border border-transparent focus:border-[#C7D4F4] placeholder:text-gray-400" onChange={(e) => setFormData({...formData, studentId: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select 
                        className={`w-full p-4 rounded-full bg-white text-[14px] outline-none appearance-none px-5 shadow-sm border border-transparent focus:border-[#C7D4F4] ${formData.start === null ? 'text-gray-400' : 'text-black'}`} 
                        value={formData.start ?? ""} 
                        onChange={(e) => setFormData({...formData, start: e.target.value === "" ? null : Number(e.target.value)})}
                      >
                        <option value="" disabled hidden>시작 시간</option>
                        {timeSlots.map(t => <option className="text-black" key={t} value={t}>{formatTimeDisplay(t)}</option>)}
                      </select>

                      <select 
                        className={`w-full p-4 rounded-full bg-white text-[14px] outline-none appearance-none px-5 shadow-sm border border-transparent focus:border-[#C7D4F4] ${formData.end === null ? 'text-gray-400' : 'text-black'}`} 
                        value={formData.end ?? ""} 
                        onChange={(e) => setFormData({...formData, end: e.target.value === "" ? null : Number(e.target.value)})}
                      >
                        <option value="" disabled hidden>종료 시간</option>
                        {endSlots.map(t => (
                          <option className="text-black" key={t} value={t}>{formatTimeDisplay(t)}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={() => handleReserve(piano)}
                      className="w-full bg-[#C7D4F4] text-black font-bold py-4 rounded-[18px] mt-2 shadow-md active:scale-95 transition-all text-[16px]"
                    >
                      예약 신청하기
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

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