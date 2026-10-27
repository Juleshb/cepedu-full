const prisma = require('../config/db');

const ROOM_LOCK = 842170;
const BODY_LIMIT = 2000;
const PAGE_SIZE = 80;

function userIdFrom(req) {
  const id = Number(req.user?.userId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function cleanBody(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/\r\n/g, '\n').replace(/[^\S\n]+/g, ' ').trim().slice(0, BODY_LIMIT);
}

function presentMessage(message, userId) {
  return {
    message_id: message.message_id,
    body: message.body,
    created_at: message.created_at,
    sender_id: message.sender_id,
    sender_name: message.sender?.name || 'Member',
    mine: message.sender_id === userId,
  };
}

function presentConversation(conversation, userId, unread = 0) {
  const others = (conversation.participants || [])
    .filter((entry) => entry.user_id !== userId)
    .map((entry) => ({
      user_id: entry.user?.user_id ?? entry.user_id,
      name: entry.user?.name || 'Member',
    }));
  const last = conversation.messages?.[0];
  const title =
    conversation.kind === 'room'
      ? conversation.title || 'Everyone'
      : others[0]?.name || 'Member';

  return {
    conversation_id: conversation.conversation_id,
    kind: conversation.kind,
    title,
    peer: conversation.kind === 'direct' ? others[0] || null : null,
    updated_at: conversation.updated_at,
    unread,
    last_message: last
      ? {
          body: last.body,
          created_at: last.created_at,
          sender_id: last.sender_id,
          sender_name: last.sender?.name || 'Member',
          mine: last.sender_id === userId,
        }
      : null,
  };
}

async function ensureRoom(userId) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ROOM_LOCK})`;
    let room = await tx.conversation.findFirst({ where: { kind: 'room' } });
    if (!room) {
      room = await tx.conversation.create({
        data: { kind: 'room', title: 'Everyone' },
      });
    }
    await tx.conversationParticipant.upsert({
      where: {
        conversation_id_user_id: {
          conversation_id: room.conversation_id,
          user_id: userId,
        },
      },
      update: {},
      create: { conversation_id: room.conversation_id, user_id: userId },
    });
    return room;
  });
}

async function loadConversation(conversationId) {
  return prisma.conversation.findUnique({
    where: { conversation_id: conversationId },
    include: {
      participants: {
        include: { user: { select: { user_id: true, name: true } } },
      },
      messages: {
        orderBy: { message_id: 'desc' },
        take: 1,
        include: { sender: { select: { user_id: true, name: true } } },
      },
    },
  });
}

async function unreadCount(conversationId, userId, lastReadAt) {
  return prisma.message.count({
    where: {
      conversation_id: conversationId,
      sender_id: { not: userId },
      ...(lastReadAt ? { created_at: { gt: lastReadAt } } : {}),
    },
  });
}

async function requireParticipant(conversationId, userId) {
  const membership = await prisma.conversationParticipant.findUnique({
    where: {
      conversation_id_user_id: {
        conversation_id: conversationId,
        user_id: userId,
      },
    },
  });
  return membership;
}

exports.searchMembers = async (req, res) => {
  const userId = userIdFrom(req);
  if (!userId) return res.status(401).json({ message: 'Not authorized' });

  const q = String(req.query.q || '').trim().slice(0, 80);

  try {
    const members = await prisma.user.findMany({
      where: {
        user_id: { not: userId },
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      },
      select: { user_id: true, name: true },
      orderBy: { name: 'asc' },
      take: 15,
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Could not search members.' });
  }
};

exports.listConversations = async (req, res) => {
  const userId = userIdFrom(req);
  if (!userId) return res.status(401).json({ message: 'Not authorized' });

  try {
    await ensureRoom(userId);
    const memberships = await prisma.conversationParticipant.findMany({
      where: { user_id: userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: { user: { select: { user_id: true, name: true } } },
            },
            messages: {
              orderBy: { message_id: 'desc' },
              take: 1,
              include: { sender: { select: { user_id: true, name: true } } },
            },
          },
        },
      },
    });

    const conversations = await Promise.all(
      memberships.map(async (membership) => {
        const unread = await unreadCount(
          membership.conversation_id,
          userId,
          membership.last_read_at
        );
        return presentConversation(membership.conversation, userId, unread);
      })
    );

    conversations.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'room' ? -1 : 1;
      return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
    });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Could not load conversations.' });
  }
};

exports.openDirect = async (req, res) => {
  const userId = userIdFrom(req);
  const otherId = parseId(req.body?.user_id);
  if (!userId) return res.status(401).json({ message: 'Not authorized' });
  if (!otherId) return res.status(400).json({ message: 'Choose a member.' });
  if (otherId === userId) {
    return res.status(400).json({ message: 'You cannot message yourself.' });
  }

  try {
    const other = await prisma.user.findUnique({
      where: { user_id: otherId },
      select: { user_id: true, name: true },
    });
    if (!other) return res.status(404).json({ message: 'Member not found.' });

    const conversationId = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${Math.min(userId, otherId)}, ${Math.max(userId, otherId)})`;
      const existing = await tx.conversation.findFirst({
        where: {
          kind: 'direct',
          AND: [
            { participants: { some: { user_id: userId } } },
            { participants: { some: { user_id: otherId } } },
          ],
        },
        include: { participants: { select: { user_id: true } } },
      });
      if (existing?.participants.length === 2) return existing.conversation_id;
      const created = await tx.conversation.create({
        data: {
          kind: 'direct',
          participants: {
            create: [{ user_id: userId }, { user_id: otherId }],
          },
        },
      });
      return created.conversation_id;
    });

    const conversation = await loadConversation(conversationId);
    res.json(presentConversation(conversation, userId, 0));
  } catch (error) {
    res.status(500).json({ message: 'Could not open the conversation.' });
  }
};

exports.getConversation = async (req, res) => {
  const userId = userIdFrom(req);
  const conversationId = parseId(req.params.id);
  if (!userId) return res.status(401).json({ message: 'Not authorized' });
  if (!conversationId) return res.status(400).json({ message: 'Conversation not found.' });

  try {
    const membership = await requireParticipant(conversationId, userId);
    if (!membership) return res.status(404).json({ message: 'Conversation not found.' });

    const before = parseId(req.query.before);
    const messages = await prisma.message.findMany({
      where: {
        conversation_id: conversationId,
        ...(before ? { message_id: { lt: before } } : {}),
      },
      orderBy: { message_id: 'desc' },
      take: PAGE_SIZE,
      include: { sender: { select: { user_id: true, name: true } } },
    });

    await prisma.conversationParticipant.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
      data: { last_read_at: new Date() },
    });

    const conversation = await loadConversation(conversationId);
    res.json({
      conversation: presentConversation(conversation, userId, 0),
      messages: messages.reverse().map((message) => presentMessage(message, userId)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load messages.' });
  }
};

exports.sendMessage = async (req, res) => {
  const userId = userIdFrom(req);
  const conversationId = parseId(req.params.id);
  const body = cleanBody(req.body?.body);
  if (!userId) return res.status(401).json({ message: 'Not authorized' });
  if (!conversationId) return res.status(400).json({ message: 'Conversation not found.' });
  if (!body) return res.status(400).json({ message: 'Write a message first.' });

  try {
    const membership = await requireParticipant(conversationId, userId);
    if (!membership) return res.status(404).json({ message: 'Conversation not found.' });

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversation_id: conversationId, sender_id: userId, body },
        include: { sender: { select: { user_id: true, name: true } } },
      });
      await tx.conversation.update({
        where: { conversation_id: conversationId },
        data: { updated_at: new Date() },
      });
      await tx.conversationParticipant.update({
        where: {
          conversation_id_user_id: {
            conversation_id: conversationId,
            user_id: userId,
          },
        },
        data: { last_read_at: new Date() },
      });
      return created;
    });

    res.status(201).json(presentMessage(message, userId));
  } catch (error) {
    res.status(500).json({ message: 'Could not send the message.' });
  }
};
