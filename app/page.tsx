import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      {/* 헤더 섹션 */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 mb-6 flex items-center gap-4">
        <div className="bg-blue-600 p-3 rounded-xl text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="Window" />
            <path d="M9 19V6l12-3v13M9 10l12-3" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">크누피 연습실 예약</h1>
          <p className="text-xs text-gray-500 font-medium">KNUPY PRACTICE ROOM RESERVATION</p>
        </div>
      </div>

      {/* 안내 공지 섹션 */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 mb-4 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">⏰</span>
          <div>
            <p className="text-sm font-bold text-gray-700">1인당 하루 최대 3시간 이용 가능</p>
            <p className="text-xs text-gray-400">많은 부원들이 이용할 수 있게 배려해주세요.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-xl">🎹</span>
          <div>
            <p className="text-sm font-bold text-gray-700">크누피 부원 전용 공간</p>
            <p className="text-xs text-gray-400">외부인 대동 시 이용에 제한이 있을 수 있습니다.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 border-t pt-4">
          <span className="text-xl">💬</span>
          <div>
            <p className="text-sm font-bold text-gray-700">문의: 크누피 학생회</p>
            <p className="text-blue-500 text-xs font-semibold cursor-pointer">문의하기</p>
          </div>
        </div>
      </div>

      {/* 예약하기 버튼 (메인 액션) */}
      <div className="w-full max-w-md bg-blue-600 rounded-2xl p-6 mb-4 text-white flex justify-between items-center cursor-pointer hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
        <div>
          <h2 className="text-xl font-bold">연습실 예약하기</h2>
          <p className="text-sm opacity-80">실시간 현황 확인 및 예약</p>
        </div>
        <div className="bg-white/20 rounded-full p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>

      {/* 예약 확인 버튼 */}
      <div className="w-full max-w-md bg-gray-100 rounded-2xl p-6 flex justify-between items-center cursor-pointer hover:bg-gray-200 transition-all">
        <div>
          <h2 className="text-lg font-bold text-gray-700">예약 확인하기</h2>
          <p className="text-sm text-gray-500">본인 예약 정보 조회</p>
        </div>
        <div className="bg-gray-300 rounded-full p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <footer className="mt-auto py-6 text-[10px] text-gray-400">
        © KyungPook National Univ. Piano Club KNUPY Reservation System
      </footer>
    </main>
  );
}
