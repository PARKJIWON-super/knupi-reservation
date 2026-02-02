'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function MainPage() {
  const [showSearch, setShowSearch] = useState(false); // 조회창 표시 여부
  const [info, setInfo] = useState({ name: '', studentId: '' });
  const [myReservations, setMyReservations] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 내 예약 데이터 가져오기 함수
  const handleSearch = async () => {
    if (!info.name || !info.studentId) {
      alert("이름과 학번을 입력해주세요.");
      return;
    }

    setIsSearching(true);
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_name', info.name)
      .eq('student_id', info.studentId)
      .order('data', { ascending: true });

    if (error) {
      alert("조회 중 오류가 발생했습니다.");
    } else {
      setMyReservations(data || []);
    }
    setIsSearching(false);
  };

  // 예약 취소 함수
  const handleDelete = async (id: string) => {
    if (confirm("정말로 이 예약을 취소하시겠습니까?")) {
      const { error } = await supabase.from('reservations').delete().eq('id', id);
      if (!error) {
        alert("예약이 취소되었습니다.");
        handleSearch(); // 목록 새로고침
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* 1. 연습실 예약하기 버튼 */}
      <a href="/reservation" className="block bg-blue-600 p-6 rounded-[24px] text-white shadow-lg shadow-blue-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold mb-1">연습실 예약하기</h2>
            <p className="text-blue-100 text-sm">실시간 현황 확인 및 예약</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">→</div>
        </div>
      </a>

      {/* 2. 내 예약 확인하기 섹션 */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        <button 
          onClick={() => setShowSearch(!showSearch)}
          className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
        >
          <div className="text-left">
            <h2 className="text-xl font-bold text-gray-800">내 예약 확인하기</h2>
            <p className="text-gray-400 text-sm">이름과 학번으로 조회</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-full text-gray-400">🔍</div>
        </button>

        {/* [조회하기 클릭 시 하단에 펼쳐지는 영역] */}
        {showSearch && (
          <div className="p-6 bg-[#F1F6FF] border-t border-blue-50 space-y-4">
            <div className="space-y-3">
              <input 
                type="text" placeholder="이름" 
                className="w-full p-4 bg-white rounded-xl outline-none text-sm border border-blue-100 focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
              />
              <input 
                type="text" placeholder="학번" 
                className="w-full p-4 bg-white rounded-xl outline-none text-sm border border-blue-100 focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setInfo({ ...info, studentId: e.target.value })}
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
              >
                {isSearching ? '조회 중...' : '조회하기'}
              </button>
            </div>

            {/* 조회 결과 리스트 */}
            <div className="mt-6 space-y-3">
              {myReservations.length > 0 ? (
                myReservations.map((res) => (
                  <div key={res.id} className="bg-white p-4 rounded-2xl shadow-sm border border-blue-50 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-blue-500 block mb-1">{res.piano_name}</span>
                      <p className="font-bold text-sm text-gray-800">{res.data === '0' ? '오늘' : `${res.data}일 뒤`} 예약</p>
                      <p className="text-xs text-gray-400 font-medium">{res.start_time}:00 - {res.end_time}:00</p>
                    </div>
                    <button 
                      onClick={() => handleDelete(res.id)}
                      className="text-red-400 text-xs font-bold p-2 hover:bg-red-50 rounded-lg"
                    >
                      취소
                    </button>
                  </div>
                ))
              ) : (
                info.name && !isSearching && <p className="text-center py-4 text-gray-400 text-xs font-medium">검색된 예약 내역이 없습니다.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-8 text-[10px] text-gray-300 font-bold tracking-widest uppercase">
        © KYUNGPOOK NATIONAL UNIV. PIANO CLUB KNUPI
      </footer>
    </div>
  );
}
