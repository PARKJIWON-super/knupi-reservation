'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // 아까 만든 설정 파일을 불러옵니다.

export default function ReservationPage() {
  const pianos = ["1번 피아노", "2번 피아노", "3번 피아노", "업라이트 피아노"];
  const timeSlots = Array.from({ length: 30 }, (_, i) => 9 + i * 0.5);

  // 상태 관리
  const [selectedDate, setSelectedDate] = useState(0);
  const [dbReservations, setDbReservations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    phone: '',
    piano: '',
    start: 9,
    end: 10
  });

  // 1. DB에서 예약 데이터 불러오기
  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*');
    if (data) setDbReservations(data);
    if (error) console.error('Error fetching:', error);
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  // 2. 예약 신청 함수 (DB 저장)
  const handleReserve = async () => {
    if (!formData.name || !formData.studentId || !formData.piano) {
      alert("모든 정보를 입력하고 피아노를 선택해주세요!");
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
          date_index: selectedDate, // 0(오늘), 1(내일)...
          start_time: Number(formData.start),
          end_time: Number(formData.end)
        }
      ]);

    if (error) {
      alert("예약 중 오류가 발생했습니다.");
    } else {
      alert("예약이 성공적으로 완료되었습니다!");
      fetchReservations(); // 목록 새로고침
    }
  };

  // 3. 특정 시간이 예약되었는지 확인
  const isReserved = (pianoName: string, time: number) => {
    return dbReservations.some(res => 
      res.piano_name === pianoName && 
      res.date_index === selectedDate && 
      time >= res.start_time && time < res.end_time
    );
  };

  // 날짜 계산 로직 (오늘부터 14일)
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { day: d.toLocaleDateString('ko-KR', { weekday: 'short' }), date: d.getDate() };
  });

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-32">
      {/* 상단 헤더 및 날짜 선택 UI (기존 디자인 유지) */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        
        {/* 예약자 정보 입력 섹션 */}
        <section className="bg-white rounded-[24px] p-6 shadow-sm mb-8">
          <h2 className="font-bold mb-4 text-gray-800">1. 정보 입력</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input type="text" placeholder="이름" className="p-4 bg-[#F1F3F5] rounded-xl outline-none text-sm" 
              onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <input type="text" placeholder="학번" className="p-4 bg-[#F1F3F5] rounded-xl outline-none text-sm" 
              onChange={(e) => setFormData({...formData, studentId: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select className="p-4 bg-[#F1F3F5] rounded-xl text-sm" onChange={(e) => setFormData({...formData, start: Number(e.target.value)})}>
              {timeSlots.map(t => <option key={t} value={t}>{t}:00</option>)}
            </select>
            <select className="p-4 bg-[#F1F3F5] rounded-xl text-sm" onChange={(e) => setFormData({...formData, end: Number(e.target.value)})}>
              {timeSlots.map(t => <option key={t} value={t}>{t}:00</option>)}
            </select>
          </div>
        </section>

        {/* 피아노 선택 및 타임라인 섹션 */}
        <section className="space-y-4">
          <h2 className="font-bold px-1 text-gray-800">2. 연습실 선택</h2>
          {pianos.map((piano) => (
            <div key={piano} className={`bg-white rounded-[24px] p-5 shadow-sm border-2 transition-all ${formData.piano === piano ? 'border-blue-500' : 'border-transparent'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">{piano}</h3>
                <button 
                  onClick={() => setFormData({...formData, piano: piano})}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${formData.piano === piano ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {formData.piano === piano ? '선택됨' : '선택하기'}
                </button>
              </div>
              {/* 타임라인 바 */}
              <div className="flex gap-[1px] h-3 bg-gray-100 rounded-full overflow-hidden">
                {timeSlots.map(t => (
                  <div key={t} className={`flex-1 ${isReserved(piano, t) ? 'bg-gray-300' : 'bg-white'}`}></div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* 하단 신청 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t">
        <button onClick={handleReserve} className="max-w-2xl mx-auto w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all">
          예약 신청 완료
        </button>
      </div>
    </main>
  );
}