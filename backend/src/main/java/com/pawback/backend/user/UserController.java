package com.pawback.backend.user;

import com.pawback.backend.listing.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .map(UserDto::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/me")
    public ResponseEntity<UserDto> updateMe(@RequestBody Map<String, String> updates) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).map(user -> {
            if (updates.containsKey("displayName")) user.setDisplayName(updates.get("displayName"));
            if (updates.containsKey("bio")) user.setBio(updates.get("bio"));
            if (updates.containsKey("city")) user.setCity(updates.get("city"));
            if (updates.containsKey("username")) user.setUsername(updates.get("username"));
            if (updates.containsKey("phoneNumber")) user.setPhoneNumber(updates.get("phoneNumber"));
            if (updates.containsKey("email") && !updates.get("email").isBlank()) {
                user.setEmail(updates.get("email"));
            }
            if (updates.containsKey("newPassword") && !updates.get("newPassword").isBlank()) {
                user.setPasswordHash(passwordEncoder.encode(updates.get("newPassword")));
            }
            return ResponseEntity.ok(UserDto.from(userRepository.save(user)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserDto> getByUsername(@PathVariable String username) {
        return userRepository.findByUsername(username)
                .map(UserDto::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<UserDto> searchUsers(@RequestParam(required = false) String q) {
        if (q == null || q.isBlank() || q.length() < 2) {
            return List.of();
        }
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findBySearchQuery(q).stream()
                .filter(u -> !u.getEmail().equals(currentEmail))
                .map(UserDto::from)
                .toList();
    }
}




 
 
 
 
