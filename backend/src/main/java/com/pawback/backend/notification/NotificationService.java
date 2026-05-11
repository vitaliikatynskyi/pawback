package com.pawback.backend.notification;

import com.pawback.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    public void send(User recipient, String type, String title, String body, String link) {
        Notification notification = Notification.builder()
                .user(recipient)
                .type(type)
                .title(title)
                .body(body)
                .link(link)
                .build();
        Notification saved = notificationRepository.save(notification);

        // Broadcast real-time to user
        try {
            messagingTemplate.convertAndSendToUser(
                recipient.getEmail(), 
                "/queue/notifications", 
                saved
            );
        } catch (Exception ignored) {}
    }

    @Transactional
    public void markAllRead(java.util.UUID userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    @Transactional
    public void markOneRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
}
