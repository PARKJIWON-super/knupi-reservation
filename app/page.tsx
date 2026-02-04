'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [showLookup, setShowLookup] = useState(false);
  const [info, setInfo] = useState({ name: '', studentId: '' });
  const [myReservations, setMyReservations] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rankings, setRankings] = useState<{name: string, total: number}[]>([]);
  
  // ★ 현재 월 구하기 (예: 2월)
  const currentMonth = new Date().getMonth() + 1;

  const formatTime = (time: number) => {
    const hours = Math.floor(time);
    const minutes = (time % 1) === 0.5 ? '30' : '00';
    return `${hours}:${minutes}`;
  };

  const fetchRankings = async () => {
    const now = new Date();
    const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const { data } = await supabase.from('reservations').select('user_name, start_time, end_time').gte('data', firstDayOfMonth);
    
    if (data) {
      const aggregate = data.reduce((acc: any, cur) => {
        const duration = cur.end_time - cur.start_time;
        acc[cur.user_name] = (acc[cur.user_name] || 0) + duration;
        return acc;
      }, {});
      const sorted = Object.entries(aggregate)
        .map(([name, total]) => ({ name, total: total as number }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);
      setRankings(sorted);
    }
  };

  useEffect(() => { fetchRankings(); }, []);

  const handleSearch = async () => {
    if (!info.name || !info.studentId) {
      alert("이름과 학번을 입력해주세요.");
      return;
    }
    setIsSearching(true);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let query = supabase.from('reservations').select('*');

    if (info.name === '운영자' && info.studentId === '12345') {
      setIsAdmin(true);
      query = query.order('data', { ascending: true });
    } else {
      setIsAdmin(false);
      query = query.eq('user_name', info.name).eq('student_id', info.studentId).gte('data', today).order('data', { ascending: true });
    }

    const { data, error } = await query;
    if (error) { 
      alert("조회 중 오류가 발생했습니다."); 
    } else { 
      setMyReservations(data || []); 
      if (data?.length === 0) alert("오늘 이후의 예약 내역이 없습니다."); 
    }
    setIsSearching(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 예약을 취소하시겠습니까?")) return;
    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (!error) {
      setMyReservations((prev) => prev.filter((res) => res.id !== id));
      alert("✅ 예약이 취소되었습니다.");
      fetchRankings();
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans text-[#1A1F27]">
      {/* 헤더 섹션 */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 mb-4 flex items-center gap-4 border border-gray-100">
        <div className="bg-blue-600 p-3 rounded-xl text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 10l12-3" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">크누피 연습실 예약</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">KNUPI Practice Room</p>
        </div>
      </div>

      {/* 🏆 월별 예약왕 대시보드 (자동 명칭 변경) */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 mb-4 border border-gray-100">
        <div className="flex justify-between items-end mb-4">
          {/* ★ 이 부분이 매달 자동으로 바뀝니다 ★ */}
          <h3 className="font-bold text-gray-800">🏆 {currentMonth}월의 연습왕 TOP 3</h3>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
            {new Date().toLocaleString('en-US', { month: 'long' })} {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex justify-around items-end gap-2 pt-4">
          {rankings[1] && (
            <div className="flex flex-col items-center flex-1">
              <span className="text-2xl mb-1">🥈</span>
              <div className="w-full bg-gray-50 rounded-t-lg p-2 text-center border-x border-t border-gray-100">
                <p className="text-xs font-bold text-gray-700 truncate">{rankings[1].name}</p>
                <p className="text-[10px] text-blue-500 font-bold">{rankings[1].total}시간</p>
              </div>
              <div className="w-full h-12 bg-gray-100 rounded-b-md"></div>
            </div>
          )}
          {rankings[0] && (
            <div className="flex flex-col items-center flex-1">
              <span className="text-3xl mb-1">🥇</span>
              <div className="w-full bg-blue-50 rounded-t-lg p-3 text-center border-x border-t border-blue-100 relative">
                <p className="text-sm font-black text-blue-700 truncate">{rankings[0].name}</p>
                <p className="text-[11px] text-blue-600 font-black">{rankings[0].total}시간</p>
              </div>
              <div className="w-full h-20 bg-blue-600 rounded-b-md shadow-lg shadow-blue-100"></div>
            </div>
          )}
          {rankings[2] && (
            <div className="flex flex-col items-center flex-1">
              <span className="text-2xl mb-1">🥉</span>
              <div className="w-full bg-orange-50/30 rounded-t-lg p-2 text-center border-x border-t border-orange-100">
                <p className="text-xs font-bold text-gray-700 truncate">{rankings[2].name}</p>
                <p className="text-[10px] text-orange-500 font-bold">{rankings[2].total}시간</p>
              </div>
              <div className="w-full h-8 bg-orange-100/50 rounded-b-md"></div>
            </div>
          )}
        </div>
        {!rankings.length && <p className="text-center text-xs text-gray-300 py-4 font-bold">이번 달 데이터 집계 중...</p>}
      </div>

      {/* 주의사항 섹션 */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 mb-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-red-500 text-lg">⚠️</span>
          <h3 className="font-bold text-gray-800">이용 주의사항</h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-600 font-medium text-center">
          <li className="flex gap-2 justify-center"><span className="text-blue-500">•</span><span>음식물 반입 금지 및 뒷정리 필수</span></li>
          <li className="flex gap-2 justify-center"><span className="text-blue-500">•</span><span>노쇼 시 향후 이용이 제한될 수 있습니다.</span></li>
        </ul>
      </div>

      {/* 예약하기 버튼 */}
      <Link href="/reservation" className="w-full max-w-md mb-4">
        <div className="bg-blue-600 rounded-2xl p-6 text-white flex justify-between items-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
          <div><h2 className="text-xl font-bold">연습실 예약하기</h2><p className="text-sm opacity-80 font-medium">실시간 현황 확인 및 예약</p></div>
          <div className="bg-white/20 rounded-full p-2">→</div>
        </div>
      </Link>

      {/* 내 예약 확인하기 버튼 */}
      <div onClick={() => { setShowLookup(!showLookup); setMyReservations([]); setIsAdmin(false); }}
        className="w-full max-w-md bg-white rounded-2xl p-6 mb-4 flex justify-between items-center cursor-pointer border border-gray-200">
        <div><h2 className="text-lg font-bold text-gray-700">내 예약 확인하기</h2><p className="text-sm text-gray-400 font-medium">오늘부터의 예약 조회 및 취소</p></div>
        <div className="bg-gray-100 rounded-full p-2 text-gray-500">🔍</div>
      </div>

      {showLookup && (
        <div className="w-full max-w-md bg-blue-50 rounded-2xl p-6 mb-4 border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-3">
            <input type="text" placeholder="이름" className="w-full p-4 rounded-xl border-0 text-sm bg-white outline-none" onChange={(e) => setInfo({...info, name: e.target.value})} />
            <input type="text" placeholder="학번" className="w-full p-4 rounded-xl border-0 text-sm bg-white outline-none" onChange={(e) => setInfo({...info, studentId: e.target.value})} />
            <button onClick={handleSearch} disabled={isSearching} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-sm shadow-md">{isSearching ? '조회 중...' : '조회하기'}</button>
            <div className="mt-6 space-y-3">
              {myReservations.map((res) => (
                <div key={res.id} className="bg-white p-5 rounded-2xl shadow-sm flex justify-between items-center border border-blue-50">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 block mb-1 uppercase tracking-tighter">{res.piano_name}</span>
                    <p className="text-sm font-bold text-gray-800">{isAdmin ? `👤 ${res.user_name} | ` : ""}{res.data} 예약</p>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {formatTime(res.start_time)} - {formatTime(res.end_time)}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(res.id)} className="text-red-500 text-xs font-bold px-3 py-2 hover:bg-red-50 rounded-xl transition-colors">{isAdmin ? "강제취소" : "취소하기"}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto py-10 text-[10px] text-gray-300 font-bold tracking-widest uppercase">
        © KYUNGPOOK NATIONAL UNIV. PIANO CLUB KNUPI
      </footer>
    </main>
  );
}
