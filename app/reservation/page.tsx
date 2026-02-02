'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // 설정해두신 supabase 파일을 불러옵니다.

export default function ReservationPage() {
  const pianos = ["1번 피아노", "2번 피아노", "3번 피아노", "업라이트 피아노"];
  const timeSlots = Array.from({ length: 30 }, (_, i) => 9 + i * 0.5); // 09:00 ~ 24:00 (30분 단위)

  // 상태 관리: DB에서 가져온 진짜 데이터를 담습니다.
  const [dbReservations, setDbReservations] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(0);
  
  // 입력 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    phone: '',
    piano: '',
    start: 9,
    end: 10
  });

  // 1. 데이터베이스에서 예약 내역 가져오기
  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*');
    
    if (error) {
      console.error('Error fetching reservations:', error);
    } else {
      setDbReservations(data || []);
    }
  };

  // 페이지 로드 시 및 날짜 변경 시 데이터 새로고침
  useEffect(() => {
    fetchReservations();
  }, [selectedDate]);

  // 2. 예약 신청 함수 (DB에 저장)
  const handleReserve = async () => {
    if (!formData.name || !formData.studentId || !formData.piano) {
      alert("이름, 학번을 입력하고 피아노를 선택해주세요!");
      return;
    }

    const { error } = await supabase
      .from('reservations')
      .insert([
        {
          user_name: formData.name,
          student_id: formData.studentId,
          phone: formData.phone,
          piano_name: formData.piano,
          date_index: selectedDate,
          start_time: formData.start,
          end_time: formData.end
        }
      ]);

    if (error) {
      alert("예약 신청 중 오류가 발생했습니다.");
      console.error(error);
    } else {
      alert("예약이 완료되었습니다!");
      fetchReservations(); // 저장 후 즉시 목록 새로고침
    }
  };

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: d.toLocaleDateString('ko-KR', { weekday: 'short' }),
      date: d.getDate(),
      full: d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    };
  });
  
  // 3. 특정 시간대가 예약되었는지 확인 (DB 데이터 기준)
  const isReserved = (pianoName: string, time: number) => {
    return dbReservations.some(res => 
      res.piano_name === pianoName && 
      res.date_index === selectedDate && 
      time >= res.start_time && time < res.end_time
    );
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-32 font-sans text-[#1A1F27]">
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
              <button key={i} onClick={() => setSelectedDate(i)}
                className={`flex-shrink-0 w-14 py-3 rounded-2xl flex flex-col items-center transition-all ${selectedDate === i ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}>
                <span className="text-[10px] font-bold mb-1">{d.day}</span>
                <span className="text-lg font-extrabold">{d.date}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 연습실 목록 및 타임라인 */}
        <section className="space-y-4">
          {pianos.map((piano, idx) => (
            <div key={piano} className={`bg-white rounded-[24px] p-5 shadow-sm border-2 transition-all ${formData.piano === piano ? 'border-blue-500' : 'border-gray-100'}`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">{idx + 1}</div>
                  <h3 className="font-bold">{piano}</h3>
                </div>
                <button 
                  onClick={() => setFormData({...formData, piano: piano})}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all ${formData.piano === piano ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}`}
                >
                  {formData.piano === piano ? '선택됨' : '선택'}
                </button>
              </div>

              <div className="relative pt-2">
                <div className="flex gap-[1px] h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                  {timeSlots.map(t => {
                    const reserved = isReserved(piano, t);
                    return (
                      <div key={t} className={`flex-1 transition-colors ${reserved ? 'bg-gray-300' : 'bg-white hover:bg-blue-50'}`}></div>
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
          ))}
        </section>

        {/* 정보 입력 및 신청 폼 */}
        <section className="mt-8 bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800 mb-2">예약 정보 입력</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="이름" className="p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <input type="text" placeholder="학번 (10자리)" className="p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              onChange={(e) => setFormData({...formData, studentId: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 ml-1">시작 시간</label>
              <select className="p-4 bg-gray-50 rounded-xl outline-none" onChange={(e) => setFormData({...formData, start: Number(e.target.value)})}>
                {timeSlots.map(t => <option key={t} value={t}>{t}:00</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 ml-1">종료 시간</label>
              <select className="p-4 bg-gray-50 rounded-xl outline-none" onChange={(e) => setFormData({...formData, end: Number(e.target.value)})}>
                {timeSlots.map(t => <option key={t} value={t}>{t}:00</option>)}
              </select>
            </div>
          </div>
        </section>

        <div className="flex justify-center gap-4 mt-6 text-[11px] font-bold text-gray-400 uppercase">
           <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-gray-200 rounded-sm"></div> 예약가능</div>
           <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-300 rounded-sm"></div> 예약불가</div>
        </div>
      </div>

      {/* 하단 신청 완료 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-30">
        <button 
          onClick={handleReserve}
          className="max-w-2xl mx-auto w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 active:scale-[0.98] transition-all"
        >
          예약 신청 완료
        </button>
      </div>
    </main>
  );
}