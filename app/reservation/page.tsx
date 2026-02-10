'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ReservationPage() {
  const pianos = ["1번 피아노", "2번 피아노", "3번 피아노", "업라이트 피아노"];
  const timeSlots = Array.from({ length: 30 }, (_, i) => 9 + i * 0.5);

  const [dbReservations, setDbReservations] = useState<any[]>([]);
  const [activePiano, setActivePiano] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false); // 배치도 이미지 노출 상태

  // 1. 날짜 생성: 금일부터 14일간 (2주)
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      dayNum: String(d.getDate()).padStart(2, '0'),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      year: d.getFullYear(),
      fullDate: dateString
    };
  });

  const [selectedDate, setSelectedDate] = useState(dates[0].fullDate);

  const [formData, setFormData] = useState({
    name: '', studentId: '', phone: '', start: 9, end: 9.5
  });

  const fetchReservations = async () => {
    const { data } = await supabase.from('reservations').select('*');
    setDbReservations(data || []);
  };

  useEffect(() => { fetchReservations(); }, [selectedDate]);

  const handleReserve = async (pianoName: string) => {
    if (!formData.name || !formData.studentId) return alert("정보를 입력해주세요.");
    const { error } = await supabase.from('reservations').insert([{ 
      user_name: formData.name, student_id: formData.studentId, 
      piano_name: pianoName, data: selectedDate,
      start_time: Number(formData.start), end_time: Number(formData.end)
    }]);
    if (!error) { alert("🎉 예약 성공!"); setActivePiano(null); fetchReservations(); }
  };

  // 현재 선택된 날짜의 월/년도 정보 (Feb, 2026 형식용)
  const currentDisplayDate = dates.find(d => d.fullDate === selectedDate) || dates[0];

  return (
    <main className="min-h-screen bg-[#F9FAFB] font-['Pretendard'] text-[#1A1A1A] flex flex-col items-center overflow-x-hidden pb-20">
      
      {/* 상단 그래디언트 배경 */}
      <div 
        className="w-full max-w-[480px] h-[310px] absolute top-[-12px] rounded-[15px] z-0 shadow-sm"
        style={{ background: 'radial-gradient(137.53% 99.23% at 92.41% 7.26%, #FFF5E4 0%, #C7D4F4 100%)' }}
      />

      <div className="w-full max-w-[480px] px-[20px] relative z-10">
        {/* 상단 타이틀 바 */}
        <div className="flex justify-between items-center pt-[64px] mb-[38px]">
          <h1 className="text-[32px] font-bold tracking-[-0.03em]">Calendar</h1>
          <Link href="/" className="w-[31px] h-[32px] flex items-center justify-center bg-[#1C1B1F] rounded-md transition-transform active:scale-90">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          </Link>
        </div>

        {/* 월 표시 */}
        <div className="flex justify-between items-center mb-[18px]">
          <span className="text-[24px] font-semibold tracking-[-0.03em]">
            {currentDisplayDate.monthName}, {currentDisplayDate.year}
          </span>
          <div className="flex gap-[18px]">
            <button className="w-6 h-6 rotate-180 opacity-30 cursor-not-allowed"><svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg></button>
            <button className="w-6 h-6"><svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg></button>
          </div>
        </div>

        {/* 📅 2주간의 날짜 스크롤 */}
        <div className="flex gap-[28px] overflow-x-auto pb-4 scrollbar-hide px-1">
          {dates.map((d) => (
            <button 
              key={d.fullDate}
              onClick={() => setSelectedDate(d.fullDate)}
              className={`flex flex-col items-center min-w-[32px] transition-all ${
                selectedDate === d.fullDate 
                ? 'bg-white/45 p-[13px_8px] rounded-[8px] -mt-[13px] shadow-sm' 
                : ''
              }`}
            >
              <span className={`text-[20px] font-semibold leading-[24px] ${selectedDate === d.fullDate ? 'text-black' : 'text-[#808080]'}`}>
                {d.dayNum}
              </span>
              <span className={`text-[16px] font-semibold ${selectedDate === d.fullDate ? 'text-[#666666]' : 'text-[#B2B2B2]'}`}>
                {d.dayName}
              </span>
            </button>
          ))}
        </div>

        {/* 📍 배치도 버튼: 왼쪽 정렬 및 크기 축소 */}
        <div className="mt-[45px] flex justify-start mb-[30px] px-1">
          <button 
            onClick={() => setShowMap(true)}
            className="flex items-center gap-[6px] bg-[#C7D4F4] p-[8px_16px] rounded-[47px] shadow-sm active:scale-95 transition-all"
          >
            <span className="text-[16px] font-semibold tracking-[-0.03em]">피아노 배치도</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7 10l5 5 5-5H7z" fill="black"/></svg>
          </button>
        </div>

        {/* 배치도 모달 이미지 */}
        {showMap && (
          <div 
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300"
            onClick={() => setShowMap(false)}
          >
            <div className="relative max-w-[400px] w-full bg-white rounded-[25px] p-2 shadow-2xl overflow-hidden">
              <img src="/piano-layout.png" alt="배치도" className="w-full h-auto rounded-[20px]" />
              <button className="absolute top-4 right-4 bg-black/20 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold">✕</button>
            </div>
          </div>
        )}

        {/* 범례 표시 */}
        <div className="flex justify-end gap-[16px] mb-[15px] px-1">
          <div className="flex items-center gap-[3px]">
            <div className="w-[9px] h-[9px] bg-[#C7D4F4]/40 rounded-full"></div>
            <span className="text-[16px] font-normal tracking-[-0.03em]">예약 가능</span>
          </div>
          <div className="flex items-center gap-[3px]">
            <div className="w-[9px] h-[9px] bg-[#C7D4F4] rounded-full"></div>
            <span className="text-[16px] font-normal tracking-[-0.03em]">예약 불가</span>
          </div>
        </div>

        {/* 🎹 피아노 목록 */}
        <div className="flex flex-col gap-[32px]">
          {pianos.map((piano) => {
            const isOpen = activePiano === piano;
            return (
              <div key={piano} className="w-full bg-white rounded-[15px] p-[20px_20px_15px] shadow-[0_0_6.5px_rgba(0,0,0,0.12)]">
                <div className="flex justify-between items-center mb-[15px]">
                  <h3 className="text-[20px] font-semibold tracking-[-0.03em]">{piano}</h3>
                  <button 
                    onClick={() => setActivePiano(isOpen ? null : piano)}
                    className="bg-[#C7D4F4] px-[20px] py-[5px] rounded-[20px] text-[16px] font-semibold transition-colors active:bg-[#B9C8ED]"
                  >
                    {isOpen ? '닫기' : '선택'}
                  </button>
                </div>

                {/* 타임라인 바 */}
                <div className="relative w-full h-[45px] bg-white rounded-[15px] border border-gray-50 overflow-hidden">
                  <div className="flex justify-between px-2 pt-1 text-[14px] text-[#999999] font-semibold">
                    {[9, 12, 15, 18, 21, 24].map(h => <span key={h}>{h}</span>)}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 h-[12px] bg-[#C7D4F4]/40 rounded-full flex gap-[1px]">
                    {timeSlots.map(t => {
                      const res = dbReservations.find(r => r.piano_name === piano && String(r.data) === selectedDate && t >= r.start_time && t < r.end_time);
                      return (
                        <div 
                          key={t} 
                          className={`flex-1 h-full first:rounded-l-full last:rounded-r-full ${res ? 'bg-[#C7D4F4]' : 'bg-transparent'}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 예약 폼 */}
                {isOpen && (
                  <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="이름" className="p-3 bg-[#F3F6FC] rounded-lg text-sm outline-none border border-transparent focus:border-[#C7D4F4]" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                      <input type="text" placeholder="학번" className="p-3 bg-[#F3F6FC] rounded-lg text-sm outline-none border border-transparent focus:border-[#C7D4F4]" onChange={(e) => setFormData({...formData, studentId: e.target.value})} />
                    </div>
                    <button 
                      onClick={() => handleReserve(piano)}
                      className="w-full bg-[#1A1A1A] text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all hover:bg-black"
                    >
                      예약 신청하기
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <footer className="text-center mt-20 pb-10">
          <p className="text-[12px] font-light tracking-[0.04em] text-[#999999]">
            © KYUNGPOOK NATIONAL UNIV. PIANO CLUB KNUPI
          </p>
        </footer>
      </div>
    </main>
  );
}