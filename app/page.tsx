import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      {/* 헤더 섹션 */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 mb-6 flex items-center gap-4">
        <div className="bg-blue-600 p-3 rounded-xl text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 10l12-3" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">크누피 연습실 예약</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">KNUPI Practice Room Reservation</p>
        </div>
      </div>

      {/* 안내 섹션 */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 mb-4 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">⏰</span>
          <div>
            <p className="text-sm font-bold text-gray-700">이용 시간: 09:00 ~ 24:00</p>
            <p className="text-xs text-gray-400">마지막 타임 부원은 뒷정리 필수!</p>
          </div>
        </div>
        <div className="flex items-start gap-3 border-t pt-4">
          <span className="text-xl">🎹</span>
          <div>
            <p className="text-sm font-bold text-gray-700">연습실 현황</p>
            <p className="text-xs text-gray-400">1~3번 피아노 및 업라이트 피아노</p>
          </div>
        </div>
      </div>

      {/* 예약 페이지로 이동하는 버튼 */}
      <Link href="/reservation" className="w-full max-w-md">
        <div className="bg-blue-600 rounded-2xl p-6 mb-4 text-white flex justify-between items-center cursor-pointer hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
          <div>
            <h2 className="text-xl font-bold">스터디룸 예약하기</h2>
            <p className="text-sm opacity-80">실시간 현황 확인 및 예약</p>
          </div>
          <div className="bg-white/20 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </Link>

      <footer className="mt-auto py-6 text-[10px] text-gray-400">
        © KyungPook National Univ. Piano Club KNUPI
      </footer>
    </main>
  );
}
