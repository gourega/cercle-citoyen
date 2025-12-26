
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, Search, ChevronLeft, MoreVertical, User as UserIcon, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User, Message, Conversation } from '../types';

const MessagesPage: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    
    // Écouter les nouveaux messages globalement pour mettre à jour la liste des conversations
    const channel = supabase
      .channel('messages-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (id) {
      loadConversation(id);
    }
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (content, created_at)
      `)
      .contains('participant_ids', [user.id])
      .order('updated_at', { ascending: false });

    if (data) {
      const enriched = await Promise.all(data.map(async (conv) => {
        const otherId = conv.participant_ids.find((pid: string) => pid !== user.id);
        const { data: otherUser } = await supabase.from('profiles').select('*').eq('id', otherId).single();
        return { 
          ...conv, 
          other_participant: otherUser ? { ...otherUser, avatar: otherUser.avatar_url } : null,
          last_message: conv.messages?.[conv.messages.length - 1]?.content
        };
      }));
      setConversations(enriched as any);
    }
    setLoading(false);
  };

  const loadConversation = async (convId: string) => {
    const { data: convData } = await supabase.from('conversations').select('*').eq('id', convId).single();
    if (convData) {
      const otherId = convData.participant_ids.find((pid: string) => pid !== user.id);
      const { data: otherUser } = await supabase.from('profiles').select('*').eq('id', otherId).single();
      setActiveConversation({ 
        ...convData, 
        other_participant: otherUser ? { ...otherUser, avatar: otherUser.avatar_url } : null 
      });

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      
      if (msgs) setMessages(msgs);

      // S'abonner aux messages de cette conversation spécifique
      supabase.channel(`conv-${convId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${convId}` 
        }, payload => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConversation || sending) return;
    
    setSending(true);
    const content = input;
    setInput('');

    const { error } = await supabase.from('messages').insert([{
      conversation_id: activeConversation.id,
      sender_id: user.id,
      content: content
    }]);

    if (!error) {
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', activeConversation.id);
    }
    setSending(false);
  };

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
      {/* Sidebar */}
      <div className={`w-full md:w-96 border-r border-gray-50 flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 border-b border-gray-50 bg-gray-50/30">
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Messages</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
            <input 
              placeholder="Rechercher un citoyen..." 
              className="w-full bg-white border border-gray-100 py-3 pl-10 pr-4 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : conversations.length > 0 ? (
            conversations.map(conv => (
              <button 
                key={conv.id}
                onClick={() => navigate(`/messages/${conv.id}`)}
                className={`w-full p-6 flex items-center gap-4 border-b border-gray-50 transition-all hover:bg-gray-50 ${activeConversation?.id === conv.id ? 'bg-blue-50/50 border-r-4 border-r-blue-600' : ''}`}
              >
                <img src={conv.other_participant?.avatar || 'https://picsum.photos/seed/user/100/100'} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                <div className="text-left flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{conv.other_participant?.name || 'Citoyen Inconnu'}</p>
                  <p className="text-xs text-gray-400 truncate mt-1">{conv.last_message || 'Nouvelle conversation'}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-10" />
              <p className="text-xs font-bold uppercase tracking-widest">Aucune discussion</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/messages')} className="md:hidden p-2 hover:bg-gray-50 rounded-lg"><ChevronLeft /></button>
                <img src={activeConversation.other_participant?.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                <div>
                  <h3 className="font-bold text-gray-900">{activeConversation.other_participant?.name}</h3>
                  <p className="text-[9px] font-black uppercase text-emerald-500 tracking-widest flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> En ligne
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-50 rounded-xl"><MoreVertical size={20} className="text-gray-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/20">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-4 rounded-2xl text-sm font-medium shadow-sm ${m.sender_id === user.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                    {m.content}
                    <p className={`text-[8px] font-bold mt-2 uppercase tracking-tighter ${m.sender_id === user.id ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-50 bg-white">
              <div className="flex gap-4 items-center bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:bg-white focus-within:border-blue-100 transition-all">
                <input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Écrire votre message citoyen..." 
                  className="flex-1 bg-transparent py-4 px-4 outline-none text-sm font-medium"
                />
                <button 
                  disabled={!input.trim() || sending}
                  className="bg-gray-900 text-white p-4 rounded-xl hover:bg-black transition-all shadow-xl disabled:opacity-20 active:scale-95"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-8 text-blue-200">
              <Sparkles size={48} />
            </div>
            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">Souveraineté par le Dialogue</h3>
            <p className="text-gray-400 max-w-xs text-sm">Sélectionnez une conversation pour échanger avec vos concitoyens en toute sécurité.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
