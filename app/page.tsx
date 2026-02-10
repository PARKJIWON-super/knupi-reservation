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

  // 시간 포맷팅 (13.5 -> 13:30)
  const formatTime = (time: number) => {
    const hours = Math.floor(time);
    const minutes = (time % 1) === 0.5 ? '30' : '00';
    return `${hours}:${minutes}`;
  };

  // 랭킹 데이터 집계
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

  // 예약 조회 로직
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
    <main className="min-h-screen bg-[#F9FAFB] font-['Pretendard'] text-[#1A1A1A] flex flex-col items-center overflow-x-hidden">
      
      {/* 🎨 상단 헤더 (Radial Gradient & Headline) */}
      <div 
        className="w-full max-w-[540px] pt-[63px] pb-[120px] px-[32px] rounded-b-[15px] transition-all relative"
        style={{ background: 'radial-gradient(137.53% 99.23% at 92.41% 7.26%, #FFF5E4 0%, #C7D4F4 100%)' }}
      >
        <h1 className="text-[32px] font-bold leading-[38px] tracking-[-0.03em] mb-1">
          Knupi Reservation
        </h1>
        <p className="text-[16px] font-normal tracking-[-0.03em] text-[#383838]">
          크누피 연습실 예약
        </p>
      </div>

      {/* 📦 가변 컨텐츠 영역 (Auto Layout - gap: 65px) */}
      <div className="w-full max-w-[540px] -mt-[80px] px-[20px] flex flex-col gap-[65px] pb-[80px] relative z-10">
        
        {/* 1️⃣ 예약 서비스 섹션 */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-black px-1">예약 서비스</h2>
          <div className="flex flex-col gap-[10px]">
            <Link href="/reservation" className="block group">
              <div className="flex justify-between items-center w-full h-[105px] px-[30px] bg-white/30 backdrop-blur-[20px] rounded-[20px] border border-white/40 shadow-sm transition-all active:scale-[0.98]">
                <div className="flex flex-col gap-[8px]">
                  <span className="text-[20px] font-semibold tracking-[-0.03em]">연습실 예약하기</span>
                  <span className="text-[16px] text-[#B2B2B2] tracking-[-0.03em]">실시간 현황 확인 및 예약</span>
                </div>
                <div className="w-[24px] h-[24px] flex items-center justify-center bg-[#D9D9D9] rounded-full group-hover:bg-black transition-colors">
                  <svg width="8" height="13" viewBox="0 0 8 13" fill="none"><path d="M1.5 1.5L6.5 6.5L1.5 11.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </Link>
            <div onClick={() => { setShowLookup(!showLookup); setMyReservations([]); }}
              className="flex justify-between items-center w-full h-[105px] px-[30px] bg-white/30 backdrop-blur-[20px] rounded-[20px] border border-white/40 shadow-sm cursor-pointer transition-all active:scale-[0.98] group">
              <div className="flex flex-col gap-[8px]">
                <span className="text-[20px] font-semibold tracking-[-0.03em]">내 예약 확인하기</span>
                <span className="text-[16px] text-[#B2B2B2] tracking-[-0.03em]">이름과 학번으로 조회</span>
              </div>
              <div className="w-[24px] h-[24px] flex items-center justify-center bg-[#D9D9D9] rounded-full group-hover:bg-black transition-colors">
                <svg width="8" height="13" viewBox="0 0 8 13" fill="none"><path d="M1.5 1.5L6.5 6.5L1.5 11.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>

          {/* 조회 폼 */}
          {showLookup && (
            <div className="mt-2 p-6 bg-white/60 backdrop-blur-2xl rounded-[20px] border border-white/40 shadow-xl animate-in fade-in slide-in-from-top-4">
              <div className="flex flex-col gap-3">
                <input type="text" placeholder="이름" className="w-full p-4 rounded-[12px] bg-white border-0 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-300" onChange={(e) => setInfo({...info, name: e.target.value})} />
                <input type="text" placeholder="학번" className="w-full p-4 rounded-[12px] bg-white border-0 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-300" onChange={(e) => setInfo({...info, studentId: e.target.value})} />
                <button onClick={handleSearch} disabled={isSearching} className="w-full bg-black text-white font-bold py-4 rounded-[12px] text-sm shadow-lg active:scale-95 transition-all">조회하기</button>
                <div className="mt-4 flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {myReservations.map((res) => (
                    <div key={res.id} className="bg-white p-5 rounded-[12px] shadow-sm flex justify-between items-center border border-blue-50">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 block mb-1 uppercase tracking-tight">{res.piano_name}</span>
                        <p className="text-sm font-bold text-gray-800">{res.data}</p>
                        <p className="text-[11px] text-gray-400 font-medium">{formatTime(res.start_time)} - {formatTime(res.end_time)}</p>
                      </div>
                      <button onClick={() => handleDelete(res.id)} className="text-red-500 text-xs font-bold px-3 py-2 hover:bg-red-50 rounded-xl transition-colors">취소</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2️⃣ 피아노 배치도 (Vector & Matrix CSS 완벽 적용) */}
        <section className="flex flex-col gap-[5px]">
          <h2 className="text-[24px] font-semibold tracking-[-0.03em] px-1 py-[10px]">피아노 배치도</h2>
          <div className="w-full aspect-[439.59/184.79] bg-white/17 backdrop-blur-md rounded-[15px] border border-white/20 relative overflow-hidden flex items-center justify-center">
            <div className="relative w-[70%] h-[89%]">
              {/* 102호 구역 */}
              <div className="absolute left-[39.21%] top-[37.32%] w-[19.19%] h-[32.66%] bg-[#C7D4F4]/45 rounded-sm" style={{ transform: 'rotate(-90deg)' }}></div>
              <span className="absolute left-[42.14%] top-[83.68%] text-[14px] font-semibold text-[#333333]">102호</span>
              <span className="absolute left-[43.51%] top-[25.58%] text-[14px] font-semibold text-[#808080]">3</span>
              <span className="absolute left-[48.82%] top-[25.58%] text-[14px] font-semibold text-[#808080]">2</span>
              
              {/* 103호 구역 */}
              <div className="absolute left-[56.44%] top-[37.32%] w-[19.18%] h-[46.09%] bg-[#C7D4F4]/45 rounded-sm" style={{ transform: 'rotate(-90deg)' }}></div>
              <span className="absolute left-[60.29%] top-[83.68%] text-[14px] font-semibold text-[#333333]">103호</span>
              <div className="absolute left-[50.19%] top-[65.56%] w-[2.76%] h-[10.68%] bg-[#C7D4F4]"></div>
              <span className="absolute left-[53.57%] top-[66.3%] text-[14px] font-semibold text-[#808080]">1</span>
              
              {/* 업라이트 */}
              <div className="absolute left-[70.33%] top-[69.5%] w-[5.2%] h-[6.39%] bg-[#C7D4F4]" style={{ transform: 'matrix(0.65, -0.76, 0.76, 0.65, 0, 0)' }}></div>
              <span className="absolute left-[74.82%] top-[76.65%] text-[14px] font-semibold text-[#808080] whitespace-nowrap">업라이트</span>
            </div>
          </div>
        </section>

        {/* 3️⃣ 랭킹 섹션 (Frame 109 수치 적용) */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[24px] font-semibold tracking-[-0.03em] px-1">{currentMonth}월의 랭킹 TOP 3</h2>
          <div className="w-full h-[181px] bg-white/20 backdrop-blur-lg rounded-[20px] flex items-end justify-center px-[15%] pb-[20px] gap-[10px] border border-white/20">
            {rankings[1] && (
              <div className="flex-1 bg-[#C7D4F4]/55 border border-[#B9C8ED] rounded-[5px] flex flex-col items-center justify-center py-2" style={{ height: '73.11px' }}>
                <span className="text-[16px] font-semibold text-[#808080]">{rankings[1].name}</span>
                <span className="text-[14px] font-semibold text-[#808080]">{rankings[1].total}h</span>
              </div>
            )}
            {rankings[0] && (
              <div className="flex-1 bg-[#C7D4F4] border border-[#B9C8ED] rounded-[5px] flex flex-col items-center justify-center py-2 shadow-lg" style={{ height: '131px' }}>
                <span className="text-[16px] font-bold text-black">{rankings[0].name}</span>
                <span className="text-[14px] font-bold text-black">{rankings[0].total}h</span>
              </div>
            )}
            {rankings[2] && (
              <div className="flex-1 bg-[#C7D4F4]/55 border border-[#B9C8ED] rounded-[5px] flex flex-col items-center justify-center py-2" style={{ height: '46px' }}>
                <span className="text-[16px] font-semibold text-[#808080]">{rankings[2].name}</span>
                <span className="text-[14px] font-semibold text-[#808080]">{rankings[2].total}h</span>
              </div>
            )}
          </div>
        </section>

        {/* 4️⃣ 이용 주의사항 (Frame 50 / Bullet Point 디자인) */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[24px] font-semibold tracking-[-0.03em] px-1">이용 주의사항</h2>
          <div className="w-full min-h-[161px] p-[18px_25px] bg-white/30 rounded-[20px] backdrop-blur-md border border-white/20">
            <ul className="flex flex-col gap-[12px]">
              {['음식물 반입 금지 및 뒷정리 필수', '노쇼 시 향후 이용이 제한될 수 있음', '부정 정보 예약 시 강제 취소 가능'].map((text, i) => (
                <li key={i} className="flex items-center gap-[10px] text-[16px] text-[#333333] tracking-[-0.03em]">
                  <div className="w-[3.7px] h-[3.7px] bg-[#808080] rounded-full shrink-0"></div>
                  <span>{text}</span>
                </li>
              ))}
              <li className="flex items-center gap-[10px] text-[16px] pt-2 border-t border-black/5 mt-1">
                <div className="w-[3.7px] h-[3.7px] bg-[#808080] rounded-full shrink-0"></div>
                <span className="text-gray-400">문의: 집행부 <a href="https://open.kakao.com/o/s5DRwRei" target="_blank" className="text-blue-600 font-bold underline decoration-blue-200 underline-offset-4">사이소리함</a></span>
              </li>
            </ul>
          </div>
        </section>

        {/* 👣 푸터 */}
        <footer className="text-center pt-[10px] pb-[30px]">
          <p className="text-[12px] font-light tracking-[0.04em] text-[#999999]">
            © KYUNGPOOK NATIONAL UNIV. PIANO CLUB KNUPI
          </p>
        </footer>
      </div>
    </main>
  );
}
