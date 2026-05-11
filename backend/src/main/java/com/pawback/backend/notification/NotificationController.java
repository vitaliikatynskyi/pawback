package com.pawback.backend.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.pawback.backend.user.UserRepository;
import com.pawback.backend.user.User;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getNotifications(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        List<Map<String, Object>> response = notifications.stream().map(n -> Map.<String, Object>of(
                "id", n.getId(),
                "type", n.getType(),
                "title", n.getTitle(),
                "body", n.getBody(),
                "link", n.getLink() != null ? n.getLink() : "",
                "read", n.isRead(),
                "time", formatTime(n.getCreatedAt())
        )).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        long count = notificationRepository.countByUserIdAndReadFalse(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        notificationService.markAllRead(user.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markOneRead(@PathVariable Long id, Authentication auth) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUser().getEmail().equals(auth.getName())) {
                notificationService.markOneRead(id);
            }
        });
        return ResponseEntity.ok().build();
    }

    private String formatTime(LocalDateTime time) {
        if (time == null) return "";
        Duration d = Duration.between(time, LocalDateTime.now());
        if (d.toMinutes() < 1) return "щойно";
        if (d.toMinutes() < 60) return d.toMinutes() + " хв";
        if (d.toHours() < 24) return d.toHours() + " год";
        return d.toDays() + " дн";
    }
}
