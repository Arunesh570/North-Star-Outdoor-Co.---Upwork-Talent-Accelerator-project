import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { ChatWidget } from './components/ChatWidget';
import { Message, ChatRequest, ChatResponse } from './types';
import { useTheme } from './hooks/useTheme';

const BG_PHOTO =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2070&q=80';

type PendingFlow = 'track_order' | 'return' | 'replacement' | null;

/** Returns a context-aware thinking message + delay for a given user input */
function getThinkingState(text: string, flow: PendingFlow): { label: string; ms: number } {
  const l = text.toLowerCase();
  if (flow === 'track_order' || l.includes('order') || l.includes('track') || l.includes('package') || l.includes('shipping') || /\d{3}/.test(l))
    return { label: 'Fetching your order details…', ms: 1600 };
  if (flow === 'return' || flow === 'replacement' || l.includes('return') || l.includes('exchange') || l.includes('refund') || l.includes('replace'))
    return { label: 'Looking up your return options…', ms: 1400 };
  if (l.includes('recommend') || l.includes('gear') || l.includes('suggest') || l.includes('jacket') || l.includes('tent') || l.includes('boot'))
    return { label: 'Exploring gear for your adventure…', ms: 1800 };
  if (l.includes('shipping') || l.includes('delivery') || l.includes('fast') || l.includes('expedit'))
    return { label: 'Checking shipping options…', ms: 1200 };
  if (l.includes('agent') || l.includes('human') || l.includes('person') || l.includes('live'))
    return { label: 'Connecting you to a specialist…', ms: 2000 };
  return { label: 'Thinking about your query…', ms: 1300 };
}

function makeSyntheticBotMessage(id: string, content: string, quickReplies?: string[]): Message {
  return {
    id, role: 'assistant', content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    quickReplies,
  };
}

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const initialWelcomeMessage: Message = {
    id: 'welcome-1',
    role: 'assistant',
    content: `Hey there! I'm the **North Star Support Bot**, your friendly guide for **North Star Outdoor Co.** outdoor apparel and camping gear.\n\nHow can I help you today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    quickActions: ['Track my order', 'Return', 'Replacement', 'Suggestions'],
  };

  const [messages, setMessages] = useState<Message[]>([initialWelcomeMessage]);
  const [context, setContext] = useState<ChatRequest['context']>({});
  const [pendingFlow, setPendingFlow] = useState<PendingFlow>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState('Thinking…');

  const annotatedMessages = useMemo<Message[]>(() => {
    let lastBotIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') { lastBotIdx = i; break; }
    }
    return messages.map((m, i) => ({
      ...m,
      isLatestBotMessage: m.role === 'assistant' && i === lastBotIdx,
    }));
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Determine thinking label + delay
    const { label, ms } = getThinkingState(text, pendingFlow);
    setThinkingLabel(label);
    setIsLoading(true);

    // Artificial thinking delay
    await new Promise<void>(res => setTimeout(res, ms));

    try {
      let enrichedText = text;
      if (pendingFlow === 'track_order') {
        enrichedText = `Track my order #${text.replace(/[^0-9]/g, '') || text}`;
      } else if (pendingFlow === 'return') {
        enrichedText = `I want to start a return for order #${text.replace(/[^0-9]/g, '') || text}`;
      } else if (pendingFlow === 'replacement') {
        enrichedText = `I want to exchange or replace an item from order #${text.replace(/[^0-9]/g, '') || text}`;
      }
      setPendingFlow(null);

      const messagesForServer = newMessages.map((m, i) =>
        i === newMessages.length - 1 && enrichedText !== text
          ? { role: m.role, content: enrichedText }
          : { role: m.role, content: m.content }
      );

      const payload: ChatRequest = { messages: messagesForServer, context };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`${response.status}`);

      const data: ChatResponse = await response.json();
      setMessages([...newMessages, data.message]);
      if (data.newContext !== undefined) setContext(data.newContext);
    } catch {
      setMessages([...newMessages, makeSyntheticBotMessage(
        `err-${Date.now()}`,
        `I hit a snag — please try again in a moment.`,
        ['Track Order #111', 'Return Policy', 'Gear Recommendations']
      )]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (isLoading) return;

    if (action === 'Suggestions') {
      handleSendMessage('Can you recommend some outdoor gear for my upcoming trip?');
      return;
    }

    const prompts: Record<string, { content: string; flow: PendingFlow }> = {
      'Track my order': {
        content: "Sure — what's your **order number**?",
        flow: 'track_order',
      },
      'Return': {
        content: "Of course. What's your **order number** so I can pull it up?",
        flow: 'return',
      },
      'Replacement': {
        content: "Happy to help with an exchange. What's your **order number**?",
        flow: 'replacement',
      },
    };

    const p = prompts[action];
    if (!p) return;

    const botMsg = makeSyntheticBotMessage(
      `flow-${Date.now()}`,
      p.content,
      ['Order #111', 'Order #222', 'Order #333']
    );
    setPendingFlow(p.flow);
    setMessages(prev => [...prev, botMsg]);
  };

  const handleResetChat = () => {
    setMessages([{
      ...initialWelcomeMessage,
      id: `welcome-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setContext({});
    setPendingFlow(null);
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden">
      {/* Full-bleed mountain photo */}
      <img
        src={BG_PHOTO}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
        draggable={false}
      />
      {/* Subtle tint overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'var(--bg-photo-overlay)' }}
      />

      {/* Glassmorphic panel */}
      <div
        className="glass relative z-10 flex h-full w-full flex-col overflow-hidden
                   md:h-[calc(100vh-2.5rem)] md:max-w-4xl lg:max-w-5xl md:rounded-3xl md:mx-auto"
        style={{ color: 'var(--text-primary)' }}
      >
        <Header currentTheme={theme} onToggleTheme={toggleTheme} onResetChat={handleResetChat} />

        <main className="flex flex-1 overflow-hidden">
          <ChatWidget
            messages={annotatedMessages}
            isLoading={isLoading}
            thinkingLabel={thinkingLabel}
            onSendMessage={handleSendMessage}
            onQuickAction={handleQuickAction}
            onResetChat={handleResetChat}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
