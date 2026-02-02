'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [showLookup, setShowLookup] = useState(false);
  const [info, setInfo] = useState({ name: '', studentId: '' });
  const [myReservations, setMyReservations] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 1. 내 예약 조회 함수
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
      console.error("조회 에러:", error);
      alert("조회 중 오류가 발생했습니다.");
    } else {
      setMyReservations(data || []);
      if (data?.length === 0) alert("검색된 예약 내역이 없습니다.");
    }
    setIsSearching(false);
  };

  // 2. ★ 예약 취소 (삭제) 로직 추가 ★
  const handleDelete = async (id: string) => {
    // 사용자에게 한 번 더 확인
    if (!confirm("정말로 이 예약을 취소하시겠습니까?")) return;

    // Supabase에서 해당 ID의 행(row) 삭제
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("삭제 에러:", error);
      alert("취소 처리 중 오류가 발생했습니다.");
    } else {
      alert("✅ 예약이 성공적으로 취소되었습니다.");
      
      // 삭제 후 UI에서 즉시 반영하기 위해 목록을 다시 불러옴
      handleSearch(); 
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      {/* 헤더 섹션 (기존 레이아웃 유지) */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 mb-4 flex items-center gap-4 border border-gray-100">
        <div className="bg-blue-600 p-3 rounded-xl text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 10l12-3" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">크누피 연습실 예약</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">KNUPI Practice Room</p>
        </div>
      </div>

      {/* 주의사항 섹션 */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 mb-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-red-500 text-lg">⚠️</span>
          <h3 className="font-bold text-gray-800">이용 주의사항</h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-600 font-medium">
          <li className="flex gap-2"><span className="text-blue-500">•</span><span>이용 가능 시간: 09:00 ~ 24:00</span></li>
          <li className="flex gap-2"><span className="text-blue-500">•</span><span>음식물 반입 금지 및 뒷정리 필수</span></li>
        </ul>
      </div>

      {/* 예약하기 버튼 */}
      <Link href="/reservation" className="w-full max-w-md mb-4">
        <div className="bg-blue-600 rounded-2xl p-6 text-white flex justify-between items-center cursor-pointer hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
          <div>
            <h2 className="text-xl font-bold">연습실 예약하기</h2>
            <p className="text-sm opacity-80 font-medium">실시간 현황 확인 및 예약</p>
          </div>
          <div className="bg-white/20 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </Link>

      {/* 예약 확인하기 버튼 */}
      <div 
        onClick={() => { setShowLookup(!showLookup); setMyReservations([]); }}
        className="w-full max-w-md bg-white rounded-2xl p-6 mb-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-all border border-gray-200"
      >
        <div>
          <h2 className="text-lg font-bold text-gray-700">내 예약 확인하기</h2>
          <p className="text-sm text-gray-400 font-medium">이름과 학번으로 조회</p>
        </div>
        <div className="bg-gray-100 rounded-full p-2 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* 예약 조회 입력창 및 결과 리스트 */}
      {showLookup && (
        <div className="w-full max-w-md bg-blue-50 rounded-2xl p-6 mb-4 border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-bold text-blue-700 mb-4 text-center">조회 정보를 입력하세요</h3>
          <div className="space-y-3">
            <input 
              type="text" placeholder="이름" 
              className="w-full p-3 rounded-xl border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
              onChange={(e) => setInfo({...info, name: e.target.value})}
            />
            <input 
              type="text" placeholder="학번" 
              className="w-full p-3 rounded-xl border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
              onChange={(e) => setInfo({...info, studentId: e.target.value})}
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-sm shadow-md active:scale-95 transition-all"
            >
              {isSearching ? '조회 중...' : '조회하기'}
            </button>

            {/* 조회 결과 리스트 */}
            <div className="mt-4 space-y-2">
              {myReservations.map((res) => (
                <div key={res.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border border-blue-100">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 block">{res.piano_name}</span>
                    <p className="text-sm font-bold text-gray-800">{res.data === '0' ? '오늘' : `${res.data}일 뒤`} 예약</p>
                    <p className="text-[11px] text-gray-400 font-medium">{res.start_time}:00 - {res.end_time}:00</p>
                  </div>
                  {/* ★ 취소 버튼에 handleDelete 연결 ★ */}
                  <button 
                    onClick={() => handleDelete(res.id)}
                    className="text-red-500 text-[11px] font-bold p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto py-8 text-[10px] text-gray-300 font-bold tracking-widest uppercase">
        © KYUNGPOOK NATIONAL UNIV. PIANO CLUB KNUPI
      </footer>
    </main>
  );
}