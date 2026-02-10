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
    if (error) alert("조회 중 오류가 발생했습니다.");
    else {
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
    <main className="min-h-screen bg-[#F9FAFB] font-['Pretendard'] text-[#1A1A1A] flex flex-col items-center">
      {/* 🎨 헤더 영역 (피그마 Rectangle 404 기반) */}
      <div className="w-full max-w-[480px] h-[486.93px] pt-[63.62px] px-[20px] relative rounded-b-[15px]"
        style={{ background: 'radial-gradient(137.53% 99.23% at 92.41% 7.26%, #FFF5E4 0%, #C7D4F4 100%)' }}>
        <div className="ml-[20px]">
          <h1 className="text-[32px] font-bold leading-[38px] tracking-[-0.03em] mb-[4px]">Knupi Reservation</h1>
          <p className="text-[16px] font-normal leading-[19px] tracking-[-0.03em] text-[#383838]">크누피 연습실 예약</p>
        </div>

        {/* 1️⃣ 예약 서비스 섹션 (헤더 그라데이션 위에 걸쳐있음) */}
        <section className="absolute top-[165.86px] left-[20px] w-[441.19px] flex flex-col gap-[12px]">
          <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.03em] text-black">예약 서비스</h2>
          <div className="flex flex-col gap-[10px]">
            {/* 연습실 예약하기 */}
            <Link href="/reservation">
              <div className="flex justify-between items-center w-[441px] h-[105px] px-[30px] py-[27px] bg-white/30 backdrop-blur-[20px] rounded-[20px] border border-white/20 hover:bg-white/40 transition-all cursor-pointer group">
                <div className="flex flex-col gap-[8px]">
                  <span className="text-[20px] font-semibold leading-[24px] tracking-[-0.03em]">연습실 예약하기</span>
                  <span className="text-[16px] text-[#B2B2B2] leading-[19px] tracking-[-0.03em]">실시간 현황 확인 및 예약</span>
                </div>
                <div className="w-[24px] h-[24px] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 5L15 12L9 19" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </Link>
            {/* 내 예약 확인하기 */}
            <div onClick={() => { setShowLookup(!showLookup); setMyReservations([]); }}
              className="flex justify-between items-center w-[441px] h-[105px] px-[30px] py-[27px] bg-white/30 backdrop-blur-[20px] rounded-[20px] border border-white/20 hover:bg-white/40 transition-all cursor-pointer group">
              <div className="flex flex-col gap-[8px]">
                <span className="text-[20px] font-semibold leading-[24px] tracking-[-0.03em]">내 예약 확인하기</span>
                <span className="text-[16px] text-[#B2B2B2] leading-[19px] tracking-[-0.03em]">이름과 학번으로 조회</span>
              </div>
              <div className="w-[24px] h-[24px] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5L15 12L9 19" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* 조회 창 (활성화 시 슬라이드 애니메이션) */}
          {showLookup && (
            <div className="mt-2 p-6 bg-white/60 backdrop-blur-xl rounded-[20px] border border-white/40 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex flex-col gap-3">
                <input type="text" placeholder="이름" className="w-full p-4 rounded-[12px] bg-white border-0 shadow-sm text-sm outline-none focus:ring-2 focus:ring-blue-400" onChange={(e) => setInfo({...info, name: e.target.value})} />
                <input type="text" placeholder="학번" className="w-full p-4 rounded-[12px] bg-white border-0 shadow-sm text-sm outline-none focus:ring-2 focus:ring-blue-400" onChange={(e) => setInfo({...info, studentId: e.target.value})} />
                <button onClick={handleSearch} disabled={isSearching} className="w-full bg-[#1A1A1A] text-white font-bold py-4 rounded-[12px] text-sm shadow-lg active:scale-95 transition-all">{isSearching ? '조회 중...' : '조회하기'}</button>
                <div className="mt-4 flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-1 scrollbar-hide">
                  {myReservations.map((res) => (
                    <div key={res.id} className="bg-white p-5 rounded-[12px] shadow-sm flex justify-between items-center border border-blue-50 animate-in slide-in-from-right-2">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 block mb-1 uppercase">{res.piano_name}</span>
                        <p className="text-sm font-bold text-gray-800">{res.data} 예약</p>
                        <p className="text-[11px] text-gray-400">{formatTime(res.start_time)} - {formatTime(res.end_time)}</p>
                      </div>
                      <button onClick={() => handleDelete(res.id)} className="text-red-500 text-xs font-bold px-3 py-2 hover:bg-red-50 rounded-lg transition-colors">취소</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* 📦 하단 컨텐츠 레이아웃 (Frame 161) */}
      <div className="w-full max-w-[444px] mt-[65px] px-[12px] flex flex-col gap-[65px] pb-[100px]">
        
        {/* 2️⃣ 피아노 배치도 섹션 */}
        <section className="flex flex-col gap-[5px]">
          <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.03em] px-1">피아노 배치도</h2>
          <div className="w-[439.59px] h-[184.79px] bg-white/17 backdrop-blur-md rounded-[15px] border border-white/20 relative overflow-hidden flex items-center justify-center p-[10px_77px]">
            {/* 피그마 벡터 위치 수치 직접 반영 시각화 */}
            <div className="absolute left-[39%] top-[37%] w-[70px] h-[55px] bg-[#C7D4F4]/45 rotate-[-90deg]"></div>
            <div className="absolute left-[56%] top-[37%] w-[85px] h-[75px] bg-[#C7D4F4]/45 rotate-[-90deg]"></div>
            <div className="absolute left-[42%] top-[83%] text-[14px] font-semibold text-[#333333]">102호</div>
            <div className="absolute left-[60%] top-[83%] text-[14px] font-semibold text-[#333333]">103호</div>
            <span className="absolute left-[43%] top-[25%] text-[14px] font-semibold text-[#808080]">3</span>
            <span className="absolute left-[48%] top-[25%] text-[14px] font-semibold text-[#808080]">2</span>
            <span className="absolute left-[53%] top-[66%] text-[14px] font-semibold text-[#808080]">1</span>
            <span className="absolute left-[74%] top-[76%] text-[14px] font-semibold text-[#808080]">업라이트</span>
          </div>
        </section>

        {/* 3️⃣ 이달의 랭킹 TOP 3 섹션 (피그마 수치 적용) */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.03em] px-1">{currentMonth}월의 랭킹 TOP 3</h2>
          <div className="w-[444.15px] h-[181px] bg-white/20 backdrop-blur-lg rounded-[20px] flex items-end justify-center px-[70px] pb-[20px] gap-[10px] border border-white/20">
            {/* 2등 (박지원 30시간 예시 수치 적용) */}
            {rankings[1] && (
              <div className="w-[94.12px] h-[73.11px] bg-[#C7D4F4]/55 border border-[#B9C8ED] rounded-[5px] flex flex-col items-start px-[26px] py-[6px] gap-[3px]">
                <span className="text-[16px] font-semibold text-[#808080] tracking-[-0.03em]">{rankings[1].name}</span>
                <span className="text-[14px] font-semibold text-[#808080]">{rankings[1].total}시간</span>
              </div>
            )}
            {/* 1등 (조윤제 45시간 예시 수치 적용) */}
            {rankings[0] && (
              <div className="w-[94.26px] h-[131px] bg-[#C7D4F4] border border-[#B9C8ED] rounded-[5px] flex flex-col items-start px-[26px] py-[7.63px] gap-[3px] shadow-lg relative">
                <span className="text-[16px] font-semibold text-black tracking-[-0.03em]">{rankings[0].name}</span>
                <span className="text-[14px] font-semibold text-black">{rankings[0].total}시간</span>
              </div>
            )}
            {/* 3등 (황성준 15시간 예시 수치 적용) */}
            {rankings[2] && (
              <div className="w-[94.12px] h-[46px] bg-[#C7D4F4]/55 border border-[#B9C8ED] rounded-[5px] flex flex-col items-start px-[26px] py-[4px] gap-[3px]">
                <span className="text-[16px] font-semibold text-[#808080] tracking-[-0.03em]">{rankings[2].name}</span>
                <span className="text-[14px] font-semibold text-[#808080]">{rankings[2].total}시간</span>
              </div>
            )}
          </div>
        </section>

        {/* 4️⃣ 이용 주의사항 섹션 */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[24px] font-semibold leading-[29px] tracking-[-0.03em] px-1">이용 주의사항</h2>
          <div className="w-[444.15px] h-[161px] p-[18px_10px] bg-white/30 rounded-[20px] backdrop-blur-md flex flex-row items-center gap-[10px]">
            <div className="flex flex-col gap-[27px] ml-[9px]">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-[3.7px] h-[3.7px] bg-[#808080] rounded-full"></div>)}
            </div>
            <div className="flex flex-col gap-[15px] text-[16px] font-normal tracking-[-0.03em] text-[#333333] leading-[15px]">
              <p>음식물 반입 금지 및 뒷정리 필수</p>
              <p>노쇼 시 향후 이용이 제한될 수 있음</p>
              <p>비동아리원 또는 임의의 정보로 예약 시 강제 취소 될 수 있음</p>
              <p>문의사항 크누피 집행부 <a href="https://open.kakao.com/o/s5DRwRei" target="_blank" className="text-blue-600 font-bold underline underline-offset-2">사이소리함</a></p>
            </div>
          </div>
        </section>

        {/* 👣 푸터 (피그마 수치 반영) */}
        <footer className="mt-[20px] text-center pb-[50px]">
          <p className="text-[12px] font-light tracking-[0.04em] text-[#999999]">
            © KYUNGPOOK NATIONAL UNIV. PIANO CLUB KNUPI
          </p>
        </footer>
      </div>
    </main>
  );
}
