export const updateConversationAfterCreateMessage = (conversation, message, senderId) => {
  // Đảm bảo unreadCounts luôn là Map
  if (!conversation.unreadCounts || !(conversation.unreadCounts instanceof Map)) {
    // eslint-disable-next-line no-param-reassign
    conversation.unreadCounts = new Map();
  }

  // eslint-disable-next-line no-param-reassign
  conversation.lastMessageAt = message.createdAt;
  // eslint-disable-next-line no-param-reassign
  conversation.lastMessage = {
    _id: message._id,
    content: message.content,
    senderId,
    createdAt: message.createdAt,
  };

  // Tăng số unread của người nhận
  conversation.participants.forEach((p) => {
    const uid = p.userId.toString();
    const prev = conversation.unreadCounts.get(uid) || 0;
    conversation.unreadCounts.set(uid, uid === senderId.toString() ? 0 : prev + 1);
  });
};

export const emitNewMessage = (io, conversation, message) => {
  const roomId = conversation._id.toString();

  const unreadObject = Object.fromEntries(
    conversation.unreadCounts instanceof Map ? conversation.unreadCounts : conversation.unreadCounts.entries(),
  );

  io.to(roomId).emit('new-message', {
    message: {
      _id: message._id,
      conversationId: message.conversationId.toString(),
      content: message.content,
      senderId: message.senderId.toString(),
      createdAt: message.createdAt,
    },
    conversation: {
      _id: roomId,
      type: conversation.type,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      participants: conversation.participants,
    },
    unreadCounts: unreadObject,
  });
};
