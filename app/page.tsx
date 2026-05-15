'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Reservation = {
  id: number;
  user_name: string;
  student_id: string;
  piano_name: string;
  data: string;
  start_time: number;
  end_time: number;
};

type Ranking = {
  name: string;
  total: number;
};

const getDateOnly = (value: string) => value.slice(0, 10);

export default function Home() {
  const pianos = ["전체", "1번 피아노", "2번 피아노", "3번 피아노", "업라이트 피아노"];
  const [showLookup, setShowLookup] = useState(false);
  const [info, setInfo] = useState({ name: '', studentId: '' });
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSearchKeyword, setAdminSearchKeyword] = useState('');
  const [adminPianoFilter, setAdminPianoFilter] = useState('전체');
  const [rankings, setRankings] = useState<Ranking[]>([]);
  
  const currentMonth = new Date().getMonth() + 1;

  const formatTime = (time: number) => {
    const hours = Math.floor(time);
    const minutes = (time % 1) === 0.5 ? '30' : '00';
    return `${hours}:${minutes}`;
  };

  const formatPracticeHours = (hours: number) => {
    return Number.isInteger(hours) ? `${hours}시간` : `${hours.toFixed(1)}시간`;
  };

  const filteredReservations = isAdmin
    ? myReservations.filter((res) => {
        const keyword = adminSearchKeyword.trim().toLowerCase();
        const matchesKeyword = !keyword || [
          res.user_name,
          res.student_id,
          res.piano_name,
          res.data,
        ].some((value) => String(value).toLowerCase().includes(keyword));
        const matchesPiano = adminPianoFilter === '전체' || res.piano_name === adminPianoFilter;

        return matchesKeyword && matchesPiano;
      })
    : myReservations;

  const fetchRankings = async () => {
    const now = new Date();
    const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const firstDayOfNextMonth = now.getMonth() === 11
      ? `${now.getFullYear() + 1}-01-01`
      : `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01`;
    
    const { data, error } = await supabase
      .from('reservations')
      .select('user_name, student_id, start_time, end_time')
      .gte('data', firstDayOfMonth)
      .lt('data', firstDayOfNextMonth);

    if (error) {
      console.error('랭킹 정보를 불러오지 못했습니다:', error);
      return;
    }

    if (data) {
      const aggregate = data.reduce<Record<string, Ranking>>((acc, cur) => {
        const userKey = `${cur.user_name}_${cur.student_id}`;
        const duration = cur.end_time - cur.start_time;
        
        if (!acc[userKey]) {
          acc[userKey] = { name: cur.user_name, total: 0 };
        }
        acc[userKey].total += duration;
        return acc;
      }, {});

      const sorted = Object.values(aggregate)
        .map((item) => ({ 
          name: item.name, 
          total: item.total 
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      setRankings(sorted);
    }
  };

  useEffect(() => { 
    fetchRankings(); 
    
    const channel = supabase
      .channel('public:reservations_rankings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchRankings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSearch = async () => {
    if (!info.name || !info.studentId) { alert("이름과 학번을 입력해주세요."); return; }
    setIsSearching(true);
    setAdminSearchKeyword('');
    setAdminPianoFilter('전체');
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let query = supabase.from('reservations').select('*');
    if (info.name === '운영자' && info.studentId === '12345') { 
      setIsAdmin(true); 
      query = query.gte('data', today).order('data', { ascending: true }).order('start_time', { ascending: true }); 
    } else { 
      setIsAdmin(false); 
      query = query.eq('user_name', info.name).eq('student_id', info.studentId).gte('data', today).order('data', { ascending: true }); 
    }
    const { data, error } = await query;
    if (!error) { 
      const upcomingReservations = (data || []).filter((reservation) => getDateOnly(String(reservation.data)) >= today);
      setMyReservations(upcomingReservations); 
      if (upcomingReservations.length === 0) alert("오늘 이후의 예약 내역이 없습니다."); 
    } else {
      console.error('예약 조회에 실패했습니다:', error);
      alert('예약 조회에 실패했습니다. Supabase 권한/RLS 설정을 확인해주세요.');
    }
    setIsSearching(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말로 이 예약을 취소하시겠습니까?")) return;
    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (!error) { 
      setMyReservations((prev) => prev.filter((res) => res.id !== id)); 
      alert("✅ 예약이 취소되었습니다."); 
      fetchRankings(); 
    } else {
      console.error('예약 취소에 실패했습니다:', error);
      alert('예약 취소에 실패했습니다. 권한 또는 네트워크 상태를 확인해주세요.');
    }
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] font-['Pretendard'] text-[#1A1A1A] flex flex-col items-center overflow-x-hidden relative">
      
      {/* 🚀 모달 레이어: showLookup이 true일 때만 표시 */}
      {showLookup && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto px-[20px] py-8 sm:items-center">
          {/* 뒷배경 어둡게 처리 및 클릭 시 닫기 */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => { setShowLookup(false); setMyReservations([]); }}
          />
          
          {/* 모달 박스 */}
          <div className="relative my-auto w-full max-w-[400px] max-h-[calc(100vh-64px)] overflow-y-auto bg-white rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            
            <h3 className="text-[20px] font-bold text-center mb-8 tracking-[-0.03em]">조회 정보를 입력하세요</h3>
            
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="이름" 
                className="w-full p-4 rounded-[16px] bg-[#F3F4F6] border-0 text-[15px] outline-none focus:ring-2 ring-blue-100 transition-all" 
                onChange={(e) => setInfo({...info, name: e.target.value})} 
              />
              <input 
                type="text" 
                placeholder="학번" 
                className="w-full p-4 rounded-[16px] bg-[#F3F4F6] border-0 text-[15px] outline-none focus:ring-2 ring-blue-100 transition-all" 
                onChange={(e) => setInfo({...info, studentId: e.target.value})} 
              />
              <button 
                onClick={handleSearch} 
                disabled={isSearching} 
                className="w-full bg-[#C7D4F4] text-[#4A5568] font-bold py-4 rounded-[16px] text-[16px] mt-2 active:scale-95 transition-all shadow-sm"
              >
                {isSearching ? '조회 중...' : '조회하기'}
              </button>
            </div>

            {/* 예약 결과 리스트 */}
            {myReservations.length > 0 && (
              <div className="mt-6 flex flex-col gap-3">
                {isAdmin && (
                  <div className="rounded-[20px] bg-[#F3F6FC] p-4 border border-[#E7ECFA]">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-[14px] font-black text-[#333333] tracking-[-0.03em]">관리자 예약 관리</p>
                        <p className="mt-0.5 text-[12px] font-medium text-[#8A93A8]">오늘 이후 예약 {myReservations.length}건</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-[#6C86D3] shadow-sm">
                        {filteredReservations.length}건 표시
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="이름, 학번, 날짜로 검색"
                      value={adminSearchKeyword}
                      className="w-full rounded-[14px] bg-white px-4 py-3 text-[13px] font-medium outline-none focus:ring-2 ring-[#C7D4F4] transition-all"
                      onChange={(e) => setAdminSearchKeyword(e.target.value)}
                    />
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      {pianos.map((piano) => (
                        <button
                          key={piano}
                          onClick={() => setAdminPianoFilter(piano)}
                          className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-bold transition-all ${
                            adminPianoFilter === piano
                              ? 'bg-[#C7D4F4] text-[#1A1A1A] shadow-sm'
                              : 'bg-white text-[#8A93A8]'
                          }`}
                        >
                          {piano}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="max-h-[min(320px,35vh)] overflow-y-auto flex flex-col gap-3 pr-1 custom-scrollbar">
                {filteredReservations.length > 0 ? filteredReservations.map((res) => (
                  <div key={res.id} className="bg-white p-4 rounded-[16px] shadow-sm flex justify-between items-center border border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-blue-600">{res.piano_name}</span>
                        {isAdmin && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md">예약자: {res.user_name}</span>}
                      </div>
                      <p className="text-[14px] font-bold">{res.data}</p>
                      <p className="text-[12px] text-gray-400">{formatTime(res.start_time)} - {formatTime(res.end_time)}</p>
                    </div>
                    <button onClick={() => handleDelete(res.id)} className="text-red-500 text-[13px] font-bold px-3 py-2 hover:bg-red-50 rounded-xl transition-colors">취소</button>
                  </div>
                )) : (
                  <div className="rounded-[16px] bg-white p-6 text-center border border-gray-100">
                    <p className="text-[14px] font-bold text-[#666666]">검색 결과가 없습니다.</p>
                    <p className="mt-1 text-[12px] text-[#B2B2B2]">검색어 또는 피아노 필터를 바꿔보세요.</p>
                  </div>
                )}
                </div>
              </div>
            )}
            
            <button 
              onClick={() => { setShowLookup(false); setMyReservations([]); }}
              className="mt-6 w-full text-gray-400 text-[14px] font-medium hover:text-gray-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 상단 헤더 */}
      <div 
        className="w-full max-w-[480px] pt-[75px] pb-[340px] px-[24px] rounded-b-[15px] relative"
        style={{ background: 'radial-gradient(137.53% 99.23% at 92.41% 7.26%, #FFF5E4 0%, #C7D4F4 100%)' }}
      >
        <div className="flex flex-col gap-1">
  <h1 className="text-[34px] font-bold tracking-[-0.04em] leading-tight">
    {/* - mix-blend-multiply: 배경과 색을 곱함
        - opacity-75: 배경색이 글자를 통해 살짝 올라옴
        - contrast-125: 글자와 배경의 경계를 자연스럽게 조정
    */}
    <span className="text-[#1A237E] mix-blend-multiply opacity-75 filter contrast-125">
      Knupi Reservation
    </span>
  </h1>
          <p className="text-[15px] font-medium tracking-[-0.03em] text-[#7B8AB0]">크누피 연습실 예약</p>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="w-full max-w-[480px] -mt-[300px] px-[20px] flex flex-col gap-[65px] pb-[80px] relative z-10 font-['Pretendard']">
        
        {/* 1️⃣ 예약 서비스 */}
        <section className="flex flex-col gap-[12px]">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#1A1A1A]">예약 서비스</h2>
            <Link
              href="/guestbook"
              className="rounded-full bg-white/60 px-4 py-2 text-[14px] font-bold tracking-[-0.03em] text-[#4A63B1] shadow-sm border border-white/50 active:scale-95 transition-all hover:bg-white/80"
            >
              방명록
            </Link>
          </div>
          <div className="flex flex-col gap-[10px]">
            <Link href="/reservation">
              <div className="flex justify-between items-center w-full h-[105px] px-[30px] bg-white/30 backdrop-blur-[20px] rounded-[20px] border border-white/20 hover:bg-white/60 shadow-sm transition-all cursor-pointer group">
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
            <div onClick={() => setShowLookup(true)} className="flex justify-between items-center w-full h-[105px] px-[30px] bg-white/30 backdrop-blur-[20px] rounded-[20px] border border-white/20 hover:bg-white/60 shadow-sm cursor-pointer transition-all group">
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
        </section>

        {/* 2️⃣ 피아노 배치도 */}
        <section className="flex flex-col gap-[12px] w-full">
  <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#1A1A1A] px-1">피아노 배치도</h2>
  {/* p-2 제거, overflow-hidden 유지 */}
  <div className="w-full rounded-[25px] shadow-sm overflow-hidden flex justify-center items-center">
    {/* rounded-[20px] 제거 (부모의 overflow-hidden이 깎아줌) */}
    <img src="/piano-layout.png" alt="피아노 배치도" className="w-full h-auto max-w-[480px]" />
  </div>
</section>

        {/* 3️⃣ 이달의 랭킹 TOP 10 */}
        <section className="flex flex-col gap-[12px]">
          <div className="flex items-end justify-between px-1">
            <div>
              <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#1A1A1A]">{currentMonth}월의 랭킹 TOP 10</h2>
              <p className="mt-1 text-[13px] font-medium text-[#8A93A8] tracking-[-0.03em]">이번 달 누적 연습시간 기준</p>
            </div>
            <span className="rounded-full bg-white/60 px-3 py-1 text-[12px] font-bold text-[#6C86D3] shadow-sm border border-white/50">
              LIVE
            </span>
          </div>

          <div className="w-full overflow-hidden rounded-[28px] border border-white/50 bg-white/35 backdrop-blur-xl shadow-[0_14px_40px_rgba(108,134,211,0.13)]">
            {rankings.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center px-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#C7D4F4]/50 text-[26px]">🎹</div>
                <p className="text-[17px] font-bold text-[#333333] tracking-[-0.03em]">아직 랭킹이 없어요</p>
                <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#8A93A8]">이번 달 첫 연습 예약을 남겨보세요.</p>
              </div>
            ) : (
              <>
                <div className="relative px-5 pb-6 pt-7">
                  <div className="absolute inset-x-0 top-0 h-[140px] bg-gradient-to-b from-[#C7D4F4]/50 to-transparent" />
                  <div className="relative grid grid-cols-3 items-end gap-2">
                    {[
                      { rank: 2, item: rankings[1], height: 'h-[128px]', medal: '🥈', tone: 'from-white/80 to-[#EAF0FF]/80', label: '2nd' },
                      { rank: 1, item: rankings[0], height: 'h-[166px]', medal: '👑', tone: 'from-[#FFF5E4] to-[#C7D4F4]', label: '1st' },
                      { rank: 3, item: rankings[2], height: 'h-[108px]', medal: '🥉', tone: 'from-white/75 to-[#F4F7FF]/75', label: '3rd' },
                    ].map(({ rank, item, height, medal, tone, label }) => (
                      <div key={rank} className={`relative flex ${height} min-w-0 flex-col items-center justify-between rounded-[22px] bg-gradient-to-b ${tone} p-2.5 text-center shadow-sm border border-white/60`}>
                        <span className="absolute -top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[18px] shadow-md border border-white/70">
                          {medal}
                        </span>
                        {item ? (
                          <>
                            <div className="mt-5">
                              <p className="text-[11px] font-black tracking-[0.08em] text-[#6C86D3]">{label}</p>
                              <p className="mt-2 max-w-[78px] truncate text-[15px] font-extrabold tracking-[-0.05em] text-[#1A1A1A]">{item.name}</p>
                            </div>
                            <div className="w-full min-w-0 px-1 py-1.5">
                              <p className="w-full truncate whitespace-nowrap text-center text-[clamp(12px,3.5vw,15px)] font-black tracking-[-0.06em] text-[#4A63B1] leading-none">
                                {formatPracticeHours(item.total)}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center pt-4">
                            <p className="text-[11px] font-black tracking-[0.08em] text-[#B2B2B2]">{label}</p>
                            <p className="mt-2 text-[13px] font-bold text-[#B2B2B2]">대기중</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 rounded-t-[28px] bg-white/65 px-4 py-5">
                  {rankings.slice(3).map((rank, index) => {
                    const rankNumber = index + 4;
                    const maxTotal = rankings[0]?.total || rank.total || 1;
                    const percentage = Math.max(8, Math.min(100, (rank.total / maxTotal) * 100));

                    return (
                      <div key={`${rank.name}-${rankNumber}`} className="rounded-[18px] bg-white p-4 shadow-sm border border-[#EEF2FF]">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3F6FC] text-[13px] font-black text-[#6C86D3]">
                              {rankNumber}
                            </span>
                            <span className="truncate text-[15px] font-bold tracking-[-0.03em] text-[#333333]">{rank.name}</span>
                          </div>
                          <span className="shrink-0 text-[14px] font-black tracking-[-0.03em] text-[#4A63B1]">{formatPracticeHours(rank.total)}</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEF2FF]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#C7D4F4] to-[#8DA6EA]"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {/* 4️⃣ 이용 주의사항 */}
        <section className="flex flex-col gap-[12px]">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#1A1A1A] px-1">이용 주의사항</h2>
          <div className="w-full min-h-[161px] p-[18px_25px] bg-white/30 rounded-[20px] backdrop-blur-md border border-white/20 shadow-sm">
            <ul className="flex flex-col gap-[12px]">
              {['음식물 섭취 후 뒷정리 필수', '노쇼 시 향후 이용이 제한될 수 있음', '부정 정보 예약 시 강제 취소 가능'].map((text, i) => (
                <li key={i} className="flex items-center gap-[10px] text-[16px] text-[#333333] tracking-[-0.03em] leading-[15px]">
                  <div className="w-[3.7px] h-[3.7px] bg-[#808080] rounded-full shrink-0"></div>
                  <span>{text}</span>
                </li>
              ))}
              <li className="flex items-center gap-[10px] text-[16px] pt-2 border-t border-black/5 mt-1">
                <div className="w-[3.7px] h-[3.7px] bg-[#808080] rounded-full shrink-0"></div>
                <span className="text-[#333333]">
  문의사항 크누피 집행부 
  <a 
    href="https://open.kakao.com/o/s5DRwRei" 
    target="_blank" 
    className="text-[#C7D4F4] underline underline-offset-4"
  >
    사이소리함
  </a>
</span>
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
