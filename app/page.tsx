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
    
    const { data } = await supabase
      .from('reservations')
      .select('user_name, student_id, start_time, end_time')
      .gte('data', firstDayOfMonth);

    if (data) {
      const aggregate = data.reduce((acc: any, cur) => {
        const userKey = `${cur.user_name}_${cur.student_id}`;
        const duration = cur.end_time - cur.start_time;
        
        if (!acc[userKey]) {
          acc[userKey] = { name: cur.user_name, total: 0 };
        }
        acc[userKey].total += duration;
        return acc;
      }, {});

      const sorted = Object.values(aggregate)
        .map((item: any) => ({ 
          name: item.name, 
          total: item.total 
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

      setRankings(sorted);
    }
  };

  useEffect(() => { fetchRankings(); }, []);

  const handleSearch = async () => {
    if (!info.name || !info.studentId) { alert("이름과 학번을 입력해주세요."); return; }
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
    if (!error) { setMyReservations(data || []); if (data?.length === 0) alert("오늘 이후의 예약 내역이 없습니다."); }
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
      
      {/* 상단 헤더 - 사진 스타일 반영 */}
      <div 
        className="w-full max-w-[480px] pt-[75px] pb-[120px] px-[24px] rounded-b-[15px] relative"
        style={{ background: 'radial-gradient(137.53% 99.23% at 92.41% 7.26%, #FFF5E4 0%, #C7D4F4 100%)' }}
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-[34px] font-bold tracking-[-0.04em] leading-tight">
            <span className="text-[#000080]">Knupi</span> <span className="text-[#5D4037]">Reservation</span>
          </h1>
          <p className="text-[15px] font-medium tracking-[-0.03em] text-[#7B8AB0]">크누피 연습실 예약</p>
        </div>
      </div>

      <div className="w-full max-w-[480px] -mt-[80px] px-[20px] flex flex-col gap-[65px] pb-[80px] relative z-10 font-['Pretendard']">
        
        {/* 1️⃣ 예약 서비스 */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#1A1A1A] px-1">예약 서비스</h2>
          <div className="flex flex-col gap-[10px]">
            <Link href="/reservation">
              <div className="flex justify-between items-center w-full h-[105px] px-[30px] bg-white/30 backdrop-blur-[20px] rounded-[20px] border border-white/20 hover:bg-white/40 shadow-sm transition-all cursor-pointer group">
                <div className="flex flex-col gap-[8px]">
                  <span className="text-[20px] font-semibold leading-[24px] tracking-[-0.03em]">연습실 예약하기</span>
                  <span className="text-[16px] text-[#B2B2B2] leading-[19px] tracking-[-0.03em]">실시간 현황 확인 및 예약</span>
                </div>
                <div className="w-[32px] h-[32px] flex items-center justify-center transition-transform group-hover:translate-x-1">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5L16 12L9 19" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </Link>
            <div onClick={() => setShowLookup(!showLookup)} className="flex justify-between items-center w-full h-[105px] px-[30px] bg-white/30 backdrop-blur-[20px] rounded-[20px] border border-white/20 hover:bg-white/40 shadow-sm cursor-pointer transition-all group">
              <div className="flex flex-col gap-[8px]">
                <span className="text-[20px] font-semibold leading-[24px] tracking-[-0.03em]">내 예약 확인하기</span>
                <span className="text-[16px] text-[#B2B2B2] leading-[19px] tracking-[-0.03em]">이름과 학번으로 조회</span>
              </div>
              <div className="w-[32px] h-[32px] flex items-center justify-center transition-transform group-hover:translate-x-1">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5L16 12L9 19" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
          {showLookup && (
            <div className="mt-2 p-6 bg-white/60 backdrop-blur-xl rounded-[20px] border border-white/40 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex flex-col gap-3">
                <input type="text" placeholder="이름" className="w-full p-4 rounded-[12px] bg-white border-0 shadow-sm text-sm outline-none" onChange={(e) => setInfo({...info, name: e.target.value})} />
                <input type="text" placeholder="학번" className="w-full p-4 rounded-[12px] bg-white border-0 shadow-sm text-sm outline-none" onChange={(e) => setInfo({...info, studentId: e.target.value})} />
                <button onClick={handleSearch} disabled={isSearching} className="w-full bg-[#1A1A1A] text-white font-bold py-4 rounded-[12px] text-sm shadow-lg active:scale-95 transition-all">조회하기</button>
                <div className="mt-4 flex flex-col gap-3">
                  {myReservations.map((res) => (
                    <div key={res.id} className="bg-white p-4 rounded-[12px] shadow-sm flex justify-between items-center border border-blue-50">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-blue-600">{res.piano_name}</span>
                          {isAdmin && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-bold">
                              예약자: {res.user_name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold">{res.data} 예약</p>
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

        {/* 2️⃣ 피아노 배치도 */}
        <section className="flex flex-col gap-[12px] w-full">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#1A1A1A] px-1">피아노 배치도</h2>
          <div className="w-full bg-white/50 backdrop-blur-md rounded-[25px] p-2 border border-white/20 shadow-sm overflow-hidden flex justify-center items-center">
            <img src="/piano-layout.png" alt="피아노 배치도" className="w-full h-auto max-w-[480px] rounded-[20px]" />
          </div>
        </section>

        {/* 3️⃣ 이달의 랭킹 TOP 3 */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#1A1A1A] px-1">{currentMonth}월의 랭킹 TOP 3</h2>
          <div className="w-full h-[181px] bg-white/20 backdrop-blur-lg rounded-[20px] flex items-end justify-center px-[60px] pb-[20px] gap-[10px] border border-white/20 shadow-sm">
            {rankings[1] && (
              <div className="flex-1 bg-[#C7D4F4]/55 border border-[#B9C8ED] rounded-[5px] flex flex-col items-center justify-center py-2 transition-all" style={{ height: '73.11px' }}>
                <span className="text-[16px] font-semibold text-[#808080] tracking-[-0.03em]">{rankings[1].name}</span>
                <span className="text-[14px] font-semibold text-[#808080]">{rankings[1].total}시간</span>
              </div>
            )}
            {rankings[0] && (
              <div className="flex-1 bg-[#C7D4F4] border border-[#B9C8ED] rounded-[5px] flex flex-col items-center justify-center py-2 shadow-lg relative" style={{ height: '131px' }}>
                <span className="text-[16px] font-semibold text-black tracking-[-0.03em]">{rankings[0].name}</span>
                <span className="text-[14px] font-semibold text-black">{rankings[0].total}시간</span>
              </div>
            )}
            {rankings[2] && (
              <div className="flex-1 bg-[#C7D4F4]/55 border border-[#B9C8ED] rounded-[5px] flex flex-col items-center justify-center py-2 transition-all" style={{ height: '46px' }}>
                <span className="text-[16px] font-semibold text-[#808080] tracking-[-0.03em]">{rankings[2].name}</span>
                <span className="text-[14px] font-semibold text-[#808080]">{rankings[2].total}시간</span>
              </div>
            )}
          </div>
        </section>

        {/* 4️⃣ 이용 주의사항 */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#1A1A1A] px-1">이용 주의사항</h2>
          <div className="w-full min-h-[161px] p-[18px_25px] bg-white/30 rounded-[20px] backdrop-blur-md border border-white/20 shadow-sm">
            <ul className="flex flex-col gap-[12px]">
              {['음식물 반입 금지 및 뒷정리 필수', '노쇼 시 향후 이용이 제한될 수 있음', '부정 정보 예약 시 강제 취소 가능'].map((text, i) => (
                <li key={i} className="flex items-center gap-[10px] text-[16px] text-[#333333] tracking-[-0.03em] leading-[15px]">
                  <div className="w-[3.7px] h-[3.7px] bg-[#808080] rounded-full shrink-0"></div>
                  <span>{text}</span>
                </li>
              ))}
              <li className="flex items-center gap-[10px] text-[16px] pt-2 border-t border-black/5 mt-1">
                <div className="w-[3.7px] h-[3.7px] bg-[#808080] rounded-full shrink-0"></div>
                <span className="text-[#333333]">문의사항 크누피 집행부 <a href="https://open.kakao.com/o/s5DRwRei" target="_blank" className="text-blue-600 font-bold underline underline-offset-4">사이소리함</a></span>
              </li>
            </ul>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="text-center pt-[10px] pb-[30px]">
          <p className="text-[12px] font-light tracking-[0.04em] text-[#999999]">
            © KYUNGPOOK NATIONAL UNIV. PIANO CLUB KNUPI
          </p>
        </footer>
      </div>
    </main>
  );
}
