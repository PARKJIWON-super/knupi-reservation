'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ReservationPage() {
  const pianos = ["1번 피아노", "2번 피아노", "3번 피아노", "업라이트 피아노"];
  const timeSlots = Array.from({ length: 31 }, (_, i) => 9 + i * 0.5);

  const [dbReservations, setDbReservations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(0);
  
  // 현재 입력창이 열려있는 피아노 관리 (null이면 닫힘)
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

    const { error } = await supabase
      .from('reservations')
      .insert([
        { 
          user_name: formData.name, 
          student_id: formData.studentId, 
          phone: formData.phone,
          piano_name: pianoName,
          data: String(selectedDate),
          start_time: Number(formData.start),
          end_time: Number(formData.end)
        }
      ]);

    if (error) {
      alert("예약 중 오류가 발생했습니다.");
    } else {
      alert("🎉 예약이 성공적으로 완료되었습니다!");
      setActivePiano(null); // 입력창 닫기
      fetchReservations();
    }
  };

  const isReserved = (pianoName: string, time: number) => {
    return dbReservations.some(res => 
      res.piano_name === pianoName && 
      String(res.data) === String(selectedDate) && 
      time >= res.start_time && time < res.end_time
    );
  };

  const getReservationInfo = (pianoName: string, time: number) => {
    return dbReservations.find(res => 
      res.piano_name === pianoName && 
      String(res.data) === String(selectedDate) && 
      time >= res.start_time && time < res.end_time
    );
  };

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: d.toLocaleDateString('ko-KR', { weekday: 'short' }),
      date: d.getDate()
    };
  });

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-20 font-sans text-[#1A1F27]">
      {/* 상단 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">날짜 및 연습실 선택</h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        {/* 날짜 선택 섹션 */}
        <section className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-2">
            {dates.map((d, i) => (
              <button key={i} onClick={() => { setSelectedDate(i); setActivePiano(null); }}
                className={`flex-shrink-0 w-14 py-3 rounded-2xl flex flex-col items-center transition-all ${selectedDate === i ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}>
                <span className="text-[10px] font-bold mb-1">{d.day}</span>
                <span className="text-lg font-extrabold">{d.date}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 연습실 목록 (입력창 포함형) */}
        <section className="space-y-4">
          {pianos.map((piano, idx) => {
            const isOpen = activePiano === piano;
            return (
              <div key={piano} className={`bg-white rounded-[24px] overflow-hidden shadow-sm border-2 transition-all ${isOpen ? 'border-blue-500' : 'border-gray-100'}`}>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">{idx + 1}</div>
                      <h3 className="font-bold">{piano}</h3>
                    </div>
                    <button 
                      onClick={() => setActivePiano(isOpen ? null : piano)}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${isOpen ? 'bg-gray-100 text-gray-500' : 'bg-blue-600 text-white shadow-md'}`}
                    >
                      {isOpen ? '닫기' : '선택'}
                    </button>
                  </div>

                  {/* 타임라인 바 (기존 툴팁 로직 유지) */}
                  <div className="relative pt-2">
                    <div className="flex gap-[1px] h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                      {timeSlots.map(t => {
                        const res = getReservationInfo(piano, t);
                        return (
                          <div 
                            key={t} 
                            className={`flex-1 transition-colors ${res ? 'bg-gray-300' : 'bg-white hover:bg-blue-50'}`}
                            title={res ? `${res.user_name} 님 예약 중` : `${t}:00 이용 가능`}
                          ></div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] text-gray-300 font-bold px-1 uppercase">
                      <span>09:00</span>
                      <span>13:00</span>
                      <span>18:00</span>
                      <span>24:00</span>
                    </div>
                  </div>
                </div>

                {/* 선택 시 나타나는 인라인 입력 폼 */}
                {isOpen && (
                  <div className="bg-[#F8F9FF] p-6 border-t border-blue-50 space-y-4">
                    <h4 className="text-xs font-bold text-blue-600 px-1">신청 정보 입력</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="이름" className="p-4 bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm border border-gray-100" 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} />
                      <input type="text" placeholder="학번 (10자리)" className="p-4 bg-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm border border-gray-100" 
                        onChange={(e) => setFormData({...formData, studentId: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 ml-1">시작 시간</label>
                        <select className="p-4 bg-white rounded-xl outline-none text-sm border border-gray-100" value={formData.start} onChange={(e) => setFormData({...formData, start: Number(e.target.value)})}>
                          {timeSlots.map(t => <option key={t} value={t}>{t % 1 === 0 ? `${t}:00` : `${Math.floor(t)}:30`}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 ml-1">종료 시간</label>
                        <select className="p-4 bg-white rounded-xl outline-none text-sm border border-gray-100" value={formData.end} onChange={(e) => setFormData({...formData, end: Number(e.target.value)})}>
                          {timeSlots.map(t => <option key={t} value={t}>{t % 1 === 0 ? `${t}:00` : `${Math.floor(t)}:30`}</option>)}
                        </select>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleReserve(piano)}
                      className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100 active:scale-[0.98] transition-all"
                    >
                      해당 피아노 예약 완료
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <div className="flex justify-center gap-4 mt-6 text-[11px] font-bold text-gray-400 uppercase">
           <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-gray-200 rounded-sm"></div> 예약가능</div>
           <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-300 rounded-sm"></div> 예약불가</div>
        </div>
      </div>
    </main>
  );
}