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
    if (error) { alert("조회 중 오류가 발생했습니다."); } 
    else { setMyReservations(data || []); if (data?.length === 0) alert("오늘 이후의 예약 내역이 없습니다."); }
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
    <main className="min-h-screen bg-[#F9FAFB] font-['Pretendard'] text-[#1A1A1A] flex flex-col items-center">
      {/* 🎨 헤더 영역 (Rectangle 404) */}
      <div className="w-full max-w-[480px] pt-[63px] pb-[120px] px-[20px] relative rounded-b-[15px]"
        style={{ background: 'radial-gradient(137.53% 99.23% at 92.41% 7.26%, #FFF5E4 0%, #C7D4F4 100%)' }}>
        <h1 className="text-[32px] font-bold leading-[38px] tracking-[-0.03em] text-[#1A1A1A] mb-[4px]">Knupi Reservation</h1>
        <p className="text-[16px] font-normal leading-[19px] tracking-[-0.03em] text-[#383838]">크누피 연습실 예약</p>
      </div>

      {/* 📦 메인 컨텐츠 컨테이너 (Frame 161 간격) */}
      <div className="w-full max-w-[444px] -mt-[80px] px-[12px] flex flex-col gap-[65px] pb-[100px]">
        
        {/* 1️⃣ 예약 서비스 섹션 (Frame 77) */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-black px-1">예약 서비스</h2>
          <div className="flex flex-col gap-[10px]">
            {/* 연습실 예약하기 카드 */}
            <Link href="/reservation">
              <div className="flex justify-between items-center px-[30px] py-[27px] bg-[rgba(255,255,255,0.3)] backdrop-blur-[10px] rounded-[20px] shadow-sm hover:bg-white/50 transition-all group">
                <div className="flex flex-col gap-[8px]">
                  <span className="text-[20px] font-semibold tracking-[-0.03em] text-black">연습실 예약하기</span>
                  <span className="text-[16px] text-[#B2B2B2] tracking-[-0.03em]">실시간 현황 확인 및 예약</span>
                </div>
                <div className="w-[24px] h-[24px] bg-[#D9D9D9] rounded-full flex items-center justify-center group-hover:bg-black transition-colors">
                  <svg width="8" height="13" viewBox="0 0 8 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 1.5L6.5 6.5L1.5 11.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </Link>
            {/* 내 예약 확인하기 카드 */}
            <div onClick={() => { setShowLookup(!showLookup); setMyReservations([]); setIsAdmin(false); }}
              className="flex justify-between items-center px-[30px] py-[27px] bg-[rgba(255,255,255,0.3)] backdrop-blur-[10px] rounded-[20px] shadow-sm cursor-pointer hover:bg-white/50 transition-all group">
              <div className="flex flex-col gap-[8px]">
                <span className="text-[20px] font-semibold tracking-[-0.03em] text-black">내 예약 확인하기</span>
                <span className="text-[16px] text-[#B2B2B2] tracking-[-0.03em]">이름과 학번으로 조회</span>
              </div>
              <div className="w-[24px] h-[24px] bg-[#D9D9D9] rounded-full flex items-center justify-center group-hover:bg-black transition-colors">
                <svg width="8" height="13" viewBox="0 0 8 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.5 1.5L6.5 6.5L1.5 11.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* 예약 조회 폼 (조회 버튼 누를 시 나타남) */}
          {showLookup && (
            <div className="mt-2 p-6 bg-white/60 backdrop-blur-md rounded-[20px] border border-white/40 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col gap-3">
                <input type="text" placeholder="이름" className="w-full p-4 rounded-[12px] bg-white border-0 shadow-sm text-sm outline-none focus:ring-2 focus:ring-blue-300" onChange={(e) => setInfo({...info, name: e.target.value})} />
                <input type="text" placeholder="학번" className="w-full p-4 rounded-[12px] bg-white border-0 shadow-sm text-sm outline-none focus:ring-2 focus:ring-blue-300" onChange={(e) => setInfo({...info, studentId: e.target.value})} />
                <button onClick={handleSearch} disabled={isSearching} className="w-full bg-black text-white font-bold py-4 rounded-[12px] text-sm shadow-lg active:scale-[0.98] transition-all">조회하기</button>
                <div className="mt-4 flex flex-col gap-3">
                  {myReservations.map((res) => (
                    <div key={res.id} className="bg-white p-5 rounded-[12px] shadow-sm flex justify-between items-center border border-blue-50">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 block mb-1 uppercase tracking-tighter">{res.piano_name}</span>
                        <p className="text-sm font-bold text-gray-800">{isAdmin ? `👤 ${res.user_name} | ` : ""}{res.data} 예약</p>
                        <p className="text-[11px] text-gray-400 font-medium">{formatTime(res.start_time)} - {formatTime(res.end_time)}</p>
                      </div>
                      <button onClick={() => handleDelete(res.id)} className="text-red-500 text-xs font-bold px-3 py-2 hover:bg-red-50 rounded-xl">취소</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2️⃣ 피아노 배치도 섹션 (이미지 레이아웃 기반 시각화) */}
        <section className="flex flex-col gap-[5px]">
          <div className="px-[0px] py-[10px] flex items-center">
            <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-black">피아노 배치도</h2>
          </div>
          <div className="w-full h-[184.79px] bg-[rgba(255,255,255,0.17)] backdrop-blur-sm rounded-[15px] flex items-center justify-center relative border border-white/20 overflow-hidden">
            {/* 102호 구역 */}
            <div className="absolute left-[39%] top-[37%] w-[70px] h-[55px] bg-[#C7D4F4]/40 rotate-[-90deg]"></div>
            <div className="absolute left-[42%] top-[83%] text-[14px] font-semibold text-[#333333]">102호</div>
            {/* 103호 구역 */}
            <div className="absolute left-[56%] top-[37%] w-[85px] h-[75px] bg-[#C7D4F4]/40 rotate-[-90deg]"></div>
            <div className="absolute left-[60%] top-[83%] text-[14px] font-semibold text-[#333333]">103호</div>
            {/* 피아노 위치 마커 */}
            <span className="absolute left-[43%] top-[25%] text-[14px] font-semibold text-[#808080]">3</span>
            <span className="absolute left-[48%] top-[25%] text-[14px] font-semibold text-[#808080]">2</span>
            <span className="absolute left-[53%] top-[66%] text-[14px] font-semibold text-[#808080]">1</span>
            <span className="absolute left-[74%] top-[76%] text-[14px] font-semibold text-[#808080]">업라이트</span>
          </div>
        </section>

        {/* 3️⃣ 이달의 랭킹 TOP 3 섹션 */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-black px-1">{currentMonth}월의 랭킹 TOP 3</h2>
          <div className="w-full h-[181px] bg-[rgba(255,255,255,0.2)] backdrop-blur-lg rounded-[20px] flex items-end justify-center px-[70px] pb-[20px] gap-[10px] border border-white/30">
            {/* 2등 */}
            {rankings[1] && (
              <div className="flex-1 bg-[#C7D4F4]/55 border border-[#B9C8ED] rounded-[5px] flex flex-col items-center justify-center py-[6px] transition-all" style={{ height: '73px' }}>
                <span className="text-[16px] font-semibold text-[#808080] tracking-[-0.03em]">{rankings[1].name}</span>
                <span className="text-[14px] font-semibold text-[#808080]">{rankings[1].total}시간</span>
              </div>
            )}
            {/* 1등 */}
            {rankings[0] && (
              <div className="flex-1 bg-[#C7D4F4] border border-[#B9C8ED] rounded-[5px] flex flex-col items-center justify-center py-[6px] shadow-lg shadow-blue-100 transition-all relative" style={{ height: '131px' }}>
                <span className="text-[16px] font-semibold text-black tracking-[-0.03em]">{rankings[0].name}</span>
                <span className="text-[14px] font-semibold text-black">{rankings[0].total}시간</span>
              </div>
            )}
            {/* 3등 */}
            {rankings[2] && (
              <div className="flex-1 bg-[#C7D4F4]/55 border border-[#B9C8ED] rounded-[5px] flex flex-col items-center justify-center py-[4px] transition-all" style={{ height: '46px' }}>
                <span className="text-[16px] font-semibold text-[#808080] tracking-[-0.03em]">{rankings[2].name}</span>
                <span className="text-[14px] font-semibold text-[#808080]">{rankings[2].total}시간</span>
              </div>
            )}
          </div>
        </section>

        {/* 4️⃣ 이용 주의사항 섹션 (Frame 75) */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-black px-1">이용 주의사항</h2>
          <div className="px-[25px] py-[18px] bg-[rgba(255,255,255,0.3)] rounded-[20px] backdrop-blur-md">
            <ul className="flex flex-col gap-[12px]">
              {['음식물 반입 금지 및 뒷정리 필수', '노쇼 시 향후 이용이 제한될 수 있음', '비동아리원 또는 임의의 정보로 예약 시 강제 취소 될 수 있음'].map((text, i) => (
                <li key={i} className="flex items-center gap-[9px] text-[16px] font-normal tracking-[-0.03em] text-[#333333]">
                  <div className="w-[3.7px] h-[3.7px] bg-[#808080] rounded-full"></div>
                  <span>{text}</span>
                </li>
              ))}
              <li className="flex items-center gap-[9px] text-[16px] font-normal tracking-[-0.03em] text-[#333333]">
                <div className="w-[3.7px] h-[3.7px] bg-[#808080] rounded-full"></div>
                <span>문의사항 크누피 집행부 <a href="https://open.kakao.com/o/s5DRwRei" target="_blank" className="text-blue-500 font-semibold underline underline-offset-2">사이소리함</a></span>
              </li>
            </ul>
          </div>
        </section>

        {/* 👣 푸터 */}
        <footer className="mt-[20px] text-center">
          <p className="text-[12px] font-light tracking-[0.04em] text-[#999999]">
            © KYUNGPOOK NATIONAL UNIV. PIANO CLUB KNUPI
          </p>
        </footer>
      </div>
    </main>
  );
}
