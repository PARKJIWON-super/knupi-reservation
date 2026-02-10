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
    if (!error) {
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
    <main className="min-h-screen bg-[#F3F6FC] font-['Pretendard'] text-[#1A1A1A] flex flex-col items-center overflow-x-hidden">
      
      {/* 🎨 상단 헤더: max-width와 상대적 padding 적용 */}
      <div 
        className="w-full max-w-[540px] pt-[12%] pb-[18%] px-[6%] rounded-b-[20px] transition-all"
        style={{ background: 'radial-gradient(137.53% 99.23% at 92.41% 7.26%, #FFF5E4 0%, #C7D4F4 100%)' }}
      >
        <h1 className="text-[7.5vw] min-[480px]:text-[32px] font-bold leading-tight tracking-[-0.03em] mb-1">
          Knupi Reservation
        </h1>
        <p className="text-[4vw] min-[480px]:text-[16px] font-normal tracking-[-0.03em] text-[#383838]">
          크누피 연습실 예약
        </p>
      </div>

      {/* 📦 가변 컨텐츠 영역: absolute를 제거하여 흐름에 맡김 */}
      <div className="w-full max-w-[540px] -mt-[12%] px-[5%] flex flex-col gap-[8vh] pb-[10vh]">
        
        {/* 1️⃣ 예약 서비스 */}
        <section className="flex flex-col gap-[14px]">
          <h2 className="text-[20px] font-semibold tracking-[-0.03em] px-1">예약 서비스</h2>
          <div className="flex flex-col gap-[10px]">
            <Link href="/reservation" className="block group">
              <div className="flex justify-between items-center w-full min-h-[90px] px-[6%] py-[20px] bg-white/40 backdrop-blur-xl rounded-[20px] border border-white/40 shadow-sm transition-all active:scale-[0.98]">
                <div className="flex flex-col gap-[4px]">
                  <span className="text-[18px] font-semibold tracking-[-0.03em]">연습실 예약하기</span>
                  <span className="text-[14px] text-[#B2B2B2] tracking-[-0.03em]">실시간 현황 확인 및 예약</span>
                </div>
                <div className="w-[24px] h-[24px] opacity-30 group-hover:opacity-100 transition-opacity">
                   <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>
            </Link>
            <div onClick={() => setShowLookup(!showLookup)} className="flex justify-between items-center w-full min-h-[90px] px-[6%] py-[20px] bg-white/40 backdrop-blur-xl rounded-[20px] border border-white/40 shadow-sm cursor-pointer transition-all active:scale-[0.98]">
              <div className="flex flex-col gap-[4px]">
                <span className="text-[18px] font-semibold tracking-[-0.03em]">내 예약 확인하기</span>
                <span className="text-[14px] text-[#B2B2B2] tracking-[-0.03em]">이름과 학번으로 조회</span>
              </div>
              <div className="w-[24px] h-[24px] opacity-30">
                 <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
              </div>
            </div>
          </div>

          {/* 조회 폼 (가변 애니메이션) */}
          {showLookup && (
            <div className="mt-2 p-[6%] bg-white/60 backdrop-blur-2xl rounded-[20px] border border-white/40 shadow-xl animate-in fade-in slide-in-from-top-4">
              <div className="flex flex-col gap-3">
                <input type="text" placeholder="이름" className="w-full p-4 rounded-[12px] bg-white border-0 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-300" onChange={(e) => setInfo({...info, name: e.target.value})} />
                <input type="text" placeholder="학번" className="w-full p-4 rounded-[12px] bg-white border-0 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-300" onChange={(e) => setInfo({...info, studentId: e.target.value})} />
                <button onClick={handleSearch} disabled={isSearching} className="w-full bg-black text-white font-bold py-4 rounded-[12px] text-sm shadow-lg active:scale-95 transition-all">조회하기</button>
                <div className="mt-4 flex flex-col gap-3 max-h-[250px] overflow-y-auto">
                  {myReservations.map((res) => (
                    <div key={res.id} className="bg-white p-4 rounded-[12px] shadow-sm flex justify-between items-center border border-blue-50">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 block mb-1 uppercase">{res.piano_name}</span>
                        <p className="text-sm font-bold">{res.data}</p>
                        <p className="text-[11px] text-gray-400">{formatTime(res.start_time)} - {formatTime(res.end_time)}</p>
                      </div>
                      <button onClick={() => handleDelete(res.id)} className="text-red-500 text-xs font-bold px-3 py-2 hover:bg-red-50 rounded-lg">취소</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2️⃣ 피아노 배치도: aspect-ratio를 활용한 반응형 정석 */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[20px] font-semibold tracking-[-0.03em] px-1">피아노 배치도</h2>
          <div className="w-full aspect-[440/185] bg-white/20 backdrop-blur-md rounded-[15px] border border-white/30 relative overflow-hidden flex items-center justify-center">
            {/* 위치를 %로 잡아 어떤 해상도에서도 위치 고정 */}
            <div className="absolute left-[39%] top-[37%] w-[16%] h-[30%] bg-[#C7D4F4]/40 rotate-[-90deg]"></div>
            <div className="absolute left-[56%] top-[37%] w-[20%] h-[40%] bg-[#C7D4F4]/40 rotate-[-90deg]"></div>
            <span className="absolute left-[42%] top-[82%] text-[3vw] min-[480px]:text-[12px] font-semibold text-[#333333]">102호</span>
            <span className="absolute left-[60%] top-[82%] text-[3vw] min-[480px]:text-[12px] font-semibold text-[#333333]">103호</span>
            <span className="absolute left-[43%] top-[25%] text-[3.5vw] min-[480px]:text-[13px] font-bold text-[#808080]">3</span>
            <span className="absolute left-[48%] top-[25%] text-[3.5vw] min-[480px]:text-[13px] font-bold text-[#808080]">2</span>
            <span className="absolute left-[53%] top-[66%] text-[3.5vw] min-[480px]:text-[13px] font-bold text-[#808080]">1</span>
            <span className="absolute left-[74%] top-[74%] text-[3vw] min-[480px]:text-[12px] font-semibold text-[#808080]">업라이트</span>
          </div>
        </section>

        {/* 3️⃣ 랭킹 섹션: 높이(height)를 % 비율로 설정 */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[20px] font-semibold tracking-[-0.03em] px-1">{currentMonth}월의 랭킹 TOP 3</h2>
          <div className="w-full h-[180px] bg-white/20 backdrop-blur-lg rounded-[20px] flex items-end justify-center px-[8%] pb-[20px] gap-[2%] border border-white/20 shadow-sm">
            {rankings[1] && (
              <div className="flex-1 bg-[#C7D4F4]/60 border border-[#B9C8ED] rounded-[5px] flex flex-col items-center justify-center py-2 transition-all" style={{ height: '55%' }}>
                <span className="text-[14px] font-bold text-[#666]">{rankings[1].name}</span>
                <span className="text-[12px] font-medium text-[#666]">{rankings[1].total}h</span>
              </div>
            )}
            {rankings[0] && (
              <div className="flex-1 bg-[#C7D4F4] border border-[#B9C8ED] rounded-[5px] flex flex-col items-center justify-center py-2 shadow-lg transition-all" style={{ height: '90%' }}>
                <span className="text-[15px] font-black">{rankings[0].name}</span>
                <span className="text-[13px] font-bold opacity-70">{rankings[0].total}h</span>
              </div>
            )}
            {rankings[2] && (
              <div className="flex-1 bg-[#C7D4F4]/40 border border-[#B9C8ED] rounded-[5px] flex flex-col items-center justify-center py-2 transition-all" style={{ height: '35%' }}>
                <span className="text-[14px] font-bold text-[#666]">{rankings[2].name}</span>
                <span className="text-[12px] font-medium text-[#666]">{rankings[2].total}h</span>
              </div>
            )}
          </div>
        </section>

        {/* 4️⃣ 주의사항: Flex 레이아웃 적용 */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[20px] font-semibold tracking-[-0.03em] px-1">이용 주의사항</h2>
          <div className="w-full p-[6%] bg-white/30 rounded-[20px] backdrop-blur-md shadow-sm">
            <ul className="flex flex-col gap-[12px] text-[15px] text-[#444] font-medium leading-snug">
              {['음식물 반입 금지 및 뒷정리 필수', '노쇼 시 향후 이용이 제한될 수 있음', '부정 예약 시 강제 취소될 수 있음'].map((text, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-1 h-1 mt-2.5 bg-[#808080] rounded-full shrink-0"></span>
                  <span>{text}</span>
                </li>
              ))}
              <li className="flex gap-3 pt-3 border-t border-black/5 mt-2">
                <span className="w-1 h-1 mt-2.5 bg-[#808080] rounded-full shrink-0"></span>
                <span className="text-gray-400 font-normal">문의: 집행부 <a href="https://open.kakao.com/o/s5DRwRei" target="_blank" className="text-blue-600 font-bold underline decoration-blue-200 underline-offset-4">사이소리함</a></span>
              </li>
            </ul>
          </div>
        </section>

        {/* 👣 푸터 */}
        <footer className="text-center pt-[10px] pb-[20px]">
          <p className="text-[11px] font-light tracking-[0.04em] text-[#999999] opacity-70">
            © KYUNGPOOK NATIONAL UNIV. PIANO CLUB KNUPI
          </p>
        </footer>
      </div>
    </main>
  );
}
