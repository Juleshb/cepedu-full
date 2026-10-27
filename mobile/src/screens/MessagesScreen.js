import { useCallback, useEffect, useState } from "react";
import { RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import { Screen } from "../components/layout";
import { EmptyState, ListRow, Notice } from "../components/ui";
import { colors, fonts } from "../theme";

export default function MessagesScreen({ navigation }) {
  const { session } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session?.token) return;
    try {
      const data = await api.get("/messages/conversations", session.token);
      setConversations(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load conversations.");
    }
  }, [session?.token]);

  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(load, 8000);
      return () => clearInterval(timer);
    }, [load])
  );

  useEffect(() => {
    const q = query.trim();
    if (!session?.token) return undefined;
    const timer = setTimeout(async () => {
      try {
        const data = await api.get(
          `/messages/members?q=${encodeURIComponent(q)}`,
          session.token
        );
        setPeople(Array.isArray(data) ? data : []);
      } catch {
        setPeople([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, session?.token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openDirect = async (person) => {
    setError("");
    try {
      const conversation = await api.post(
        "/messages/conversations",
        { user_id: person.user_id },
        session.token
      );
      setQuery("");
      navigation.navigate("Chat", {
        conversationId: conversation.conversation_id,
        title: conversation.title,
      });
    } catch (err) {
      setError(err.message || "Could not open the conversation.");
    }
  };

  const openConversation = (item) => {
    navigation.navigate("Chat", {
      conversationId: item.conversation_id,
      title: item.title,
    });
  };

  return (
    <Screen
      tabPad
      title="Messages"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />
      }
    >
      <Text style={styles.lead}>Talk with members, or join Everyone.</Text>
      <Notice message={error} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Message a member"
        placeholderTextColor="#8696A0"
        style={styles.search}
      />
      {query.trim()
        ? people.map((person) => (
            <ListRow
              key={person.user_id}
              icon="person-outline"
              title={person.name}
              meta="Start a private conversation"
              onPress={() => openDirect(person)}
            />
          ))
        : null}
      {query.trim() && people.length === 0 ? (
        <EmptyState title="No members found" body="Try another name." />
      ) : null}

      <View style={{ height: query.trim() ? 8 : 0 }} />
      {conversations.length === 0 && !query.trim() ? (
        <EmptyState title="No conversations yet" body="Search for a member to start one." />
      ) : (
        conversations.map((item) => (
          <ListRow
            key={item.conversation_id}
            icon={item.kind === "room" ? "people-outline" : "chatbubble-outline"}
            title={item.title}
            meta={item.last_message?.body || "No messages yet"}
            value={item.unread ? String(item.unread) : undefined}
            onPress={() => openConversation(item)}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.mute,
    marginBottom: 14,
  },
  search: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.field,
    paddingHorizontal: 14,
    marginBottom: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
});
