package com.studylibrary.app.service;

import com.studylibrary.app.dto.AuthResponse;
import com.studylibrary.app.dto.ForgotPasswordRequest;
import com.studylibrary.app.dto.LoginRequest;
import com.studylibrary.app.dto.RegisterRequest;
import com.studylibrary.app.dto.ResetPasswordRequest;
import com.studylibrary.app.entity.PasswordResetToken;
import com.studylibrary.app.entity.User;
import com.studylibrary.app.exception.DuplicateUserException;
import com.studylibrary.app.exception.InvalidTokenException;
import com.studylibrary.app.repository.PasswordResetTokenRepository;
import com.studylibrary.app.repository.UserRepository;
import com.studylibrary.app.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    @Value("${app.password-reset.token-expiry-minutes}")
    private long tokenExpiryMinutes;

    @Value("${app.password-reset.frontend-url}")
    private String frontendUrl;

    @Value("${app.admin.notification-email:}")
    private String adminNotificationEmail;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateUserException("Username is already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateUserException("Email is already registered: " + request.getEmail());
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setStreak(0);

        userRepository.save(user);
        notifyAdminOfNewUser(user);

        String token = jwtService.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername());
    }

    private void notifyAdminOfNewUser(User user) {
        if (!StringUtils.hasText(adminNotificationEmail)) {
            return;
        }
        try {
            emailService.sendAdminNewUserNotification(adminNotificationEmail, user.getUsername(), user.getEmail());
        } catch (Exception e) {
            // Notification is a non-critical side effect — never fail registration over it.
            log.warn("Failed to send admin new-user notification email", e);
        }
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsernameOrEmail(request.getUsernameOrEmail(), request.getUsernameOrEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid username/email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid username/email or password");
        }

        String token = jwtService.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername());
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUser(user);
            resetToken.setToken(UUID.randomUUID().toString());
            resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(tokenExpiryMinutes));
            passwordResetTokenRepository.save(resetToken);

            String resetLink = frontendUrl + "/reset-password?token=" + resetToken.getToken();
            emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
        });
        // Always return silently (no user-existence leak), whether or not the email matched an account.
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired reset token"));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Invalid or expired reset token");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }
}
