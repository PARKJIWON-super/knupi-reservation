'use client';
import React from 'react';
import Link from 'next/link';

export default function ReservationPage() {
  const pianos = ["1번 피아노", "2번 피아노", "3번 피아노", "업라이트 피아노"];
  const hours = Array.from({ length: 16 }, (_, i) => i + 9); // 09:00 ~ 24:00

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-blue-600 font-bold text-sm">← 홈으로</Link>
          <h1 className="text-xl font-bold text-gray-800 text-center">실시간 예약 현황</h1>
          <div className="w-10"></div>
        </div>

        {/* 타임라인 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-18 border-b pb-2 mb-2 text-[10px] text-gray-400 font-bold text-center">
              <div className="col-span-2">구분</div>
              {hours.map(h => <div key={h}>{h}</div>)}
            </div>
            {pianos.map(piano => (
              <div key={piano} className="grid grid-cols-18 items-center py-2 border-b border-gray-50 last:border-0">
                <div className="col-span-2 text-[11px] font-bold text-gray-600">{piano}</div>
                {hours.map(h => (
                  <div key={h} className="h-5 mx-0.5 rounded bg-green-100 border border-green-200"></div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* 예약 입력 폼 */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">예약 신청</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="이름" className="p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="학번 (10자리)" className="p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="tel" placeholder="전화번호" className="p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-2">
              <select className="flex-1 p-3 bg-gray-50 rounded-xl outline-none"><option>시작 시간</option></select>
              <select className="flex-1 p-3 bg-gray-50 rounded-xl outline-none"><option>종료 시간</option></select>
            </div>
          </div>
          <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-6">신청 완료</button>
        </div>
      </div>
    </main>
  );
}