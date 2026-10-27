import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import { Screen } from "../components/layout";
import { Notice } from "../components/ui";
import { colors, fonts } from "../theme";

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

export default function ChatScreen({ navigation, route }) {
  const { session } = useAuth();
  const conversationId = route.params?.conversationId;
  const [title, setTitle] = useState(route.params?.title || "Messages");
  const [kind, setKind] = useState("direct");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);

  const load = useCallback(async () => {
    if (!session?.token || !conversationId) return;
    try {
      const data = await api.get(`/messages/conversations/${conversationId}`, session.token);
      setTitle(data.conversation?.title || "Messages");
      setKind(data.conversation?.kind || "direct");
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load messages.");
    } finally {
      setLoading(false);
    }
  }, [session?.token, conversationId]);

  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(load, 4000);
      return () => clearInterval(timer);
    }, [load])
  );

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      const message = await api.post(
        `/messages/conversations/${conversationId}`,
        { body },
        session.token
      );
      setMessages((current) => [...current, message]);
      setDraft("");
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (err) {
      setError(err.message || "Could not send the message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen title={title} onBack={() => navigation.goBack()} scroll={false} keyboard>
      <Text style={styles.subtitle}>{kind === "room" ? "All members" : "Private"}</Text>
      <Notice message={error} />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          ref={listRef}
          style={styles.list}
          data={messages}
          keyExtractor={(item) => String(item.message_id)}
          contentContainerStyle={messages.length === 0 ? styles.emptyList : styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={styles.empty}>Start the conversation.</Text>}
          renderItem={({ item }) => (
            <View style={[styles.bubbleRow, item.mine ? styles.mineRow : styles.theirRow]}>
              <View style={[styles.bubble, item.mine ? styles.mine : styles.theirs]}>
                {!item.mine && kind === "room" ? (
                  <Text style={styles.sender}>{item.sender_name}</Text>
                ) : null}
                <Text style={[styles.body, item.mine && styles.mineText]}>{item.body}</Text>
                <Text style={[styles.time, item.mine && styles.mineTime]}>{formatWhen(item.created_at)}</Text>
              </View>
            </View>
          )}
        />
      )}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message"
            placeholderTextColor="#8696A0"
            multiline
            style={styles.input}
          />
          <Pressable
            onPress={send}
            disabled={sending || !draft.trim()}
            style={[styles.send, (!draft.trim() || sending) && styles.sendDisabled]}
            accessibilityLabel="Send message"
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.mute,
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 12,
    gap: 8,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  empty: {
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.mute,
  },
  bubbleRow: {
    flexDirection: "row",
  },
  mineRow: {
    justifyContent: "flex-end",
  },
  theirRow: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  theirs: {
    backgroundColor: colors.panel,
    borderBottomLeftRadius: 6,
  },
  sender: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.primary,
    marginBottom: 2,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
  },
  mineText: {
    color: colors.white,
  },
  time: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.mute,
  },
  mineTime: {
    color: "rgba(255,255,255,0.75)",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: 16,
    backgroundColor: colors.field,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.45,
  },
});
