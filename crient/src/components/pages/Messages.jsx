import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import { AdminShell, UserShell } from "../layout/AppShell";

function formatWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function Messages({ audience = "user" }) {
  const Shell = audience === "admin" ? AdminShell : UserShell;
  const token = localStorage.getItem("token");
  const api = useMemo(
    () =>
      axios.create({
        baseURL: "http://localhost:4000/api",
        headers: { Authorization: `Bearer ${token}` },
      }),
    [token]
  );

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const response = await api.get("/messages/conversations");
      setConversations(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load conversations.");
    }
  }, [api]);

  const loadThread = useCallback(
    async (id) => {
      if (!id) return;
      try {
        const response = await api.get(`/messages/conversations/${id}`);
        setThread(response.data.conversation);
        setMessages(response.data.messages || []);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Could not load messages.");
      }
    },
    [api]
  );

  useEffect(() => {
    loadConversations();
    const timer = setInterval(loadConversations, 8000);
    return () => clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return undefined;
    loadThread(selectedId);
    const timer = setInterval(() => loadThread(selectedId), 4000);
    return () => clearInterval(timer);
  }, [selectedId, loadThread]);

  useEffect(() => {
    const node = scroller.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const q = query.trim();
    const timer = setTimeout(async () => {
      try {
        const response = await api.get("/messages/members", { params: { q } });
        setPeople(response.data || []);
      } catch {
        setPeople([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, api]);

  const openDirect = async (userId) => {
    setError("");
    try {
      const response = await api.post("/messages/conversations", { user_id: userId });
      setSelectedId(response.data.conversation_id);
      setQuery("");
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || "Could not open the conversation.");
    }
  };

  const send = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await api.post(`/messages/conversations/${selectedId}`, { body });
      setMessages((current) => [...current, response.data]);
      setDraft("");
      loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || "Could not send the message.");
    } finally {
      setSending(false);
    }
  };

  const selected = conversations.find((item) => item.conversation_id === selectedId) || thread;

  return (
    <Shell title="Messages">
      <div className="mb-4">
        <h2 className="display-md text-stone-ink">Communication center</h2>
        <p className="mt-1 text-sm text-stone-mute">
          Talk with every member in Everyone, or open a private conversation.
        </p>
      </div>

      {error ? (
        <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="grid h-[calc(100dvh-13.5rem)] min-h-[32rem] overflow-hidden rounded-[1.25rem] border border-stone-line bg-stone-panel md:grid-cols-[18rem_minmax(0,1fr)]">
        <div className={`${selectedId ? "hidden md:flex" : "flex"} min-h-0 flex-col border-stone-line md:border-r`}>
          <div className="border-b border-stone-line p-3">
            <label className="sr-only" htmlFor="member-search">
              Message a member
            </label>
            <input
              id="member-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Message a member"
              className="w-full rounded-full border border-stone-line bg-stone-page px-4 py-2.5 text-sm text-stone-ink outline-none focus:border-primary"
            />
            {query.trim() ? (
              <ul className="mt-2 max-h-40 overflow-y-auto">
                {people.length === 0 ? (
                  <li className="px-2 py-2 text-sm text-stone-mute">No members found.</li>
                ) : (
                  people.map((person) => (
                    <li key={person.user_id}>
                      <button
                        type="button"
                        onClick={() => openDirect(person.user_id)}
                        className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm text-stone-ink hover:bg-primary-muted"
                      >
                        <Icon icon="solar:user-rounded-linear" width="16" height="16" />
                        {person.name}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {conversations.map((item) => {
              const active = item.conversation_id === selectedId;
              return (
                <li key={item.conversation_id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.conversation_id)}
                    className={`mb-1 flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left ${
                      active ? "bg-primary-muted" : "hover:bg-stone-page"
                    }`}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon
                        icon={item.kind === "room" ? "solar:users-group-rounded-linear" : "solar:user-rounded-linear"}
                        width="18"
                        height="18"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-stone-ink">{item.title}</span>
                        {item.unread > 0 ? (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-white">
                            {item.unread}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-stone-mute">
                        {item.last_message?.body || "No messages yet"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className={`${selectedId ? "flex" : "hidden md:flex"} min-h-0 flex-col`}>
          {selected ? (
            <>
              <div className="flex items-center gap-2 border-b border-stone-line px-4 py-3">
                <button
                  type="button"
                  className="rounded-full p-1 text-primary md:hidden"
                  onClick={() => setSelectedId(null)}
                  aria-label="Back to conversations"
                >
                  <Icon icon="solar:arrow-left-linear" width="20" height="20" />
                </button>
                <div>
                  <p className="text-sm font-medium text-stone-ink">{selected.title}</p>
                  <p className="text-xs text-stone-mute">
                    {selected.kind === "room" ? "All members" : "Private"}
                  </p>
                </div>
              </div>
              <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-stone-page/60 px-4 py-4">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-stone-mute">Start the conversation.</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.message_id}
                      className={`flex ${message.mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          message.mine
                            ? "bg-primary text-white"
                            : "border border-stone-line bg-stone-panel text-stone-ink"
                        }`}
                      >
                        {!message.mine ? (
                          <p className={`mb-0.5 text-xs ${message.mine ? "text-white/80" : "text-primary"}`}>
                            {message.sender_name}
                          </p>
                        ) : null}
                        <p className="whitespace-pre-wrap break-words">{message.body}</p>
                        <p className={`mt-1 text-[11px] ${message.mine ? "text-white/70" : "text-stone-mute"}`}>
                          {formatWhen(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={send} className="flex items-end gap-2 border-t border-stone-line p-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      send(event);
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder="Write a message"
                  className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-stone-line bg-stone-page px-4 py-2.5 text-sm text-stone-ink outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm text-white disabled:opacity-50"
                >
                  <Icon icon="solar:plain-bold" width="16" height="16" />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-stone-mute">
              Choose a conversation, or search for a member to message.
            </div>
          )}
        </div>
      </section>
    </Shell>
  );
}

export default Messages;
