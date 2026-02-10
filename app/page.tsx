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
    <main className="min-h-screen bg-[#F3F6FC] font-['Pretendard'] text-[#1A1A1A]">
      {/* 🎨 피그마 상단 그라데이션 영역 (Rectangle 404) */}
      <div 
        className="w-full max-w-[480px] mx-auto pt-16 pb-24 px-8 relative overflow-hidden"
        style={{
          background: 'radial-gradient(137.53% 99.23% at 92.41% 7.26%, #FFF5E4 0%, #C7D4F4 100%)',
          borderRadius: '0 0 15px 15px'
        }}
      >
        <div className="relative z-10">
          <h1 className="text-[32px] font-bold leading-[38px] tracking-[-0.03em] mb-1">
            Knupi Reservation
          </h1>
          <p className="text-[16px] font-normal leading-[19px] tracking-[-0.03em] text-[#383838]">
            크누피 연습실 예약
          </p>
        </div>
      </div>

      {/* 컨텐츠 레이아웃 (Frame 161 간격 적용) */}
      <div className="w-full max-w-[444px] mx-auto -mt-16 px-4 flex flex-col gap-[65px] pb-20 relative z-20">
        
        {/* 예약 서비스 섹션 (Frame 77) */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold px-1">예약 서비스</h2>
          <Link href="/reservation">
            <div className="bg-white rounded-[15px] p-6 flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all group">
              <div>
                <h3 className="text-lg font-bold mb-1">연습실 예약하기</h3>
                <p className="text-sm text-[#999999] font-medium">실시간 현황 확인 및 예약</p>
              </div>
              <div className="text-gray-300 group-hover:text-blue-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </div>
            </div>
          </Link>
          <div 
            onClick={() => { setShowLookup(!showLookup); setMyReservations([]); setIsAdmin(false); }}
            className="bg-white rounded-[15px] p-6 flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] cursor-pointer hover:bg-gray-50 transition-all group"
          >
            <div>
              <h3 className="text-lg font-bold mb-1">내 예약 확인하기</h3>
              <p className="text-sm text-[#999999] font-medium">이름과 학번으로 조회</p>
            </div>
            <div className="text-gray-300 group-hover:text-blue-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </div>
          </div>

          {/* 조회 창 (디자인 통합) */}
          {showLookup && (
            <div className="mt-2 p-6 bg-[#C7D4F4]/20 rounded-[15px] border border-[#C7D4F4]/30 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col gap-3">
                <input type="text" placeholder="이름" className="w-full p-4 rounded-[12px] border-0 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-400" onChange={(e) => setInfo({...info, name: e.target.value})} />
                <input type="text" placeholder="학번" className="w-full p-4 rounded-[12px] border-0 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-400" onChange={(e) => setInfo({...info, studentId: e.target.value})} />
                <button onClick={handleSearch} disabled={isSearching} className="w-full bg-[#1A1A1A] text-white font-bold py-4 rounded-[12px] text-sm shadow-lg active:scale-95 transition-all">조회하기</button>
                <div className="mt-4 flex flex-col gap-3">
                  {myReservations.map((res) => (
                    <div key={res.id} className="bg-white p-5 rounded-[12px] shadow-sm flex justify-between items-center border border-blue-50">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 block mb-1">{res.piano_name}</span>
                        <p className="text-sm font-bold">{isAdmin ? `👤 ${res.user_name} | ` : ""}{res.data}</p>
                        <p className="text-[11px] text-[#999999]">{formatTime(res.start_time)} - {formatTime(res.end_time)}</p>
                      </div>
                      <button onClick={() => handleDelete(res.id)} className="text-red-500 text-xs font-bold px-3 py-2 hover:bg-red-50 rounded-lg transition-colors">취소</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 🏆 연습왕 랭킹 섹션 (디자인 재구성) */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold px-1">{currentMonth}월의 연습왕 TOP 3</h2>
          <div className="bg-white rounded-[20px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white">
            <div className="flex justify-around items-end h-40 gap-4">
              {/* 2등 */}
              {rankings[1] && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="mb-2 text-center">
                    <p className="text-[11px] font-bold text-gray-400">🥈 {rankings[1].name}</p>
                    <p className="text-[10px] text-blue-500 font-bold">{rankings[1].total}h</p>
                  </div>
                  <div className="w-full bg-[#C7D4F4]/40 rounded-t-xl" style={{ height: '60%' }}></div>
                </div>
              )}
              {/* 1등 */}
              {rankings[0] && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="mb-2 text-center">
                    <p className="text-xs font-black text-[#1A1A1A]">🥇 {rankings[0].name}</p>
                    <p className="text-[11px] text-blue-600 font-black">{rankings[0].total}h</p>
                  </div>
                  <div className="w-full bg-[#C7D4F4] rounded-t-xl shadow-[0_0_20px_rgba(199,212,244,0.5)]" style={{ height: '100%' }}></div>
                </div>
              )}
              {/* 3등 */}
              {rankings[2] && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="mb-2 text-center">
                    <p className="text-[11px] font-bold text-gray-400">🥉 {rankings[2].name}</p>
                    <p className="text-[10px] text-orange-400 font-bold">{rankings[2].total}h</p>
                  </div>
                  <div className="w-full bg-[#C7D4F4]/20 rounded-t-xl" style={{ height: '35%' }}></div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 이용 주의사항 */}
        <section className="bg-white rounded-[20px] p-8 border border-white shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">⚠️ 이용 주의사항</h2>
          <ul className="flex flex-col gap-3 text-sm text-[#666666] font-medium leading-relaxed">
            <li className="flex gap-2"><span className="text-blue-400">•</span> 음식물 반입 금지 및 뒷정리 필수</li>
            <li className="flex gap-2"><span className="text-blue-400">•</span> 노쇼 시 향후 이용이 제한될 수 있음</li>
            <li className="flex gap-2"><span className="text-blue-400">•</span> 비동아리원 정보 예약 시 강제 취소 가능</li>
            <li className="flex flex-col mt-2 pt-4 border-t border-gray-50">
              <span className="text-xs text-gray-400">문의: 크누피 집행부</span>
              <a href="https://open.kakao.com/o/s5DRwRei" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline underline-offset-4 mt-1">사이소리함 바로가기</a>
            </li>
          </ul>
        </section>

        {/* 푸터 (디자인 데이터 적용) */}
        <footer className="py-10 text-center">
          <p className="text-[12px] font-light tracking-[0.04em] text-[#999999]">
            © KYUNGPOOK NATIONAL UNIV. PIANO CLUB KNUPI
          </p>
        </footer>
      </div>
    </main>
  );
}
