package com.pawback.backend.listing;

import com.pawback.backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "listings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Listing {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;
    
    @Column(nullable = false)
    private String type;
    
    @Column(nullable = false)
    private String status;
    
    @Column(name = "pet_type", nullable = false)
    private String petType;
    
    @Column(name = "pet_name")
    private String petName;
    
    private String breed;
    private String color;
    
    @Column(name = "distinctive_marks")
    private String distinctiveMarks;
    
    private String description;
    
    @Column(name = "event_date")
    private LocalDateTime eventDate;
    
    @Column(columnDefinition = "geometry(Point,4326)")
    private Point location;
    
    private String city;
    private String district;
    
    @Column(name = "address_text")
    private String addressText;
    
    @Column(name = "reward_amount")
    private BigDecimal rewardAmount;
    
    @Column(name = "reward_currency")
    private String rewardCurrency;
    
    @Column(name = "views_count")
    private Integer viewsCount;
    
    @Column(name = "contacts_count")
    private Integer contactsCount;
    
    @Column(name = "shares_count")
    private Integer sharesCount;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    @ElementCollection
    @CollectionTable(name = "listing_images", joinColumns = @JoinColumn(name = "listing_id"))
    @Column(name = "image_url")
    private List<String> imageUrls;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (viewsCount == null) viewsCount = 0;
        if (contactsCount == null) contactsCount = 0;
        if (sharesCount == null) sharesCount = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
/**
 * Task: refactor: add validation constraints to pet listing entity
 * Implemented during Pull Request #23
 * Timestamp: 2026-04-05T11:00:00
 */
