import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { FileText, Image as ImageIcon, MessageSquare, Paperclip, Send, Video, X, Download } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { ChatAttachment, useChatNotification } from '../../context/ChatNotificationContext';
import { compressImageFile, readFileAsDataUrl } from '../../utils/imageCompression';

function getAttachmentKind(file: File): ChatAttachment['kind'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'file';
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentList({
  attachments,
  isAdmin,
  onImageClick,
}: {
  attachments: ChatAttachment[];
  isAdmin: boolean;
  onImageClick: (url: string, name: string) => void;
}) {
  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        if (attachment.kind === 'image') {
          return (
            <button
              key={attachment.id}
              type="button"
              onClick={() => onImageClick(attachment.url, attachment.name)}
              className="block cursor-pointer outline-none active:scale-[0.99] transition-transform text-left border-0 p-0 bg-transparent"
            >
              <img
                src={attachment.url}
                alt={attachment.name}
                className="max-h-48 max-w-full rounded-xl object-cover border border-white/30"
              />
            </button>
          );
        }

        if (attachment.kind === 'video') {
          return (
            <video
              key={attachment.id}
              src={attachment.url}
              controls
              className="max-h-56 max-w-full rounded-xl bg-black border border-white/30"
            />
          );
        }

        return (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-3 rounded-xl px-3 py-2 border ${
              isAdmin ? 'bg-white/15 border-white/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <FileText size={17} className="flex-shrink-0" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold truncate">{attachment.name}</span>
              <span className={`block text-[10px] ${isAdmin ? 'text-emerald-50' : 'text-slate-400'}`}>
                {formatFileSize(attachment.size)}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}

export function ChatsPage() {
  const { threads, sendAdminMessage, markThreadRead, deleteMessage } = useChatNotification();
  const [searchParams] = useSearchParams();
  const requestedThreadId = searchParams.get('thread');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    requestedThreadId || (threads.length > 0 ? threads[0].id : null)
  );
  const [input, setInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;

  useEffect(() => {
    if (requestedThreadId && threads.some((thread) => thread.id === requestedThreadId)) {
      setSelectedThreadId(requestedThreadId);
    }
  }, [requestedThreadId]);

  useEffect(() => {
    if (selectedThreadId) {
      markThreadRead(selectedThreadId, 'admin');
    }
  }, [selectedThreadId, selectedThread?.messages.length, markThreadRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages.length]);

  const selectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setSearchParams({ thread: threadId }, { replace: true });
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files?.length) return;

    const attachments = await Promise.all(
      Array.from(files).map(async (file, index) => {
        const kind = getAttachmentKind(file);
        // Images are resized/re-encoded before storage -- a real photo can
        // otherwise blow past the browser's localStorage quota and silently
        // fail to save (see imageCompression.ts).
        const { url, size } =
          kind === 'image'
            ? await compressImageFile(file).then((r) => ({ url: r.dataUrl, size: r.size }))
            : { url: await readFileAsDataUrl(file), size: file.size };
        return {
          id: Date.now() + index,
          name: file.name,
          size,
          type: kind === 'image' ? 'image/jpeg' : file.type || 'application/octet-stream',
          url,
          kind,
        };
      })
    );

    setPendingAttachments((current) => [...current, ...attachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingAttachment = (attachmentId: number) => {
    setPendingAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  };

  const handleSend = () => {
    if ((!input.trim() && pendingAttachments.length === 0) || !selectedThreadId) return;
    sendAdminMessage(selectedThreadId, input.trim(), pendingAttachments);
    setInput('');
    setPendingAttachments([]);
  };

  return (
    <PageContainer>
      <PageTitle title="Chats" subtitle="Manage customer and designer conversations." className="mb-8" />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ height: '560px' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          <div className="border-r border-slate-100 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50 flex-shrink-0">
              <h3 className="font-semibold text-slate-700 text-sm">
                Conversations
                {threads.reduce((sum, thread) => sum + thread.unread, 0) > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                    {threads.reduce((sum, thread) => sum + thread.unread, 0)}
                  </span>
                )}
              </h3>
            </div>
            <div className="overflow-y-auto flex-1">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => selectThread(thread.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition-colors text-left ${
                    thread.id === selectedThreadId ? 'bg-emerald-50/50 border-l-2 border-l-emerald-500' : ''
                  }`}
                >
                  <Avatar user={{ name: thread.customerName }} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800 truncate">{thread.customerName}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{thread.lastTime}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {thread.participantRole === 'designer' && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-semibold">
                          Designer
                        </span>
                      )}
                      <p className="text-xs text-slate-500 truncate">{thread.lastMessage}</p>
                    </div>
                  </div>
                  {thread.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {thread.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-2 flex flex-col h-full overflow-hidden bg-slate-50/30">
            {selectedThread ? (
              <>
                <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex items-center gap-3 flex-shrink-0">
                  <Avatar user={{ name: selectedThread.customerName }} size="sm" />
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{selectedThread.customerName}</p>
                    <p className="text-xs text-emerald-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      {selectedThread.participantRole === 'designer' ? 'Designer online' : 'Customer online'}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {selectedThread.messages.map((msg) => {
                    const isAdmin = msg.from === 'admin';
                    const isOrderCard = msg.text.startsWith('📋 ORDER DETAILS') || msg.text.startsWith('ðŸ“‹ ORDER DETAILS');

                    if (isOrderCard) {
                      const rows = msg.text.split('\n');
                      return (
                        <div key={msg.id} className="flex items-start gap-2">
                          <Avatar user={{ name: 'Support' }} size="xs" />
                          <div className="max-w-[85%] flex flex-col gap-1">
                            <div className="rounded-2xl rounded-bl-sm overflow-hidden border border-slate-200 shadow-sm bg-white">
                              <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 flex items-center gap-2">
                                <span className="text-white font-bold text-sm tracking-wide">New Custom Order</span>
                              </div>
                              <div className="px-4 py-3 space-y-1.5">
                                {rows.slice(2).map((row, i) => {
                                  if (row.startsWith('──') || row.startsWith('â”€â”€')) return <div key={i} className="border-t border-slate-100 my-1.5" />;
                                  const colonIdx = row.indexOf(':');
                                  if (colonIdx === -1) return null;
                                  const label = row.slice(0, colonIdx + 1).trim();
                                  const value = row.slice(colonIdx + 1).trim();
                                  return (
                                    <div key={i} className="flex gap-2 text-xs">
                                      <span className="text-slate-400 font-medium whitespace-nowrap w-28 flex-shrink-0">{label}</span>
                                      <span className="text-slate-800 font-semibold">{value}</span>
                                    </div>
                                  );
                                })}
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="pt-2 mt-2 border-t border-slate-100">
                                    <AttachmentList attachments={msg.attachments} isAdmin={false} onImageClick={(url, name) => setLightboxImage({ url, name })} />
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                          </div>
                        </div>
                      );
                    }

                    const isDeletable = isAdmin;

                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                        <Avatar user={{ name: isAdmin ? 'Support' : selectedThread.customerName }} size="xs" />
                        <div className={`max-w-[75%] flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 group">
                            {isDeletable && (
                              <button 
                                onClick={() => deleteMessage(selectedThread.id, msg.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-red-500 hover:text-red-700 text-xs transition-opacity cursor-pointer order-last"
                                title="Delete message"
                              >
                                Delete
                              </button>
                            )}
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed space-y-3 ${
                              isAdmin
                                ? 'bg-emerald-600 text-white rounded-br-sm'
                                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm shadow-sm'
                            }`}>
                              {msg.text && <p>{msg.text}</p>}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <AttachmentList attachments={msg.attachments} isAdmin={isAdmin} onImageClick={(url, name) => setLightboxImage({ url, name })} />
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="px-5 py-4 border-t border-slate-100 bg-white flex-shrink-0">
                  {pendingAttachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {pendingAttachments.map((attachment) => {
                        const Icon = attachment.kind === 'image' ? ImageIcon : attachment.kind === 'video' ? Video : FileText;
                        return (
                          <div key={attachment.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 max-w-[220px]">
                            <Icon size={15} className="text-slate-500 flex-shrink-0" />
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold text-slate-700 truncate">{attachment.name}</span>
                              <span className="block text-[10px] text-slate-400">{formatFileSize(attachment.size)}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removePendingAttachment(attachment.id)}
                              className="ml-auto text-slate-400 hover:text-slate-700"
                              aria-label={`Remove ${attachment.name}`}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event) => handleFilesSelected(event.target.files)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                      aria-label="Attach files"
                    >
                      <Paperclip size={16} />
                    </button>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder={`Reply to ${selectedThread.customerName}...`}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                    <button
                      onClick={handleSend}
                      className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-sm active:scale-95"
                      aria-label="Send message"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <EmptyState
                  icon={MessageSquare}
                  title="Select a conversation"
                  description="Choose a conversation from the left panel to start chatting."
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Lightbox Modal overlay */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          {/* Header Actions */}
          <div className="absolute top-4 right-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {/* Download Button */}
            <a
              href={lightboxImage.url}
              download={lightboxImage.name}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Download Image"
            >
              <Download size={18} />
            </a>
            {/* Close Button */}
            <button
              onClick={() => setLightboxImage(null)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Centered Image */}
          <div className="max-w-4xl max-h-[80vh] flex flex-col items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl select-none"
            />
            <p className="text-sm font-medium text-slate-300">{lightboxImage.name}</p>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
