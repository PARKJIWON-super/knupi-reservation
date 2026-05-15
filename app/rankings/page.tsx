'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Ranking = {
  name: string;
  total: number;
};

const formatPracticeHours = (hours: number) => {
  return Number.isInteger(hours) ? `${hours}시간` : `${hours.toFixed(1)}시간`;
};

export default function RankingsPage() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRankings = async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('user_name, student_id, start_time, end_time');

    if (error) {
      console.error('전체 순위를 불러오지 못했습니다:', error);
      alert('전체 순위를 불러오지 못했습니다. Supabase 권한/RLS 설정을 확인해주세요.');
      setIsLoading(false);
      return;
    }

    const aggregate = (data || []).reduce<Record<string, Ranking>>((acc, cur) => {
      const userKey = `${cur.user_name}_${cur.student_id}`;
      const duration = cur.end_time - cur.start_time;

      if (!acc[userKey]) {
        acc[userKey] = { name: cur.user_name, total: 0 };
      }

      acc[userKey].total += duration;
      return acc;
    }, {});

    const sorted = Object.values(aggregate).sort((a, b) => b.total - a.total);
    setRankings(sorted);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRankings();

    const channel = supabase
      .channel('public:reservations_all_rankings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchRankings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#F9FAFB] font-['Pretendard'] text-[#1A1A1A] flex flex-col items-center overflow-x-hidden">
      <div
        className="w-full max-w-[480px] h-[270px] absolute top-[-12px] rounded-[15px] z-0 shadow-sm"
        style={{ background: 'radial-gradient(137.53% 99.23% at 92.41% 7.26%, #FFF5E4 0%, #C7D4F4 100%)' }}
      />

      <div className="w-full max-w-[480px] min-h-screen px-[20px] relative z-10 pt-[60px] pb-10 flex flex-col">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[14px] font-bold text-[#6C86D3] tracking-[-0.03em]">Ranking</p>
            <h1 className="mt-1 text-[30px] font-black tracking-[-0.05em] text-[#1A1A1A]">누적 시간 순위</h1>
            <p className="mt-2 text-[14px] font-semibold tracking-[-0.03em] text-[#7B8AB0]">전체 예약 내역 누적 연습시간 기준</p>
          </div>
          <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/55 shadow-sm active:scale-90 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
        </header>

        <section className="overflow-hidden rounded-[30px] border border-white/60 bg-white/50 shadow-[0_14px_40px_rgba(108,134,211,0.13)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/60 px-5 py-4">
            <div>
              <p className="text-[15px] font-black tracking-[-0.03em]">전체 순위</p>
              <p className="text-[12px] font-medium text-[#8A93A8]">총 {rankings.length}명</p>
            </div>
            <span className="rounded-full bg-[#C7D4F4]/70 px-3 py-1 text-[12px] font-bold text-[#4A63B1]">LIVE</span>
          </div>

          <div className="max-h-[calc(100vh-230px)] overflow-y-auto p-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex min-h-[280px] items-center justify-center text-[14px] font-bold text-[#8A93A8]">순위를 불러오는 중...</div>
            ) : rankings.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#C7D4F4]/50 text-[26px]">🎹</div>
                <p className="text-[17px] font-bold tracking-[-0.03em] text-[#333333]">아직 순위가 없어요</p>
                <p className="mt-2 text-[14px] font-medium text-[#8A93A8]">첫 예약을 남겨보세요.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {rankings.map((rank, index) => (
                  <div key={`${rank.name}-${index}`} className="rounded-[18px] bg-white p-4 shadow-sm border border-[#EEF2FF]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-black ${
                          index === 0
                            ? 'bg-[#FFF5E4] text-[#B88746]'
                            : index === 1
                              ? 'bg-[#EEF2FF] text-[#6C86D3]'
                              : index === 2
                                ? 'bg-[#F4F7FF] text-[#8A93A8]'
                                : 'bg-[#F3F6FC] text-[#6C86D3]'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="truncate text-[15px] font-bold tracking-[-0.03em] text-[#333333]">{rank.name}</span>
                      </div>
                      <span className="shrink-0 text-[14px] font-black tracking-[-0.03em] text-[#4A63B1]">{formatPracticeHours(rank.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}