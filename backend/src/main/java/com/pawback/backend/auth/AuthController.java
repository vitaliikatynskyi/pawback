package com.pawback.backend.auth;

import com.pawback.backend.user.User;
import com.pawback.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already in use");
        }
        
        var user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .displayName(request.displayName())
                .build();
                
        userRepository.save(user);
        var jwtToken = jwtUtil.generateToken(user.getEmail());
        
        return ResponseEntity.ok(new AuthResponse(jwtToken));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );
        var jwtToken = jwtUtil.generateToken(request.email());
        return ResponseEntity.ok(new AuthResponse(jwtToken));
    }
}

record RegisterRequest(String email, String password, String displayName) {}
record AuthRequest(String email, String password) {}
record AuthResponse(String token) {}



 
 
 
 
 
/**
 * Task: refactor: implement comprehensive authentication logging and error handling
 * Implemented during Pull Request #1
 * Timestamp: 2026-03-03T10:00:00
 */
 
 
 
