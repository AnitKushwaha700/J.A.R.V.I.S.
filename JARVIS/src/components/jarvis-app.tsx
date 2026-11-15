"use client";

import {
  Activity,
  ArrowRight,
  AudioLines,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Flame,
  GraduationCap,
  Headphones,
  History,
  LayoutDashboard,
  ListChecks,
  LoaderCircle,
  MessageCircle,
  Mic,
  MicOff,
  Plus,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Target,
  TrendingUp,
  Volume2,
  VolumeX,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";

type Page = "overview" | "assistant" | "tasks" | "progress" | "settings";
type AssistantMode = "assistant" | "english" | "interview";
type ConversationState = "ready" | "listening" | "thinking" | "speaking" | "error";
type TaskStatus = "todo" | "in_progress" | "completed" | "skipped";
type TaskPriority = "low" | "medium" | "high";
type Personality = "professional" | "friendly" | "strict" | "concise";
type ResponseLength = "short" | "balanced" | "detailed";

type WorkspaceTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type ConversationSummary = {
  id: string;
  title: string;
  mode: AssistantMode;
  createdAt: string;
  updatedAt: string;
};

type VoiceResult = ArrayLike<{ transcript: string }>;
type VoiceRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onresult: ((event: any) => void) | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type VoiceWindow = Window & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SpeechRecognition?: new () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webkitSpeechRecognition?: new () => any;
};
type WorkspaceSettings = {
  personality: Personality;
  responseLength: ResponseLength;
  speechRate: number;
  voiceURI: string;
  autoSpeak: boolean;
  autoSendVoice: boolean;
};
type TaskInput = {
  title: string;
  priority: TaskPriority;
  dueAt: string | null;
};

type NavEntry = {
  id: Page;
  label: string;
  icon: LucideIcon;
};

const navigation: NavEntry[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "assistant", label: "TalkMe assistant", icon: AudioLines },
  { id: "tasks", label: "Daily tasks", icon: ListChecks },
  { id: "progress", label: "Progress", icon: TrendingUp },
];

const modeDetails: Record<
  AssistantMode,
  { label: string; shortLabel: string; description: string; icon: LucideIcon; prompts: string[] }
> = {
  assistant: {
    label: "JARVIS assistant",
    shortLabel: "TalkMe",
    description: "Ask a question, make a plan, or talk through your next step.",
    icon: Sparkles,
    prompts: ["Help me plan a focused day", "Explain a Java concept simply", "What should I work on next?"],
  },
  english: {
    label: "English coach",
    shortLabel: "English coach",
    description: "Practice naturally. Get one useful correction and a follow-up, not a lecture.",
    icon: BookOpen,
    prompts: ["Let's practice a workplace conversation", "Ask me about my weekend", "Help me explain my current project"],
  },
  interview: {
    label: "Mock interview",
    shortLabel: "Mock interview",
    description: "Practice one question at a time and get specific, evidence-based feedback.",
    icon: BriefcaseBusiness,
    prompts: ["Start a junior software engineer interview", "Ask me a Java fundamentals question", "Practice a behavioral question using STAR"],
  },
};

const pageTitles: Record<Page, string> = {
  overview: "Overview",
  assistant: "TalkMe assistant",
  tasks: "Daily tasks",
  progress: "Progress",
  settings: "Settings",
};

const statusLabels: Record<ConversationState, string> = {
  ready: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  error: "Needs attention",
};

const initialSettings: WorkspaceSettings = {
  personality: "professional",
  responseLength: "balanced",
  speechRate: 1,
  voiceURI: "",
  autoSpeak: true,
  autoSendVoice: false,
};

function isMode(value: unknown): value is AssistantMode {
  return value === "assistant" || value === "english" || value === "interview";
}

function dateLabel(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status: TaskStatus): string {
  if (status === "in_progress") return "In progress";
  if (status === "completed") return "Completed";
  if (status === "skipped") return "Skipped";
  return "To do";
}

function nextTaskStatus(status: TaskStatus): TaskStatus {
  if (status === "todo") return "in_progress";
  if (status === "in_progress") return "completed";
  return "todo";
}

function errorText(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return fallback;
}

export function JarvisApp() {
  const [page, setPage] = useState<Page>("overview");
  const [activeMode, setActiveMode] = useState<AssistantMode>("assistant");
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [settings, setSettings] = useState<WorkspaceSettings>(initialSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<ConversationState>("ready");
  const [chatError, setChatError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const requestInFlightRef = useRef(false);
  const [taskPendingId, setTaskPendingId] = useState<string | null>(null);
  const [taskSaving, setTaskSaving] = useState(false);
  const recognitionRef = useRef<VoiceRecognition | null>(null);
  const speechTranscriptRef = useRef("");

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const sessionResponse = await fetch("/api/session", { cache: "no-store" });
        if (!sessionResponse.ok) throw new Error("Workspace session could not be started.");
        const session = (await sessionResponse.json()) as { aiConfigured?: boolean };
        if (mounted) setAiConfigured(session.aiConfigured === true);

        const [taskResponse, historyResponse] = await Promise.all([
          fetch("/api/tasks", { cache: "no-store" }),
          fetch("/api/conversations", { cache: "no-store" }),
        ]);
        if (!taskResponse.ok || !historyResponse.ok) {
          throw new Error("Workspace data is temporarily unavailable.");
        }
        const taskData = (await taskResponse.json()) as { tasks?: WorkspaceTask[] };
        const historyData = (await historyResponse.json()) as {
          conversations?: ConversationSummary[];
        };
        if (mounted) {
          setTasks(taskData.tasks ?? []);
          setConversations(historyData.conversations ?? []);
          setOnline(true);
          setReady(true);
        }
      } catch {
        if (mounted) {
          setOnline(false);
          setReady(true);
          setTaskError("Your workspace could not connect. Check the server and database, then refresh.");
        }
      }
    }

    void bootstrap();
    return () => {
      mounted = false;
      recognitionRef.current?.abort();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("talkme-settings-v1");
      if (saved) {
        const value = JSON.parse(saved) as Partial<WorkspaceSettings>;
        setSettings({
          ...initialSettings,
          ...value,
          speechRate:
            typeof value.speechRate === "number"
              ? Math.min(1.5, Math.max(0.75, value.speechRate))
              : initialSettings.speechRate,
        });
      }
    } catch {
      // Ignore invalid or unavailable local preferences; server data is unaffected.
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    try {
      window.localStorage.setItem("talkme-settings-v1", JSON.stringify(settings));
    } catch {
      // Settings continue to work for the current session if storage is unavailable.
    }
  }, [settings, settingsLoaded]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const updateVoices = () => setVoices(window.speechSynthesis.getVoices());
    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
  }, []);

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== "completed" && task.status !== "skipped"),
    [tasks],
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "completed"),
    [tasks],
  );
  const recentConversations = conversations.slice(0, 6);
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));

  async function refreshConversations() {
    try {
      const response = await fetch("/api/conversations", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load conversation history.");
      const result = (await response.json()) as { conversations?: ConversationSummary[] };
      setConversations(result.conversations ?? []);
      setConversationError(null);
    } catch {
      setConversationError("Conversation history could not be refreshed.");
    }
  }

  function startSession(mode: AssistantMode) {
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    setConversationId(null);
    setMessages([]);
    setActiveMode(mode);
    setDraft("");
    setChatError(null);
    setState("ready");
    setPage("assistant");
  }

  function chooseMode(mode: AssistantMode) {
    if (mode === activeMode) return;
    if (conversationId && !window.confirm("Start a new session in this mode? Your current session will remain in history.")) {
      return;
    }
    startSession(mode);
  }

  async function openConversation(id: string) {
    setConversationError(null);
    try {
      const response = await fetch(`/api/conversations?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as {
        error?: string;
        conversation?: ConversationSummary;
        messages?: ChatMessage[];
      };
      if (!response.ok || !result.conversation) {
        throw new Error(result.error ?? "That conversation could not be opened.");
      }
      setConversationId(result.conversation.id);
      setActiveMode(isMode(result.conversation.mode) ? result.conversation.mode : "assistant");
      setMessages(result.messages ?? []);
      setDraft("");
      setChatError(null);
      setState("ready");
      setPage("assistant");
    } catch (error) {
      setConversationError(error instanceof Error ? error.message : "Conversation could not be opened.");
    }
  }

  function speakText(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setState("ready");
      setChatError("Speech playback is not available in this browser. You can still read the reply.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.speechRate;
    const selectedVoice = voices.find((voice) => voice.voiceURI === settings.voiceURI);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onend = () => setState("ready");
    utterance.onerror = () => setState((current) => (current === "speaking" ? "ready" : current));
    setState("speaking");
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setState((current) => (current === "speaking" ? "ready" : current));
  }

  function startListening() {
    if (typeof window === "undefined") return;
    const voiceWindow = window as VoiceWindow;
    const Recognition = voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setChatError("Speech recognition is not supported by this browser. Try a current version of Chrome or Edge, or type your message.");
      setState("error");
      return;
    }

    window.speechSynthesis?.cancel();
    setChatError(null);
    speechTranscriptRef.current = "";
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      speechTranscriptRef.current = transcript;
      setDraft(transcript);
    };
    recognition.onerror = (event) => {
      const messages: Record<string, string> = {
        "not-allowed": "Microphone permission was denied. Allow microphone access in your browser settings.",
        "no-speech": "No speech was detected. Try again or type your message.",
        "network": "Speech recognition needs a network connection in this browser.",
      };
      setChatError(messages[event.error ?? ""] ?? "Speech recognition stopped unexpectedly. You can type your message instead.");
      setState("error");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      if (settings.autoSendVoice && speechTranscriptRef.current.trim()) {
        void sendMessage(speechTranscriptRef.current.trim());
      } else {
        setState((current) => (current === "listening" ? "ready" : current));
      }
    };
    recognitionRef.current = recognition as unknown as VoiceRecognition;
    setState("listening");
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setState("error");
      setChatError("The microphone could not be started. Check browser permissions and try again.");
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setState((current) => (current === "listening" ? "ready" : current));
  }

  async function sendMessage(rawText?: string) {
    const text = (rawText ?? draft).trim();
    if (!text || requestInFlightRef.current) return;
    if (!aiConfigured) {
      setChatError("Grok is not configured. Add XAI_API_KEY to the server environment, then refresh.");
      setState("error");
      return;
    }

    recognitionRef.current?.abort();
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    requestInFlightRef.current = true;
    setSending(true);
    setState("thinking");
    setChatError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          mode: activeMode,
          message: text,
          settings: {
            personality: settings.personality,
            responseLength: settings.responseLength,
          },
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        conversationId?: string;
        userMessage?: ChatMessage;
        assistantMessage?: ChatMessage;
      };
      if (!response.ok || !result.conversationId || !result.userMessage || !result.assistantMessage) {
        throw new Error(result.error ?? "JARVIS could not complete that request.");
      }

      setConversationId(result.conversationId);
      setMessages((current) => [
        ...current,
        result.userMessage as ChatMessage,
        result.assistantMessage as ChatMessage,
      ]);
      setDraft("");
      setState("ready");
      void refreshConversations();
      if (settings.autoSpeak) speakText(result.assistantMessage.content);
    } catch (error) {
      setDraft(text);
      setChatError(error instanceof Error ? error.message : "JARVIS could not complete that request.");
      setState("error");
    } finally {
      requestInFlightRef.current = false;
      setSending(false);
    }
  }

  async function createTask(input: TaskInput): Promise<boolean> {
    setTaskSaving(true);
    setTaskError(null);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.title,
          priority: input.priority,
          dueAt: input.dueAt,
        }),
      });
      const result = (await response.json()) as { task?: WorkspaceTask; error?: string };
      if (!response.ok || !result.task) throw new Error(result.error ?? "Task could not be saved.");
      setTasks((current) => [result.task as WorkspaceTask, ...current]);
      setOnline(true);
      return true;
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : "Task could not be saved.");
      return false;
    } finally {
      setTaskSaving(false);
    }
  }

  async function updateTaskStatus(task: WorkspaceTask, status: TaskStatus) {
    setTaskPendingId(task.id);
    setTaskError(null);
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status }),
      });
      const result = (await response.json()) as { task?: WorkspaceTask; error?: string };
      if (!response.ok || !result.task) throw new Error(result.error ?? "Task could not be updated.");
      setTasks((current) => current.map((item) => (item.id === task.id ? (result.task as WorkspaceTask) : item)));
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : "Task could not be updated.");
    } finally {
      setTaskPendingId(null);
    }
  }

  async function clearHistory() {
    if (!window.confirm("Delete every saved conversation in this browser workspace? This cannot be undone.")) return;
    setConversationError(null);
    try {
      const response = await fetch("/api/conversations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "History could not be deleted.");
      setConversations([]);
      setMessages([]);
      setConversationId(null);
      setConversationError("Conversation history was deleted.");
    } catch (error) {
      setConversationError(error instanceof Error ? error.message : "History could not be deleted.");
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function replayLastResponse() {
    const lastAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant");
    if (lastAssistantMessage) speakText(lastAssistantMessage.content);
  }

  const sectionTitle = page === "assistant" ? modeDetails[activeMode].label : pageTitles[page];

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand-lockup">
          <div className="brand-mark"><AudioLines size={21} strokeWidth={1.8} /></div>
          <div className="brand-copy">
            <strong>JARVIS</strong>
            <span>TalkMe workspace</span>
          </div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const selected = page === item.id || (item.id === "assistant" && page === "assistant");
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item${selected ? " selected" : ""}`}
                onClick={() => setPage(item.id)}
                aria-current={selected ? "page" : undefined}
                title={item.label}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.id === "tasks" && openTasks.length > 0 && (
                  <span className="nav-count">{openTasks.length > 9 ? "9+" : openTasks.length}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-section-label tools-label">PRACTICE &amp; VAULT</div>
        <div className="sidebar-mode-links">
          <button type="button" className="mode-link" onClick={() => startSession("english")} title="Start English practice">
            <BookOpen size={17} strokeWidth={1.8} /><span>English coach</span><span className="mode-link-dot" />
          </button>
          <button type="button" className="mode-link" onClick={() => startSession("interview")} title="Start a mock interview">
            <BriefcaseBusiness size={17} strokeWidth={1.8} /><span>Mock interview</span>
          </button>
          <Link href="/practice" className="mode-link" title="All Scenarios">
            <GraduationCap size={17} strokeWidth={1.8} /><span>All Scenarios</span>
          </Link>
          <Link href="/grammar" className="mode-link" title="Grammar Review">
            <CheckCircle2 size={17} strokeWidth={1.8} /><span>Grammar Vault</span>
          </Link>
          <Link href="/vocabulary" className="mode-link" title="Vocabulary Vault">
            <Sparkles size={17} strokeWidth={1.8} /><span>Vocabulary</span>
          </Link>
          <Link href="/history" className="mode-link" title="Conversation History">
            <History size={17} strokeWidth={1.8} /><span>History Logs</span>
          </Link>
        </div>

        <div className="sidebar-spacer" />
        <div className="workspace-note">
          <div className="workspace-note-icon"><ShieldCheck size={16} /></div>
          <div><strong>Browser workspace</strong><span>Anonymous device-scoped session</span></div>
        </div>
        <button type="button" className={`nav-item settings-nav${page === "settings" ? " selected" : ""}`} onClick={() => setPage("settings")}>
          <Settings2 size={18} strokeWidth={1.8} /><span>Preferences</span>
        </button>
        <div className="sidebar-profile">
          <div className="profile-avatar">J</div>
          <div className="profile-text"><strong>My workspace</strong><span>Personal assistant</span></div>
          <ChevronDown size={15} />
        </div>
      </aside>

      <main className="main-column">
        <header className="topbar">
          <div className="topbar-heading">
            <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><strong>{sectionTitle}</strong></div>
            <p className="topbar-subtitle">A little progress, every day.</p>
          </div>
          <div className="topbar-actions">
            <div className={`system-indicator ${online ? "online" : "offline"}`}>
              <span className="system-indicator-dot" />
              {online ? "Workspace connected" : "Offline"}
            </div>
            <button type="button" className="icon-button topbar-settings" aria-label="Open preferences" onClick={() => setPage("settings")}>
              <Settings2 size={18} />
            </button>
            <div className="topbar-avatar" aria-label="Personal workspace">J</div>
          </div>
        </header>

        <div className="page-content">
          {!ready && <div className="loading-strip"><LoaderCircle size={16} className="spin" /> Preparing your workspace…</div>}
          {ready && !online && <div className="notice-banner notice-error"><Activity size={17} /><span>{taskError ?? "Workspace data is unavailable."}</span></div>}
          {ready && online && aiConfigured === false && (
            <div className="notice-banner notice-info">
              <Sparkles size={17} /><span>AI replies are paused until a server-side <code>XAI_API_KEY</code> is configured. Your workspace and voice controls are ready.</span>
            </div>
          )}

          {page === "overview" && (
            <OverviewPage
              tasks={tasks}
              conversations={recentConversations}
              openTasks={openTasks}
              completedTasks={completedTasks}
              onStart={startSession}
              onOpenTasks={() => setPage("tasks")}
              onOpenConversation={openConversation}
              onCreateTask={createTask}
              onUpdateTask={updateTaskStatus}
              savingTask={taskSaving}
              pendingTaskId={taskPendingId}
              taskError={taskError}
              conversationError={conversationError}
            />
          )}
          {page === "assistant" && (
            <AssistantPage
              activeMode={activeMode}
              messages={messages}
              conversations={recentConversations}
              conversationId={conversationId}
              draft={draft}
              setDraft={setDraft}
              state={state}
              chatError={chatError}
              sending={sending}
              aiConfigured={aiConfigured === true}
              settings={settings}
              onSettingsChange={setSettings}
              voices={englishVoices}
              onModeChange={chooseMode}
              onSend={sendMessage}
              onKeyDown={handleComposerKeyDown}
              onStartListening={startListening}
              onStopListening={stopListening}
              onStopSpeaking={stopSpeaking}
              onReplay={replayLastResponse}
              onOpenConversation={openConversation}
              onNewSession={() => startSession(activeMode)}
            />
          )}
          {page === "tasks" && (
            <TasksPage
              tasks={tasks}
              openTasks={openTasks}
              completedTasks={completedTasks}
              onCreateTask={createTask}
              onUpdateTask={updateTaskStatus}
              saving={taskSaving}
              pendingId={taskPendingId}
              error={taskError}
            />
          )}
          {page === "progress" && (
            <ProgressPage
              tasks={tasks}
              conversations={conversations}
              completedTasks={completedTasks}
              onOpenConversation={openConversation}
              onStart={startSession}
            />
          )}
          {page === "settings" && (
            <SettingsPage
              settings={settings}
              onChange={setSettings}
              voices={englishVoices}
              aiConfigured={aiConfigured === true}
              ready={ready}
              historyCount={conversations.length}
              historyMessage={conversationError}
              onClearHistory={clearHistory}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function OverviewPage(props: {
  tasks: WorkspaceTask[];
  conversations: ConversationSummary[];
  openTasks: WorkspaceTask[];
  completedTasks: WorkspaceTask[];
  onStart: (mode: AssistantMode) => void;
  onOpenTasks: () => void;
  onOpenConversation: (id: string) => void;
  onCreateTask: (input: TaskInput) => Promise<boolean>;
  onUpdateTask: (task: WorkspaceTask, status: TaskStatus) => void;
  savingTask: boolean;
  pendingTaskId: string | null;
  taskError: string | null;
  conversationError: string | null;
}) {
  const completionRate = props.tasks.length
    ? Math.round((props.completedTasks.length / props.tasks.length) * 100)
    : 0;

  return (
    <div className="overview-page page-enter">
      <div className="overview-intro">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR PERSONAL COMMAND CENTER</span>
          <h1>Make room for <span>momentum.</span></h1>
          <p>Practice your English, sharpen your engineering skills, and take the next useful step.</p>
        </div>
        <div className="day-chip"><CalendarClock size={16} /><span>A workspace built around you</span></div>
      </div>

      <section className="hero-card">
        <div className="hero-content">
          <div className="hero-topline"><Sparkles size={15} /><span>YOUR AI MENTOR</span><span className="hero-live-dot" /> <span className="hero-live-text">READY WHEN YOU ARE</span></div>
          <h2>A clearer next step<br /><span>starts with a conversation.</span></h2>
          <p>Talk through a problem, practice speaking, or get ready for your next interview. JARVIS will meet you where you are.</p>
          <div className="hero-actions">
            <button type="button" className="button-primary" onClick={() => props.onStart("assistant")}><AudioLines size={17} /> Start a conversation <ArrowRight size={16} /></button>
            <button type="button" className="button-quiet hero-secondary" onClick={() => props.onStart("english")}><BookOpen size={16} /> Practice English</button>
          </div>
          <div className="hero-footnote"><ShieldCheck size={14} /> Browser speech may use its own service; this app does not store raw audio.</div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <div className="hero-orb"><div className="hero-orb-core"><AudioLines size={42} strokeWidth={1.4} /></div></div>
          <div className="hero-orb-caption"><span className="hero-caption-dot" /> READY TO LISTEN</div>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard label="OPEN PRIORITIES" value={String(props.openTasks.length).padStart(2, "0")} footnote="Tasks to move forward" icon={Target} accent="cyan" />
        <StatCard label="COMPLETED" value={String(props.completedTasks.length).padStart(2, "0")} footnote="Wins in your task list" icon={CheckCircle2} accent="green" />
        <StatCard label="RECENT SESSIONS" value={String(props.conversations.length).padStart(2, "0")} footnote="Saved conversations" icon={MessageCircle} accent="violet" />
        <StatCard label="TASK MOMENTUM" value={`${completionRate}%`} footnote="Completed in your current list" icon={TrendingUp} accent="amber" />
      </div>

      <div className="overview-grid">
        <section className="panel focus-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">YOUR DAY</span><h2>Today&apos;s focus</h2></div>
            <button type="button" className="text-link" onClick={props.onOpenTasks}>All tasks <ArrowRight size={15} /></button>
          </div>
          <div className="focus-summary"><div className="focus-summary-icon"><Flame size={16} /></div><span>{props.openTasks.length ? `${props.openTasks.length} priorities ready when you are` : "Start with one small, meaningful task"}</span></div>
          {props.taskError && <p className="inline-error">{props.taskError}</p>}
          {props.openTasks.length ? (
            <div className="task-list compact-task-list">
              {props.openTasks.slice(0, 4).map((task) => (
                <TaskRow key={task.id} task={task} compact pending={props.pendingTaskId === task.id} onStatus={(status) => props.onUpdateTask(task, status)} />
              ))}
            </div>
          ) : (
            <div className="empty-tasks"><div className="empty-state-icon"><ListChecks size={19} /></div><div><strong>Nothing on the list yet</strong><span>Turn a goal into a small next action.</span></div></div>
          )}
          <div className="quick-add-wrap"><TaskAddForm compact onCreate={props.onCreateTask} saving={props.savingTask} /></div>
        </section>

        <section className="panel quick-start-panel">
          <div className="panel-heading"><div><span className="eyebrow">PICK UP WHERE YOU ARE</span><h2>Quick starts</h2></div><Zap size={17} className="panel-heading-icon" /></div>
          <button type="button" className="quick-start-row" onClick={() => props.onStart("english")}>
            <span className="quick-icon quick-icon-blue"><BookOpen size={17} /></span><span className="quick-row-copy"><strong>English speaking practice</strong><small>Make your ideas sound natural</small></span><ArrowRight size={16} className="quick-arrow" />
          </button>
          <button type="button" className="quick-start-row" onClick={() => props.onStart("interview")}>
            <span className="quick-icon quick-icon-purple"><BriefcaseBusiness size={17} /></span><span className="quick-row-copy"><strong>Run a mock interview</strong><small>One question at a time</small></span><ArrowRight size={16} className="quick-arrow" />
          </button>
          <button type="button" className="quick-start-row" onClick={() => props.onStart("assistant")}>
            <span className="quick-icon quick-icon-green"><Headphones size={17} /></span><span className="quick-row-copy"><strong>Talk through a challenge</strong><small>Get a clear next step</small></span><ArrowRight size={16} className="quick-arrow" />
          </button>
          <div className="quick-tip"><Sparkles size={14} /><span>Say it out loud or type a message. Your choice.</span></div>
        </section>
      </div>

      <div className="overview-lower-grid">
        <section className="panel recent-panel">
          <div className="panel-heading"><div><span className="eyebrow">YOUR HISTORY</span><h2>Recent conversations</h2></div><History size={17} className="panel-heading-icon" /></div>
          {props.conversationError && <p className="inline-error">{props.conversationError}</p>}
          {props.conversations.length ? (
            <div className="recent-list">
              {props.conversations.slice(0, 4).map((conversation) => {
                const ModeIcon = modeDetails[conversation.mode]?.icon ?? MessageCircle;
                return (
                  <button key={conversation.id} type="button" className="recent-row" onClick={() => props.onOpenConversation(conversation.id)}>
                    <span className="recent-icon"><ModeIcon size={16} /></span><span className="recent-copy"><strong>{conversation.title}</strong><small>{modeDetails[conversation.mode]?.shortLabel ?? "TalkMe"}</small></span><ChevronRight size={16} className="recent-chevron" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty-history"><span className="history-empty-icon"><MessageCircle size={18} /></span><span><strong>Your conversations live here</strong><small>Start a session and your history will appear.</small></span></div>
          )}
        </section>

        <section className="panel progress-snapshot">
          <div className="panel-heading"><div><span className="eyebrow">SMALL STEPS ADD UP</span><h2>Task momentum</h2></div><Activity size={17} className="panel-heading-icon" /></div>
          <div className="progress-snapshot-body"><div className="progress-ring" style={{ "--progress": `${completionRate}%` } as CSSProperties}><div><strong>{completionRate}<small>%</small></strong><span>done</span></div></div><div className="progress-snapshot-copy"><strong>{props.completedTasks.length} of {props.tasks.length} tasks completed</strong><span>A simple snapshot based on tasks saved in this workspace.</span><div className="progress-track"><span style={{ width: `${completionRate}%` }} /></div></div></div>
          <p className="measured-note"><ShieldCheck size={13} /> Measured from your saved task list</p>
        </section>
      </div>
    </div>
  );
}

function StatCard(props: { label: string; value: string; footnote: string; icon: LucideIcon; accent: string }) {
  const Icon = props.icon;
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-${props.accent}`}><Icon size={17} strokeWidth={1.8} /></div>
      <div className="stat-copy"><span>{props.label}</span><strong>{props.value}</strong><small>{props.footnote}</small></div>
      <span className={`stat-accent-dot dot-${props.accent}`} />
    </article>
  );
}

function AssistantPage(props: {
  activeMode: AssistantMode;
  messages: ChatMessage[];
  conversations: ConversationSummary[];
  conversationId: string | null;
  draft: string;
  setDraft: (value: string) => void;
  state: ConversationState;
  chatError: string | null;
  sending: boolean;
  aiConfigured: boolean;
  settings: WorkspaceSettings;
  onSettingsChange: (settings: WorkspaceSettings) => void;
  voices: SpeechSynthesisVoice[];
  onModeChange: (mode: AssistantMode) => void;
  onSend: (text?: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onReplay: () => void;
  onOpenConversation: (id: string) => void;
  onNewSession: () => void;
}) {
  const messagesRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const element = messagesRef.current;
    if (element) element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [props.messages, props.sending]);

  const details = modeDetails[props.activeMode];
  const statusIcon = props.state === "listening" ? <Mic size={14} /> : props.state === "thinking" ? <LoaderCircle size={14} className="spin" /> : props.state === "speaking" ? <Volume2 size={14} /> : props.state === "error" ? <X size={14} /> : <span className="tiny-status-dot" />;

  return (
    <div className="assistant-page page-enter">
      <div className="assistant-page-heading">
        <div><span className="eyebrow"><span className="eyebrow-dot" /> VOICE + TEXT WORKSPACE</span><h1>{details.label}</h1><p>{details.description}</p></div>
        <button type="button" className="button-secondary new-session-button" onClick={props.onNewSession}><Plus size={16} /> New session</button>
      </div>

      <div className="mode-tabs" role="tablist" aria-label="Conversation mode">
        {(Object.keys(modeDetails) as AssistantMode[]).map((mode) => {
          const Icon = modeDetails[mode].icon;
          return (
            <button key={mode} type="button" role="tab" aria-selected={props.activeMode === mode} className={`mode-tab${props.activeMode === mode ? " active" : ""}`} onClick={() => props.onModeChange(mode)}>
              <Icon size={16} /><span>{modeDetails[mode].shortLabel}</span>
            </button>
          );
        })}
      </div>

      <div className="assistant-layout">
        <section className="conversation-card" aria-label="Conversation">
          <div className="conversation-card-header">
            <div className="conversation-agent"><div className="agent-avatar"><AudioLines size={18} /></div><div><strong>JARVIS <span className="agent-version">PERSONAL AI</span></strong><small>{details.shortLabel} · {props.conversationId ? "Saved session" : "New session"}</small></div></div>
            <div className={`conversation-status status-${props.state}`} role="status">{statusIcon}<span>{statusLabels[props.state]}</span></div>
          </div>

          <div className="message-list" ref={messagesRef}>
            {props.messages.length === 0 ? (
              <div className="conversation-empty">
                <div className="empty-orb"><div className="empty-orb-core"><AudioLines size={29} /></div></div>
                <span className="eyebrow">A CALM PLACE TO THINK OUT LOUD</span>
                <h2>What would you like to work on?</h2>
                <p>{props.aiConfigured ? details.description : "You can try voice input now. Add your Grok API key on the server to receive AI responses."}</p>
                <div className="suggestion-list">
                  {details.prompts.map((prompt) => <button key={prompt} type="button" onClick={() => props.onSend(prompt)} disabled={!props.aiConfigured || props.sending}>{prompt}<ArrowRight size={14} /></button>)}
                </div>
              </div>
            ) : (
              <div className="message-stack">
                {props.messages.map((message) => <MessageBubble key={message.id} message={message} onReplay={props.onReplay} />)}
                {props.sending && <div className="typing-row"><span className="typing-avatar"><Sparkles size={14} /></span><span>JARVIS is thinking</span><i /><i /><i /></div>}
              </div>
            )}
          </div>

          {props.chatError && <div className="chat-error" role="alert"><span><X size={15} />{props.chatError}</span></div>}
          <form className="composer" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); props.onSend(); }}>
            <div className="composer-input-row">
              <textarea
                value={props.draft}
                onChange={(event) => props.setDraft(event.target.value)}
                onKeyDown={props.onKeyDown}
                placeholder={props.state === "listening" ? "Listening… speak naturally" : "Message JARVIS or use your microphone…"}
                aria-label="Message JARVIS"
                rows={2}
                maxLength={2_000}
                disabled={props.sending}
              />
              <div className="composer-actions">
                <button type="button" className={`composer-icon-button mic-button${props.state === "listening" ? " is-listening" : ""}`} onClick={props.state === "listening" ? props.onStopListening : props.onStartListening} aria-label={props.state === "listening" ? "Stop listening" : "Start microphone"} title={props.state === "listening" ? "Stop listening" : "Speak your message"}>
                  {props.state === "listening" ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button type="submit" className="send-button" disabled={props.sending || !props.draft.trim() || !props.aiConfigured} aria-label="Send message" title="Send message"><Send size={17} /></button>
              </div>
            </div>
            <div className="composer-footer"><span><kbd>Enter</kbd> to send <span className="composer-footer-dot">·</span> <kbd>Shift + Enter</kbd> for a new line</span><button type="button" className={`auto-speak-control${props.settings.autoSpeak ? " enabled" : ""}`} onClick={() => props.onSettingsChange({ ...props.settings, autoSpeak: !props.settings.autoSpeak })} aria-pressed={props.settings.autoSpeak}><Volume2 size={14} /> Auto speak {props.settings.autoSpeak ? "on" : "off"}</button></div>
          </form>
        </section>

        <aside className="assistant-aside">
          <section className="voice-card">
            <div className="voice-card-title"><span className="eyebrow">VOICE LINK</span><span className="voice-link-indicator"><span /> BROWSER</span></div>
            <div className={`voice-orb voice-orb-${props.state}`}><div className="voice-orb-inner"><AudioLines size={30} strokeWidth={1.5} /></div><span className="voice-orb-ring voice-orb-ring-one" /><span className="voice-orb-ring voice-orb-ring-two" /></div>
            <div className="voice-card-status"><strong>{statusLabels[props.state]}</strong><span>{props.state === "listening" ? "Speak clearly; your transcript appears here" : props.state === "thinking" ? "Working on your response" : props.state === "speaking" ? "JARVIS is reading the reply aloud" : "Microphone and playback use your browser"}</span></div>
            <button type="button" className={`voice-action-button${props.state === "listening" ? " listening" : ""}`} onClick={props.state === "listening" ? props.onStopListening : props.onStartListening}>
              {props.state === "listening" ? <><Square size={15} fill="currentColor" /> Stop listening</> : <><Mic size={16} /> Start speaking</>}
            </button>
            <div className="voice-tool-row">
              <button type="button" onClick={props.onReplay} disabled={!props.messages.some((message) => message.role === "assistant")}><Volume2 size={15} /> Replay reply</button>
              <button type="button" onClick={props.onStopSpeaking} disabled={props.state !== "speaking"}><VolumeX size={15} /> Stop audio</button>
            </div>
            <p className="voice-privacy"><ShieldCheck size={13} /> App audio is not stored; browser recognition may use its service.</p>
          </section>

          <section className="session-mode-card">
            <div className="panel-heading"><div><span className="eyebrow">SESSION FOCUS</span><h3>{details.shortLabel}</h3></div><details className="mode-menu"><summary aria-label="Choose session mode"><ChevronDown size={16} /></summary><div>{(Object.keys(modeDetails) as AssistantMode[]).map((mode) => <button type="button" key={mode} onClick={() => props.onModeChange(mode)}>{modeDetails[mode].shortLabel}</button>)}</div></details></div>
            <p>{props.activeMode === "english" ? "Prioritize a natural conversation, then focus on one meaningful correction." : props.activeMode === "interview" ? "One question at a time, with clear feedback and a stronger example." : "A practical, thoughtful assistant for learning and getting things done."}</p>
            <div className="focus-pills"><span>{props.activeMode === "english" ? "Gentle correction" : props.activeMode === "interview" ? "Specific feedback" : "Useful next steps"}</span><span>Voice + text</span></div>
          </section>

          <section className="history-card">
            <div className="panel-heading"><div><span className="eyebrow">PICK UP AGAIN</span><h3>Recent sessions</h3></div><History size={16} className="panel-heading-icon" /></div>
            {props.conversations.length ? (
              <div className="history-mini-list">{props.conversations.slice(0, 4).map((conversation) => <button type="button" key={conversation.id} onClick={() => props.onOpenConversation(conversation.id)}><span className="history-mini-icon"><MessageCircle size={14} /></span><span>{conversation.title}</span><ChevronRight size={14} /></button>)}</div>
            ) : <p className="history-empty-copy">Your saved conversations will show up here.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}

function MessageBubble(props: { message: ChatMessage; onReplay: () => void }) {
  const assistant = props.message.role === "assistant";
  return (
    <article className={`message-row ${assistant ? "assistant-message" : "user-message"}`}>
      {assistant && <div className="message-avatar"><Sparkles size={15} /></div>}
      <div className="message-bubble-wrap">
        <div className="message-meta"><strong>{assistant ? "JARVIS" : "YOU"}</strong>{assistant && <span>AI-generated response</span>}</div>
        <div className="message-bubble">{props.message.content}</div>
        {assistant && <button type="button" className="message-replay" onClick={props.onReplay}><Volume2 size={13} /> Listen again</button>}
      </div>
      {!assistant && <div className="user-message-avatar">Y</div>}
    </article>
  );
}

function TaskAddForm(props: {
  compact?: boolean;
  onCreate: (input: TaskInput) => Promise<boolean>;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueAt, setDueAt] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const succeeded = await props.onCreate({
      title: trimmed,
      priority,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
    });
    if (succeeded) {
      setTitle("");
      setPriority("medium");
      setDueAt("");
    }
  }

  return (
    <form className={`task-add-form${props.compact ? " task-add-compact" : ""}`} onSubmit={(event) => void submit(event)}>
      <div className="task-add-input-wrap"><Plus size={16} /><input aria-label="New task title" placeholder="Add a task you want to move forward…" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={240} /></div>
      {!props.compact && <div className="task-add-controls"><label className="task-field-label">Priority<select aria-label="Task priority" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label className="task-field-label">Due date <span>(your local time)</span><input aria-label="Task due date and time" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label></div>}
      {props.compact && <label className="sr-only">Priority<select aria-label="Task priority" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>}
      <button type="submit" className="task-add-submit" disabled={props.saving || !title.trim()} aria-label="Save task">{props.saving ? <LoaderCircle size={16} className="spin" /> : <Plus size={16} />}{!props.compact && <span>{props.saving ? "Saving" : "Add task"}</span>}</button>
    </form>
  );
}

function TaskRow(props: {
  task: WorkspaceTask;
  compact?: boolean;
  pending?: boolean;
  onStatus: (status: TaskStatus) => void;
}) {
  const done = props.task.status === "completed";
  const dueLabel = dateLabel(props.task.dueAt);
  return (
    <div className={`task-row${done ? " task-done" : ""}${props.compact ? " task-row-compact" : ""}`}>
      <button type="button" className={`task-check${done ? " checked" : ""}`} aria-label={done ? `Reopen ${props.task.title}` : `Advance ${props.task.title}`} disabled={props.pending} onClick={() => props.onStatus(done ? "todo" : nextTaskStatus(props.task.status))}>{props.pending ? <LoaderCircle size={14} className="spin" /> : done ? <Check size={15} /> : props.task.status === "in_progress" ? <span className="task-check-progress" /> : null}</button>
      <div className="task-row-copy"><strong>{props.task.title}</strong>{!props.compact && props.task.description && <span>{props.task.description}</span>}<div className="task-row-meta"><span className={`priority-pill priority-${props.task.priority}`}>{props.task.priority} priority</span>{dueLabel && <span className="due-pill"><Clock3 size={12} />{dueLabel}</span>}</div></div>
      {!props.compact && <label className="task-status-select"><span className="sr-only">Status for {props.task.title}</span><select value={props.task.status} onChange={(event) => props.onStatus(event.target.value as TaskStatus)} disabled={props.pending}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="skipped">Skipped</option></select><ChevronDown size={13} /></label>}
      {props.compact && <span className={`task-status-mini status-mini-${props.task.status}`}>{statusLabel(props.task.status)}</span>}
    </div>
  );
}

function TasksPage(props: {
  tasks: WorkspaceTask[];
  openTasks: WorkspaceTask[];
  completedTasks: WorkspaceTask[];
  onCreateTask: (input: TaskInput) => Promise<boolean>;
  onUpdateTask: (task: WorkspaceTask, status: TaskStatus) => void;
  saving: boolean;
  pendingId: string | null;
  error: string | null;
}) {
  const [filter, setFilter] = useState<"all" | "todo" | "in_progress" | "completed">("all");
  const filtered = props.tasks.filter((task) => filter === "all" || task.status === filter);
  return (
    <div className="tasks-page page-enter">
      <div className="page-heading-row"><div><span className="eyebrow"><span className="eyebrow-dot" /> PERSONAL PRODUCTIVITY</span><h1>Daily tasks</h1><p>Keep the next action clear. Progress changes only when you update a task.</p></div><div className="task-count-chip"><ListChecks size={16} /> {props.openTasks.length} open</div></div>
      <section className="task-create-panel panel"><div className="panel-heading"><div><span className="eyebrow">MAKE IT ACTIONABLE</span><h2>Add a priority</h2></div><Target size={18} className="panel-heading-icon" /></div><p className="panel-description">Start with a small, specific task. You can choose a priority and optional due date.</p>{props.error && <p className="inline-error">{props.error}</p>}<TaskAddForm onCreate={props.onCreateTask} saving={props.saving} /></section>
      <section className="panel task-manager-panel">
        <div className="panel-heading task-manager-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h2>Task list <span className="heading-count">{props.tasks.length}</span></h2></div><div className="filter-tabs" role="group" aria-label="Filter tasks">{(["all", "todo", "in_progress", "completed"] as const).map((item) => <button type="button" className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item === "all" ? "All" : item === "todo" ? "To do" : item === "in_progress" ? "In progress" : "Done"}</button>)}</div></div>
        {filtered.length ? <div className="task-list full-task-list">{filtered.map((task) => <TaskRow key={task.id} task={task} pending={props.pendingId === task.id} onStatus={(status) => props.onUpdateTask(task, status)} />)}</div> : <div className="task-empty-state"><div className="empty-state-icon"><CheckCircle2 size={20} /></div><strong>{props.tasks.length ? "No tasks in this view" : "Your list is ready for a first step"}</strong><span>{props.tasks.length ? "Choose another filter to see your saved tasks." : "Add a clear action above. JARVIS will not create tasks unless you save them."}</span></div>}
      </section>
      <div className="task-page-footnote"><ShieldCheck size={14} /><span>Tasks are saved to this browser workspace. No reminders are scheduled yet.</span></div>
    </div>
  );
}

function ProgressPage(props: {
  tasks: WorkspaceTask[];
  conversations: ConversationSummary[];
  completedTasks: WorkspaceTask[];
  onOpenConversation: (id: string) => void;
  onStart: (mode: AssistantMode) => void;
}) {
  const completedCount = props.completedTasks.length;
  const total = props.tasks.length;
  const ratio = total ? Math.round((completedCount / total) * 100) : 0;
  const englishSessions = props.conversations.filter((item) => item.mode === "english").length;
  const interviewSessions = props.conversations.filter((item) => item.mode === "interview").length;
  return (
    <div className="progress-page page-enter">
      <div className="page-heading-row"><div><span className="eyebrow"><span className="eyebrow-dot" /> YOUR RECORDED ACTIVITY</span><h1>Progress, without the guesswork.</h1><p>A transparent snapshot from the tasks and sessions saved in this workspace.</p></div><div className="measured-badge"><ShieldCheck size={15} /> Measured data only</div></div>
      <div className="progress-summary-grid">
        <StatCard label="TASKS COMPLETED" value={String(completedCount).padStart(2, "0")} footnote={`From ${total} saved tasks`} icon={CheckCircle2} accent="green" />
        <StatCard label="RECENT SESSIONS" value={String(props.conversations.length).padStart(2, "0")} footnote="Latest saved sessions" icon={MessageCircle} accent="cyan" />
        <StatCard label="ENGLISH PRACTICE" value={String(englishSessions).padStart(2, "0")} footnote="In the recent session list" icon={BookOpen} accent="violet" />
        <StatCard label="MOCK INTERVIEWS" value={String(interviewSessions).padStart(2, "0")} footnote="In the recent session list" icon={BriefcaseBusiness} accent="amber" />
      </div>
      <div className="progress-content-grid">
        <section className="panel progress-detail-panel"><div className="panel-heading"><div><span className="eyebrow">TASK MOMENTUM</span><h2>Your current task list</h2></div><Activity size={18} className="panel-heading-icon" /></div><div className="large-progress-row"><div className="progress-ring progress-ring-large" style={{ "--progress": `${ratio}%` } as CSSProperties}><div><strong>{ratio}<small>%</small></strong><span>complete</span></div></div><div><strong>{completedCount} completed out of {total}</strong><p>This is a count of tasks currently saved here, not a weekly productivity score.</p><div className="progress-track"><span style={{ width: `${ratio}%` }} /></div></div></div><div className="honest-note"><ShieldCheck size={15} /><span>Language accuracy and interview scores are not measured yet. Add practice evaluations before using performance trends.</span></div></section>
        <section className="panel next-step-panel"><div className="panel-heading"><div><span className="eyebrow">KEEP YOUR RHYTHM</span><h2>Choose a next step</h2></div><Zap size={17} className="panel-heading-icon" /></div><button type="button" className="progress-action" onClick={() => props.onStart("english")}><span className="quick-icon quick-icon-blue"><BookOpen size={17} /></span><span><strong>Practice spoken English</strong><small>Start a turn-by-turn session</small></span><ArrowRight size={15} /></button><button type="button" className="progress-action" onClick={() => props.onStart("interview")}><span className="quick-icon quick-icon-purple"><BriefcaseBusiness size={17} /></span><span><strong>Answer one interview question</strong><small>Review feedback as you go</small></span><ArrowRight size={15} /></button></section>
      </div>
      <section className="panel progress-history-panel"><div className="panel-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Saved conversations</h2></div><History size={17} className="panel-heading-icon" /></div>{props.conversations.length ? <div className="recent-list">{props.conversations.map((conversation) => <button key={conversation.id} type="button" className="recent-row" onClick={() => props.onOpenConversation(conversation.id)}><span className="recent-icon"><MessageCircle size={16} /></span><span className="recent-copy"><strong>{conversation.title}</strong><small>{modeDetails[conversation.mode]?.shortLabel ?? "TalkMe"}</small></span><ChevronRight size={16} className="recent-chevron" /></button>)}</div> : <div className="task-empty-state"><div className="empty-state-icon"><History size={19} /></div><strong>No saved conversations yet</strong><span>Start a TalkMe session to build your activity history.</span></div>}</section>
    </div>
  );
}

function SettingsPage(props: {
  settings: WorkspaceSettings;
  onChange: (settings: WorkspaceSettings) => void;
  voices: SpeechSynthesisVoice[];
  aiConfigured: boolean;
  ready: boolean;
  historyCount: number;
  historyMessage: string | null;
  onClearHistory: () => void;
}) {
  return (
    <div className="settings-page page-enter">
      <div className="page-heading-row"><div><span className="eyebrow"><span className="eyebrow-dot" /> MAKE IT YOURS</span><h1>Preferences</h1><p>Choose how JARVIS speaks with you. These preferences are stored in this browser.</p></div><div className="settings-saved"><CheckCircle2 size={15} /> Saved on this device</div></div>
      <div className="settings-grid">
        <section className="panel settings-panel"><div className="panel-heading"><div><span className="eyebrow">CONVERSATION STYLE</span><h2>Assistant personality</h2></div><Sparkles size={17} className="panel-heading-icon" /></div><p className="panel-description">Tone preferences shape phrasing, not security rules or factual standards.</p><div className="settings-option-grid">{([
          ["professional", "Professional mentor", "Calm, clear, constructive"],
          ["friendly", "Friendly coach", "Warm, encouraging, natural"],
          ["strict", "Strict interviewer", "Direct, specific, respectful"],
          ["concise", "Concise assistant", "Short answers, clear next step"],
        ] as const).map(([value, label, description]) => <button type="button" key={value} className={`personality-option${props.settings.personality === value ? " selected" : ""}`} onClick={() => props.onChange({ ...props.settings, personality: value })}><span className="option-check">{props.settings.personality === value && <Check size={13} />}</span><strong>{label}</strong><small>{description}</small></button>)}</div><label className="setting-control"><span><strong>Response length</strong><small>How much detail should a typical reply include?</small></span><select value={props.settings.responseLength} onChange={(event) => props.onChange({ ...props.settings, responseLength: event.target.value as ResponseLength })}><option value="short">Concise</option><option value="balanced">Balanced</option><option value="detailed">Detailed</option></select></label></section>

        <section className="panel settings-panel voice-settings-panel"><div className="panel-heading"><div><span className="eyebrow">VOICE PLAYBACK</span><h2>Speech settings</h2></div><Volume2 size={17} className="panel-heading-icon" /></div><p className="panel-description">Speech is generated by your browser, not by the Grok text API.</p><label className="setting-control setting-control-stacked"><span><strong>Voice</strong><small>Available voices depend on your device and browser.</small></span><select value={props.settings.voiceURI} onChange={(event) => props.onChange({ ...props.settings, voiceURI: event.target.value })}><option value="">System default</option>{props.voices.map((voice) => <option value={voice.voiceURI} key={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</select></label><label className="setting-control rate-control"><span><strong>Speech rate</strong><small>{props.settings.speechRate.toFixed(2)}×</small></span><input aria-label="Speech rate" type="range" min="0.75" max="1.5" step="0.05" value={props.settings.speechRate} onChange={(event) => props.onChange({ ...props.settings, speechRate: Number(event.target.value) })} /></label><ToggleSetting title="Speak assistant replies" detail="Read new replies aloud when your browser supports it." checked={props.settings.autoSpeak} onChange={(checked) => props.onChange({ ...props.settings, autoSpeak: checked })} /><ToggleSetting title="Send voice transcripts automatically" detail="When enabled, a finished microphone turn is sent without another click." checked={props.settings.autoSendVoice} onChange={(checked) => props.onChange({ ...props.settings, autoSendVoice: checked })} /></section>

        <section className="panel settings-panel privacy-settings-panel"><div className="panel-heading"><div><span className="eyebrow">PRIVACY + DATA</span><h2>Your workspace data</h2></div><ShieldCheck size={17} className="panel-heading-icon" /></div><div className="privacy-callout"><ShieldCheck size={17} /><p>This app does not store raw microphone audio. Browser speech recognition may process audio through its own service. Conversation text and tasks are saved in the workspace database. This anonymous browser workspace is not an account login.</p></div><div className="privacy-stat-row"><span>Recent conversations</span><strong>{props.ready ? props.historyCount : "—"}</strong></div><div className="privacy-stat-row"><span>AI provider</span><strong className={props.aiConfigured ? "provider-connected" : "provider-missing"}>{props.aiConfigured ? "Configured" : "Needs XAI_API_KEY"}</strong></div>{props.historyMessage && <p className="inline-feedback">{props.historyMessage}</p>}<button type="button" className="button-danger-quiet" onClick={props.onClearHistory} disabled={!props.historyCount}><TrashIcon /> Delete all conversation history</button><p className="settings-footnote">Task deletion and data export controls are not included in this MVP.</p></section>

        <section className="panel settings-panel provider-panel"><div className="panel-heading"><div><span className="eyebrow">AI PROVIDER</span><h2>Grok by xAI</h2></div><div className={`provider-status-dot${props.aiConfigured ? " configured" : ""}`} /></div><p className="panel-description">AI calls are sent from the server to xAI. The API key is never included in browser code.</p><div className="provider-setup-steps"><span><i>1</i> Add <code>XAI_API_KEY</code> to the server environment.</span><span><i>2</i> Optionally set <code>XAI_MODEL</code> to choose a supported model.</span><span><i>3</i> Restart the app to enable AI replies.</span></div><p className="provider-model-note">Text replies use xAI’s Responses API. Speech recognition and speech playback use browser-provided APIs.</p></section>
      </div>
    </div>
  );
}

function ToggleSetting(props: { title: string; detail: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="toggle-setting"><span><strong>{props.title}</strong><small>{props.detail}</small></span><input type="checkbox" checked={props.checked} onChange={(event) => props.onChange(event.target.checked)} /><span className="toggle-visual" aria-hidden="true" /></label>;
}

function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></svg>;
}
