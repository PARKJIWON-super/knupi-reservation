'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function ReservationPage() {
  const pianos = ["1번 피아노", "2번 피아노", "3번 피아노", "업라이트 피아노"];
  const timeSlots = Array.from({ length: 30 }, (_, i) => 9 + i * 0.5); // 09:00 ~ 24:00 (30분 단위)

  // [임시 데이터] 나중에는 데이터베이스(DB)에서 가져올 정보입니다.
  // 예: 1번 피아노, 오늘, 13:00 ~ 15:00 예약됨
  const [mockReservations, setMockReservations] = useState([
    { piano: "1번 피아노", date: 0, start: 13, end: 15 },
    { piano: "업라이트 피아노", date: 0, start: 18, end: 20 },
  ]);

  const [selectedDate, setSelectedDate] = useState(0);
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: d.toLocaleDateString('ko-KR', { weekday: 'short' }),
      date: d.getDate(),
      full: d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    };
  });
  
  // 특정 시간대가 예약되었는지 확인하는 함수
  // pianoName은 문자열(string), time은 숫자(number)라고 타입을 지정해줍니다.
  const isReserved = (pianoName: string, time: number) => {
    return mockReservations.some(res => 
      res.piano === pianoName && 
      res.date === selectedDate && 
      time >= res.start && time < res.end
    );
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-32 font-sans">
      {/* 상단 헤더 생략 (기존과 동일) */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-[#1A1F27]">날짜 및 연습실 선택</h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        {/* 날짜 선택 섹션 (기존과 동일) */}
        <section className="mb-6 overflow-x-auto">
          <div className="flex gap-3 pb-2 scrollbar-hide">
            {dates.map((d, i) => (
              <button key={i} onClick={() => setSelectedDate(i)}
                className={`flex-shrink-0 w-14 py-3 rounded-2xl flex flex-col items-center ${selectedDate === i ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}>
                <span className="text-[10px] font-bold mb-1">{d.day}</span>
                <span className="text-lg font-extrabold">{d.date}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 연습실 목록 및 타임라인 차단 로직 */}
        <section className="space-y-4">
          {pianos.map((piano, idx) => (
            <div key={piano} className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">{idx + 1}</div>
                  <h3 className="font-bold text-gray-800">{piano}</h3>
                </div>
                <button className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all">선택</button>
              </div>

              {/* 타임라인 바 - 예약된 시간 표시 */}
              <div className="relative pt-2">
                <div className="flex gap-[1px] h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                  {timeSlots.map(t => {
                    const reserved = isReserved(piano, t);
                    return (
                      <div 
                        key={t} 
                        className={`flex-1 transition-colors ${reserved ? 'bg-gray-300' : 'bg-white hover:bg-blue-50'}`}
                        title={reserved ? "예약됨" : `${t}:00 이용가능`}
                      ></div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-[9px] text-gray-300 font-bold px-1">
                  <span>09:00</span>
                  <span>13:00</span>
                  <span>18:00</span>
                  <span>24:00</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* 하단에 범례 추가 */}
        <div className="flex justify-center gap-4 mt-6 text-[11px] font-bold text-gray-400">
           <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-gray-200 rounded-sm"></div> 예약가능</div>
           <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-300 rounded-sm"></div> 예약불가</div>
        </div>
      </div>

      {/* 정보 입력 및 신청 버튼 생략 (기존과 동일) */}
    </main>
  );
}