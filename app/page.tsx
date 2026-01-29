'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [showLookup, setShowLookup] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      {/* 헤더 섹션 */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 mb-4 flex items-center gap-4 border border-gray-100">
        <div className="bg-blue-600 p-3 rounded-xl text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 10l12-3" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">크누피 연습실 예약</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">KNUPI Practice Room</p>
        </div>
      </div>

      {/* 주의사항 섹션 (사범대 스타일) */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 mb-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-red-500 text-lg">⚠️</span>
          <h3 className="font-bold text-gray-800">이용 주의사항</h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-600 font-medium">
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>이용 가능 시간: 09:00 ~ 24:00</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>음식물 반입 금지 (음료 포함)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>다음 사용자를 위한 뒷정리 필수</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>예약 후 불참 시 이용 제한 가능</span>
          </li>
        </ul>
      </div>

      {/* 예약하기 버튼 */}
      <Link href="/reservation" className="w-full max-w-md mb-4">
        <div className="bg-blue-600 rounded-2xl p-6 text-white flex justify-between items-center cursor-pointer hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
          <div>
            <h2 className="text-xl font-bold">연습실 예약하기</h2>
            <p className="text-sm opacity-80 font-medium">실시간 현황 확인 및 예약</p>
          </div>
          <div className="bg-white/20 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </Link>

      {/* 예약 확인하기 버튼 */}
      <div 
        onClick={() => setShowLookup(!showLookup)}
        className="w-full max-w-md bg-white rounded-2xl p-6 mb-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-all border border-gray-200"
      >
        <div>
          <h2 className="text-lg font-bold text-gray-700">내 예약 확인하기</h2>
          <p className="text-sm text-gray-400 font-medium">이름과 학번으로 조회</p>
        </div>
        <div className="bg-gray-100 rounded-full p-2 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* 예약 조회 입력창 (조회 버튼 클릭 시 등장) */}
      {showLookup && (
        <div className="w-full max-w-md bg-blue-50 rounded-2xl p-6 mb-4 border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-bold text-blue-700 mb-4 text-center">조회 정보를 입력하세요</h3>
          <div className="space-y-3">
            <input type="text" placeholder="이름" className="w-full p-3 rounded-xl border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            <input type="text" placeholder="학번" className="w-full p-3 rounded-xl border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-sm shadow-md hover:bg-blue-700 active:scale-95 transition-all">
              조회하기
            </button>
          </div>
        </div>
      )}

      <footer className="mt-auto py-8 text-[10px] text-gray-300 font-bold tracking-widest">
        © KYUNGPOOK NATIONAL UNIV. PIANO CLUB KNUPI
      </footer>
    </main>
  );
}
