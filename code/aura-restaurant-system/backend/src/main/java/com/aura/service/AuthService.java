package com.aura.service;

import com.aura.dto.AuthDtos.AuthResponse;
import com.aura.dto.AuthDtos.LoginRequest;
import com.aura.dto.AuthDtos.RegisterRequest;
import com.aura.exception.UsernameAlreadyExistsException;
import com.aura.model.User;
import com.aura.model.User.Role;
import com.aura.repository.UserRepository;
import com.aura.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Value("${jwt.expiry}")
    private long expiryMs;

    // ─── Login ───────────────────────────────────────────────────────────────

    /**
     * Authenticates a staff member and returns a signed JWT.
     * Throws BadCredentialsException for wrong username or password —
     * we use the same error message for both to prevent user enumeration.
     */
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.username(),
                            request.password()
                    )
            );
        } catch (AuthenticationException e) {
            // Do NOT reveal whether username or password was wrong
            throw new BadCredentialsException("Invalid username or password");
        }

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        String token = jwtUtil.generateToken(user);
        log.info("User '{}' logged in with role {}", user.getUsername(), user.getRole());

        return buildResponse(token, user);
    }

    // ─── Register ────────────────────────────────────────────────────────────

    /**
     * Creates a new staff account.
     * Only reachable by ADMIN users (enforced in SecurityConfig).
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException(
                    "Username '" + request.username() + "' is already taken"
            );
        }

        Role role = (request.role() != null) ? request.role() : Role.STAFF;

        User user = User.builder()
                .username(request.username())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(role)
                .active(true)
                .build();

        userRepository.save(user);
        log.info("New user '{}' registered with role {}", user.getUsername(), user.getRole());

        String token = jwtUtil.generateToken(user);
        return buildResponse(token, user);
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    private AuthResponse buildResponse(String token, User user) {
        return new AuthResponse(
                token,
                user.getUsername(),
                user.getRole().name(),
                expiryMs / 1000   // send as seconds
        );
    }
}


