package com.pawback.backend.user;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(name = "password_hash")
    private String passwordHash;
    
    @Column(name = "display_name")
    private String displayName;
    
    @Column(unique = true)
    private String username;
    
    @Column(name = "avatar_url")
    private String avatarUrl;
    
    private String bio;
    private String city;
    
    @Column(name = "phone_number")
    private String phoneNumber;
    
    @Column(name = "is_verified_diia")
    private Boolean isVerifiedDiia;
    
    @Column(name = "diia_verified_at")
    private LocalDateTime diiaVerifiedAt;
    
    private BigDecimal rating;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;
    
    @Column(name = "oauth_provider")
    private String oauthProvider;
    
    @Column(name = "oauth_id")
    private String oauthId;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
 
 
 
 
