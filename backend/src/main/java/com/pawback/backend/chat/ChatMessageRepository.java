package com.pawback.backend.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    @Query("SELECT m FROM ChatMessage m WHERE (m.sender.id = :user1 AND m.recipient.id = :user2) OR (m.sender.id = :user2 AND m.recipient.id = :user1) ORDER BY m.timestamp ASC")
    List<ChatMessage> findChatHistory(UUID user1, UUID user2);
    
    @Query("SELECT DISTINCT u FROM User u WHERE u.id IN (SELECT m.sender.id FROM ChatMessage m WHERE m.recipient.id = :userId) OR u.id IN (SELECT m.recipient.id FROM ChatMessage m WHERE m.sender.id = :userId)")
    List<com.pawback.backend.user.User> findInteractedUsers(UUID userId);
}
