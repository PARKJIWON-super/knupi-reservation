'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type GuestbookMessage = {
  id: number;
  nickname: string;
  message: string;
  created_at: string;
};

const formatMessageTime = (value: string) => {
  const date = new Date(value);

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function GuestbookPage() {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  };

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('guestbook_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('방명록을 불러오지 못했습니다:', error);
      alert('방명록을 불러오지 못했습니다. Supabase 테이블/RLS 설정을 확인해주세요.');
      setIsLoading(false);
      return;
    }

    setMessages(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('public:guestbook_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guestbook_messages' },
        (payload) => {
          const newMessage = payload.new as GuestbookMessage;
          setMessages((prev) => {
            if (prev.some((item) => item.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedNickname = nickname.trim();
    const trimmedMessage = message.trim();

    if (!trimmedNickname || !trimmedMessage) {
      return alert('닉네임과 할 말을 모두 적어주세요.');
    }

    if (trimmedNickname.length > 20) {
      return alert('닉네임은 20자 이내로 적어주세요.');
    }

    if (trimmedMessage.length > 300) {
      return alert('할 말은 300자 이내로 적어주세요.');
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('guestbook_messages').insert([
      {
        nickname: trimmedNickname,
        message: trimmedMessage,
      },
    ]);

    if (error) {
      console.error('방명록 작성에 실패했습니다:', error);
      alert('방명록 작성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } else {
      setMessage('');
      await fetchMessages();
    }

    setIsSubmitting(false);
  };

  return (
    <main className="h-screen bg-[#F9FAFB] font-['Pretendard'] text-[#1A1A1A] flex flex-col items-center overflow-hidden">
      <div
        className="w-full max-w-[480px] h-[270px] absolute top-[-12px] rounded-[15px] z-0 shadow-sm"
        style={{ background: 'radial-gradient(137.53% 99.23% at 92.41% 7.26%, #FFF5E4 0%, #C7D4F4 100%)' }}
      />

      <div className="w-full max-w-[480px] h-full px-[20px] relative z-10 pt-[52px] pb-5 flex min-h-0 flex-col">
        <header className="mb-5 flex shrink-0 items-center justify-between">
          <div>
            <p className="text-[14px] font-bold text-[#6C86D3] tracking-[-0.03em]">Guestbook</p>
            <h1 className="mt-1 text-[32px] font-black tracking-[-0.05em] text-[#1A1A1A]">방명록</h1>
          </div>
          <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/55 shadow-sm active:scale-90 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
        </header>

        <section className="mb-4 shrink-0 rounded-[28px] border border-white/55 bg-white/35 p-5 shadow-[0_14px_40px_rgba(108,134,211,0.13)] backdrop-blur-xl">
          <p className="text-[18px] font-extrabold tracking-[-0.04em] text-[#333333]">자유롭게 한마디 남겨주세요 💬</p>
          <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#7B8AB0]">채팅하듯 닉네임과 메시지를 적으면 모두가 함께 볼 수 있어요.</p>
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-white/60 bg-white/50 shadow-sm backdrop-blur-xl">
          <div className="flex shrink-0 items-center justify-between border-b border-white/60 px-5 py-4">
            <div>
              <p className="text-[15px] font-black tracking-[-0.03em]">Knupi Chat</p>
              <p className="text-[12px] font-medium text-[#8A93A8]">최근 메시지 {messages.length}개</p>
            </div>
            <span className="rounded-full bg-[#C7D4F4]/70 px-3 py-1 text-[12px] font-bold text-[#4A63B1]">LIVE</span>
          </div>

          <div ref={messageListRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 custom-scrollbar">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-[14px] font-bold text-[#8A93A8]">방명록을 불러오는 중...</div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#C7D4F4]/50 text-[26px]">✍️</div>
                <p className="text-[17px] font-bold tracking-[-0.03em] text-[#333333]">아직 방명록이 없어요</p>
                <p className="mt-2 text-[14px] font-medium text-[#8A93A8]">첫 메시지를 남겨보세요.</p>
              </div>
            ) : (
              <div className="flex min-h-full flex-col justify-end gap-3">
                {messages.map((item, index) => {
                  const isMine = item.nickname.trim() === nickname.trim() && nickname.trim().length > 0;

                  return (
                    <article key={`${item.id}-${index}`} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`flex items-center gap-2 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                          <span className="max-w-[150px] truncate text-[12px] font-black text-[#6C86D3]">{item.nickname}</span>
                          <span className="text-[11px] font-medium text-[#B2B2B2]">{formatMessageTime(item.created_at)}</span>
                        </div>
                        <div className={`whitespace-pre-wrap break-words rounded-[22px] px-4 py-3 text-[15px] font-semibold leading-relaxed tracking-[-0.03em] shadow-sm ${
                          isMine
                            ? 'rounded-tr-[8px] bg-[#C7D4F4] text-[#1A1A1A]'
                            : 'rounded-tl-[8px] bg-white text-[#333333] border border-[#EEF2FF]'
                        }`}>
                          {item.message}
                        </div>
                      </div>
                    </article>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="shrink-0 border-t border-white/60 bg-[#F3F6FC]/80 p-4">
            <input
              type="text"
              maxLength={20}
              placeholder="닉네임"
              value={nickname}
              className="mb-3 w-full rounded-[18px] bg-white px-4 py-3 text-[14px] font-semibold outline-none placeholder:text-gray-400 focus:ring-2 ring-[#C7D4F4] transition-all"
              onChange={(event) => setNickname(event.target.value)}
            />
            <div className="flex items-end gap-2">
              <textarea
                maxLength={300}
                rows={2}
                placeholder="할 말을 적어주세요"
                value={message}
                className="max-h-28 min-h-[52px] flex-1 resize-none rounded-[20px] bg-white px-4 py-3 text-[14px] font-semibold leading-relaxed outline-none placeholder:text-gray-400 focus:ring-2 ring-[#C7D4F4] transition-all"
                onChange={(event) => setMessage(event.target.value)}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-[52px] w-[64px] shrink-0 items-center justify-center rounded-[18px] bg-[#C7D4F4] text-[14px] font-black text-[#1A1A1A] shadow-sm active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '...' : '전송'}
              </button>
            </div>
            <p className="mt-2 text-right text-[11px] font-medium text-[#8A93A8]">{message.length}/300</p>
          </form>
        </section>
      </div>
    </main>
  );
}