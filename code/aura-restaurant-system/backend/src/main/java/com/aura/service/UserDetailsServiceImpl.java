package com.aura.service;

import com.aura.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Spring Security calls this to load a User by username
 * during authentication and JWT validation.
 *
 * Our User entity implements UserDetails directly,
 * so we can return it as-is without any wrapper.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        // Generic message to prevent username enumeration via timing attacks
                        new UsernameNotFoundException("User not found")
                );
    }
}
