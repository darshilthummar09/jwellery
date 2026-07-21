import { useEffect, useRef, useState } from 'react';
import { FileText, MessageCircle, Send } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { Avatar } from '../../components/common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useChatNotification } from '../../context/ChatNotificationContext';
import type { ChatAttachment } from '../../context/ChatNotificationContext';

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentList({ attachments }: { attachments: ChatAttachment[] }) {
  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        if (attachment.kind === 'image') {
          return <img key={attachment.id} src={attachment.url} alt={attachment.name} className="max-h-48 max-w-full rounded-xl object-cover" />;
        }

        if (attachment.kind === 'video') {
          return <video key={attachment.id} src={attachment.url} controls className="max-h-56 max-w-full rounded-xl bg-black" />;
        }

        return (
          <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 border bg-slate-50 border-slate-200 text-slate-700">
            <FileText size={17} className="flex-shrink-0" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold truncate">{attachment.name}</span>
              <span className="block text-[10px] text-slate-400">{formatFileSize(attachment.size)}</span>
            </span>
          </a>
        );
      })}
    </div>
  );
}

export function DesignerChatPage() {
  const { user } = useAuth();
  const { ensureDesignerThread, getDesignerThread, markThreadRead, sendDesignerMessage, deleteMessage } = useChatNotification();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const designerName = user?.name ?? 'Designer';
  const thread = getDesignerThread(designerName);

  useEffect(() => {
    ensureDesignerThread(designerName);
  }, [designerName, ensureDesignerThread]);

  useEffect(() => {
    if (thread) {
      markThreadRead(thread.id, 'designer');
    }
  }, [thread?.id, thread?.messages.length, markThreadRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages.length]);

  const sendMessage = () => {
    if (!input.trim() || !thread) return;
    sendDesignerMessage(thread.id, designerName, input.trim());
    setInput('');
  };

  return (
    <PageContainer>
      <PageTitle title="Admin Chat" subtitle="Chat with the admin team about your assigned projects." className="mb-6" />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col" style={{ height: '520px' }}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <MessageCircle size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Dream Jewels Admin</p>
            <p className="text-xs text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Online
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {(thread?.messages ?? []).map((msg) => {
            const isMe = msg.from === 'designer';
            const isDeletable = isMe;

            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && <Avatar user={{ name: 'Dream Jewels Admin' }} size="xs" />}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className="flex items-center gap-2 group">
                    {isDeletable && (
                      <button 
                        onClick={() => thread && deleteMessage(thread.id, msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-red-500 hover:text-red-700 text-xs transition-opacity cursor-pointer order-last"
                        title="Delete message"
                      >
                        Delete
                      </button>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed space-y-3 ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                      {msg.text && <p>{msg.text}</p>}
                      {msg.attachments && msg.attachments.length > 0 && <AttachmentList attachments={msg.attachments} />}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3">
          <Avatar user={user} size="xs" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
          <button onClick={sendMessage} className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-sm active:scale-95">
            <Send size={15} />
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
