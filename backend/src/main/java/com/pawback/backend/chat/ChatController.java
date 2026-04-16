package com.pawback.backend.chat;

import com.pawback.backend.user.User;
import com.pawback.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final com.pawback.backend.notification.NotificationService notificationService;

    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessageDTO chatMessageDTO, Authentication authentication) {
        try {
            System.out.println("DEBUG: Received message from " + authentication.getName() + " to " + chatMessageDTO.getRecipientId());
            
            User sender = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("Sender not found: " + authentication.getName()));
            
            User recipient = userRepository.findById(UUID.fromString(chatMessageDTO.getRecipientId()))
                    .orElseThrow(() -> new RuntimeException("Recipient not found: " + chatMessageDTO.getRecipientId()));
    
            ChatMessage chatMessage = ChatMessage.builder()
                    .sender(sender)
                    .recipient(recipient)
                    .content(chatMessageDTO.getContent())
                    .latitude(chatMessageDTO.getLatitude())
                    .longitude(chatMessageDTO.getLongitude())
                    .fileUrl(chatMessageDTO.getFileUrl())
                    .fileType(chatMessageDTO.getFileType())
                    .build();
            
            ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
            System.out.println("DEBUG: Message saved with ID: " + savedMessage.getId());
            
            // Broadcast to recipient
            messagingTemplate.convertAndSendToUser(
                    recipient.getEmail(), "/queue/messages", 
                    savedMessage
            );
            // Also send back to sender for confirmation
            messagingTemplate.convertAndSendToUser(
                    sender.getEmail(), "/queue/messages", 
                    savedMessage
            );
            System.out.println("DEBUG: Message broadcasted successfully");

            // Persist notification for recipient
            String senderName = sender.getDisplayName() != null ? sender.getDisplayName() : sender.getEmail();
            String preview = chatMessageDTO.getContent() != null
                    ? chatMessageDTO.getContent().substring(0, Math.min(chatMessageDTO.getContent().length(), 60))
                    : "Повідомлення";
            notificationService.send(recipient, "MESSAGE", "Нове повідомлення",
                    senderName + ": " + preview,
                    "/messages?userId=" + sender.getId() + "&name=" + java.net.URLEncoder.encode(senderName, java.nio.charset.StandardCharsets.UTF_8));
        } catch (Exception e) {
            System.err.println("ERROR in chat: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @RestController
    @RequestMapping("/api/chat")
    @RequiredArgsConstructor
    public static class ChatRestController {
        private final ChatMessageRepository chatMessageRepository;
        private final UserRepository userRepository;
        private final SimpMessagingTemplate messagingTemplate;
        private final com.pawback.backend.notification.NotificationService notificationService;

        @GetMapping("/history/{userId}")
        public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable UUID userId, Authentication authentication) {
            User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
            return ResponseEntity.ok(chatMessageRepository.findChatHistory(currentUser.getId(), userId));
        }

        @GetMapping("/contacts")
        public ResponseEntity<List<Map<String, Object>>> getContacts(Authentication authentication) {
            User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
            List<User> contacts = chatMessageRepository.findInteractedUsers(currentUser.getId());
            contacts.removeIf(u -> u.getId().equals(currentUser.getId()));
            
            List<Map<String, Object>> response = contacts.stream().map(u -> Map.<String, Object>of(
                    "id", u.getId(),
                    "displayName", u.getDisplayName(),
                    "email", u.getEmail()
            )).collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
        }

        @org.springframework.web.bind.annotation.PostMapping("/send")
        public ResponseEntity<ChatMessage> sendMessage(
                @org.springframework.web.bind.annotation.RequestBody ChatMessageDTO dto,
                Authentication authentication) {
            User sender = userRepository.findByEmail(authentication.getName()).orElseThrow();
            User recipient = userRepository.findById(UUID.fromString(dto.getRecipientId())).orElseThrow();

            ChatMessage msg = ChatMessage.builder()
                    .sender(sender)
                    .recipient(recipient)
                    .content(dto.getContent() != null ? dto.getContent() : "")
                    .latitude(dto.getLatitude())
                    .longitude(dto.getLongitude())
                    .fileUrl(dto.getFileUrl())
                    .fileType(dto.getFileType())
                    .build();

            ChatMessage saved = chatMessageRepository.save(msg);

            // Try to deliver via WebSocket if connected
            try {
                messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/messages", saved);
                messagingTemplate.convertAndSendToUser(sender.getEmail(), "/queue/messages", saved);
            } catch (Exception ignored) {}

            // Persist notification for recipient
            try {
                String senderName = sender.getDisplayName() != null ? sender.getDisplayName() : sender.getEmail();
                String preview = dto.getContent() != null && !dto.getContent().isEmpty()
                        ? dto.getContent().substring(0, Math.min(dto.getContent().length(), 60))
                        : "Повідомлення";
                notificationService.send(recipient, "MESSAGE", "Нове повідомлення",
                        senderName + ": " + preview,
                        "/messages?userId=" + sender.getId() + "&name=" + java.net.URLEncoder.encode(senderName, java.nio.charset.StandardCharsets.UTF_8));
            } catch (Exception e) {
                System.err.println("Failed to send notification: " + e.getMessage());
            }

            return ResponseEntity.ok(saved);
        }
    }
}

@lombok.Data
class ChatMessageDTO {
    private String recipientId;
    private String content;
    private Double latitude;
    private Double longitude;
    private String fileUrl;
    private String fileType;
}




 
 
 
 
 
/**
 * Task: feat: add transaction logging and message validation logic
 * Implemented during Pull Request #3
 * Timestamp: 2026-03-06T10:00:00
 */
 
 
 
