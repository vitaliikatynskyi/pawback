package com.pawback.backend.listing.dto;

import com.pawback.backend.user.User;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record UserDto(
        UUID id,
        String displayName,
        String username,
        String avatarUrl,
        String city,
        String phoneNumber,
        String email,
        Boolean isVerifiedDiia,
        BigDecimal rating,
        LocalDateTime createdAt
) {
    public static UserDto from(User user) {
        return new UserDto(
                user.getId(),
                user.getDisplayName(),
                user.getUsername(),
                user.getAvatarUrl(),
                user.getCity(),
                user.getPhoneNumber(),
                user.getEmail(),
                user.getIsVerifiedDiia(),
                user.getRating(),
                user.getCreatedAt()
        );
    }
}
