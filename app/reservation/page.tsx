'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ReservationPage() {
  const pianos = ["1번 피아노", "2번 피아노", "3번 피아노", "업라이트 피아노"];
  const timeSlots = Array.from({ length: 30 }, (_, i) => 9 + i * 0.5);

  const [dbReservations, setDbReservations] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      month: d.getMonth() + 1,
      day: d.toLocaleDateString('ko-KR', { weekday: 'short' }),
      date: d.getDate(),
      fullDate: dateString
    };
  });

  const [selectedDate, setSelectedDate] = useState(dates[0].fullDate);
  const [activePiano, setActivePiano] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    phone: '',
    start: 9,
    end: 9.5
  });

  const fetchReservations = async () => {
    const { data, error } = await supabase.from('reservations').select('*');
    if (error) console.error('불러오기 에러:', error);
    else setDbReservations(data || []);
  };

  useEffect(() => {
    fetchReservations();
  }, [selectedDate]);

  const handleReserve = async (pianoName: string) => {
    if (!formData.name || !formData.studentId) {
      alert("이름과 학번을 입력해주세요!");
      return;
    }
    if (formData.start >= formData.end) {
      alert("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    const isOverlap = dbReservations.some(res => {
      return (
        res.piano_name === pianoName &&
        String(res.data) === String(selectedDate) &&
        formData.start < res.end_time && 
        formData.end > res.start_time
      );
    });

    if (isOverlap) {
      alert("죄송합니다. 선택하신 시간대에 이미 예약이 존재합니다.");
      return;
    }

    const { error } = await supabase.from('reservations').insert([
      { 
        user_name: formData.name, 
        student_id: formData.studentId, 
        phone: formData.phone,
        piano_name: pianoName,
        data: selectedDate,
        start_time: Number(formData.start),
        end_time: Number(formData.end)
      }
    ]);

    if (error) {
      alert("예약 중 오류가 발생했습니다.");
    } else {
      alert("🎉 예약이 성공적으로 완료되었습니다!");
      setActivePiano(null);
      fetchReservations();
    }
  };

  const getReservationInfo = (pianoName: string, time: number) => {
    return dbReservations.find(res => 
      res.piano_name === pianoName && 
      String(res.data) === String(selectedDate) && 
      time >= res.start_time && time < res.end_time
    );
  };

  const endSlots = Array.from({ length: 31 }, (_, i) => 9.5 + i * 0.5).filter(t => t <= 24);

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-20 font-sans text-[#1A1F27]">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">날짜 및 연습실 선택</h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        {/* 1. 날짜 선택 섹션 (수 / 2/4 형식으로 변경) */}
        <section className="mb-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-2 px-1">
            {dates.map((d) => (
              <button 
                key={d.fullDate} 
                onClick={() => { setSelectedDate(d.fullDate); setActivePiano(null); }}
                className={`flex-shrink-0 w-16 py-5 rounded-[22px] flex flex-col items-center justify-center transition-all duration-300 ${
                  selectedDate === d.fullDate 
                  ? 'bg-blue-600 text-white shadow-xl scale-105' 
                  : 'bg-white text-gray-400 border border-gray-100 shadow-sm'
                }`}
              >
                <span className={`text-[12px] font-bold mb-1 ${selectedDate === d.fullDate ? 'text-white' : 'text-gray-500'}`}>
                  {d.day}
                </span>
                <span className="text-[14px] font-extrabold tracking-tight">
                  {d.month}/{d.date}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 2. 현재 시간 및 범례 표시 섹션 */}
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="bg-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm border border-gray-100">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-[11px] font-bold text-blue-600 tracking-tight">
              현재 시간: {currentTime.getHours()}시 {currentTime.getMinutes()}분 {currentTime.getSeconds()}초
            </span>
          </div>
          <div className="flex gap-4 text-[11px] font-bold">
            <div className="flex items-center gap-1.5 text-gray-500">
              <div className="w-3 h-3 bg-white border border-gray-200 rounded-sm"></div> 이용 가능
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <div className="w-3 h-3 bg-gray-400 rounded-sm"></div> 예약됨
            </div>
          </div>
        </div>

        {/* 연습실 목록 */}
        <section className="space-y-6">
          {pianos.map((piano, idx) => {
            const isOpen = activePiano === piano;
            return (
              <div key={piano} className={`bg-white rounded-[32px] overflow-hidden shadow-sm border-2 transition-all duration-300 ${isOpen ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-100'}`}>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">{idx + 1}</div>
                      <h3 className="font-extrabold text-lg text-gray-800">{piano}</h3>
                    </div>
                    <button 
                      onClick={() => setActivePiano(isOpen ? null : piano)}
                      className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all ${isOpen ? 'bg-gray-100 text-gray-500' : 'bg-blue-600 text-white shadow-lg'}`}
                    >
                      {isOpen ? '닫기' : '선택'}
                    </button>
                  </div>

                  <div className="relative mt-2 px-1">
                    <div className="flex justify-between mb-3 text-[10px] text-gray-400 font-bold px-1">
                      {Array.from({ length: 16 }, (_, i) => 9 + i).map((hour) => (
                        <span key={hour} className="w-0 flex justify-center">{hour}</span>
                      ))}
                    </div>

                    <div className="relative h-10 bg-gray-50 rounded-2xl p-1.5 shadow-inner flex gap-[2px]">
                      {timeSlots.map((t) => {
                        const res = getReservationInfo(piano, t);
                        const isHour = t % 1 === 0;
                        const startTime = t % 1 === 0 ? `${t}:00` : `${Math.floor(t)}:30`;
                        const endTimeNum = t + 0.5;
                        const endTime = endTimeNum === 24 ? '24:00' : (endTimeNum % 1 === 0 ? `${endTimeNum}:00` : `${Math.floor(endTimeNum)}:30`);

                        return (
                          <div
                            key={t}
                            className={`relative flex-1 rounded-md transition-all duration-200 ${
                              res 
                                ? 'bg-gray-400 shadow-sm cursor-not-allowed' 
                                : 'bg-white hover:bg-blue-100 hover:scale-y-110 cursor-pointer border border-gray-100/50'
                            }`}
                            title={res ? `${res.user_name} 님 예약 중 (${startTime}-${endTime})` : `${startTime} - ${endTime} 이용 가능`}
                          >
                            {isHour && (
                              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[1.5px] h-1.5 bg-gray-300 rounded-full"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="bg-[#F8F9FF] p-8 border-t border-blue-50 space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="이름" className="p-4 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm border border-gray-100 shadow-sm" 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} />
                      <input type="text" placeholder="학번" className="p-4 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm border border-gray-100 shadow-sm" 
                        onChange={(e) => setFormData({...formData, studentId: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-gray-400 ml-1 uppercase">Start Time</label>
                        <select className="p-4 bg-white rounded-2xl outline-none text-sm border border-gray-100 shadow-sm" value={formData.start} onChange={(e) => setFormData({...formData, start: Number(e.target.value)})}>
                          {timeSlots.map(t => <option key={t} value={t}>{t % 1 === 0 ? `${t}:00` : `${Math.floor(t)}:30`}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-gray-400 ml-1 uppercase">End Time</label>
                        <select className="p-4 bg-white rounded-2xl outline-none text-sm border border-gray-100 shadow-sm" value={formData.end} onChange={(e) => setFormData({...formData, end: Number(e.target.value)})}>
                          {endSlots.map(t => <option key={t} value={t}>{t === 24 ? '24:00' : (t % 1 === 0 ? `${t}:00` : `${Math.floor(t)}:30`)}</option>)}
                        </select>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleReserve(piano)}
                      className="w-full bg-blue-600 text-white font-bold py-5 rounded-[22px] shadow-xl shadow-blue-200 active:scale-[0.97] transition-all text-base"
                    >
                      예약 신청하기
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}