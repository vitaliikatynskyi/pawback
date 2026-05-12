package com.pawback.backend.chat;

import com.pawback.backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private Double latitude;
    private Double longitude;
    private String fileUrl;
    private String fileType; // "IMAGE", "FILE", "LOCATION"

    private LocalDateTime timestamp;

    @Column(name = "is_edited")
    @Builder.Default
    private Boolean isEdited = false;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
