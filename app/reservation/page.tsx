'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ReservationPage() {
  const pianos = ["1번 피아노", "2번 피아노", "3번 피아노", "업라이트 피아노"];
  const timeSlots = Array.from({ length: 30 }, (_, i) => 9 + i * 0.5);

  const [dbReservations, setDbReservations] = useState<any[]>([]);
  const [activePiano, setActivePiano] = useState<string | null>(null);

  // 날짜 생성 (Feb, 2026 형식 대응)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2026, 1, i + 1); // 2026년 2월 기준 데이터 예시
    const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      dayNum: String(d.getDate()).padStart(2, '0'),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      fullDate: dateString
    };
  });

  const [selectedDate, setSelectedDate] = useState(dates[1].fullDate); // 02일 기준

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

  return (
    <main className="min-h-screen bg-[#F9FAFB] font-['Pretendard'] text-[#1A1A1A] flex flex-col items-center overflow-x-hidden pb-20">
      
      {/* 🎨 상단 헤더 & 그래디언트 배경 (Rectangle 404 기반) */}
      <div 
        className="w-full max-w-[480px] h-[310px] absolute top-[-12px] rounded-[15px] z-0 shadow-sm"
        style={{ background: 'radial-gradient(137.53% 99.23% at 92.41% 7.26%, #FFF5E4 0%, #C7D4F4 100%)' }}
      />

      <div className="w-full max-w-[480px] px-[20px] relative z-10">
        {/* 상단 타이틀 바 (Frame 159) */}
        <div className="flex justify-between items-center pt-[64px] mb-[38px]">
          <h1 className="text-[32px] font-bold tracking-[-0.03em]">Calendar</h1>
          <Link href="/" className="w-[31px] h-[32px] flex items-center justify-center bg-[#1C1B1F] rounded-md">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          </Link>
        </div>

        {/* 월 표시 및 화살표 (Frame 158) */}
        <div className="flex justify-between items-center mb-[18px]">
          <span className="text-[24px] font-semibold tracking-[-0.03em]">Feb, 2026</span>
          <div className="flex gap-[18px]">
            <button className="w-6 h-6 rotate-180"><svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg></button>
            <button className="w-6 h-6"><svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg></button>
          </div>
        </div>

        {/* 📅 날짜 선택 가로 스크롤 (Frame 156) */}
        <div className="flex gap-[32px] overflow-x-auto pb-4 scrollbar-hide">
          {dates.map((d) => (
            <button 
              key={d.fullDate}
              onClick={() => setSelectedDate(d.fullDate)}
              className={`flex flex-col items-center min-w-[32px] transition-all ${
                selectedDate === d.fullDate 
                ? 'bg-white/45 p-[13px_8px] rounded-[8px] -mt-[13px]' 
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

        {/* 📍 배치도 드롭다운 버튼 (Frame 152) */}
        <div className="mt-[65px] flex justify-center mb-[30px]">
          <button className="flex items-center gap-[7px] bg-[#C7D4F4] px-[20px] py-[10px] rounded-[47px] shadow-sm hover:scale-105 transition-transform">
            <span className="text-[20px] font-semibold tracking-[-0.03em]">피아노 배치도</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7 10l5 5 5-5H7z" fill="black"/></svg>
          </button>
        </div>

        {/* 범례 표시 (Frame 95) */}
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

        {/* 🎹 피아노 목록 (Frame 145/134 계열) */}
        <div className="flex flex-col gap-[32px]">
          {pianos.map((piano) => {
            const isOpen = activePiano === piano;
            return (
              <div key={piano} className="w-full bg-white rounded-[15px] p-[20px_20px_15px] shadow-[0_0_6.5px_rgba(0,0,0,0.12)]">
                <div className="flex justify-between items-center mb-[15px]">
                  <h3 className="text-[20px] font-semibold tracking-[-0.03em]">{piano}</h3>
                  <button 
                    onClick={() => setActivePiano(isOpen ? null : piano)}
                    className="bg-[#C7D4F4] px-[20px] py-[5px] rounded-[20px] text-[16px] font-semibold"
                  >
                    {isOpen ? '닫기' : '선택'}
                  </button>
                </div>

                {/* 📊 타임라인 바 (Group 2 디자인 재현) */}
                <div className="relative w-full h-[45px] bg-white rounded-[15px] border border-gray-50 overflow-hidden">
                  {/* 시간 숫자 표시 */}
                  <div className="flex justify-between px-2 pt-1 text-[14px] text-[#999999] font-semibold">
                    {[9, 12, 15, 18, 21, 24].map(h => <span key={h}>{h}</span>)}
                  </div>
                  {/* 슬롯 바 배경 */}
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

                {/* 예약 폼 (선택 시 노출) */}
                {isOpen && (
                  <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="이름" className="p-3 bg-[#F3F6FC] rounded-lg text-sm outline-none" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                      <input type="text" placeholder="학번" className="p-3 bg-[#F3F6FC] rounded-lg text-sm outline-none" onChange={(e) => setFormData({...formData, studentId: e.target.value})} />
                    </div>
                    <button 
                      onClick={() => handleReserve(piano)}
                      className="w-full bg-[#1A1A1A] text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
                    >
                      예약 신청하기
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 👣 푸터 (Figma Footer 기반) */}
        <footer className="text-center mt-20 pb-10">
          <p className="text-[12px] font-light tracking-[0.04em] text-[#999999]">
            © KYUNGPOOK NATIONAL UNIV. PIANO CLUB KNUPI
          </p>
        </footer>
      </div>
    </main>
  );
}