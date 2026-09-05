package com.studylibrary.app.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Reset your password");
        message.setText("We received a request to reset your password.\n\n"
                + "Click the link below to choose a new password. This link expires shortly.\n\n"
                + resetLink + "\n\n"
                + "If you didn't request this, you can safely ignore this email.");
        mailSender.send(message);
    }

    public void sendAdminNewUserNotification(String adminEmail, String username, String userEmail) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(adminEmail);
        message.setSubject("New user registered: " + username);
        message.setText("A new user just signed up.\n\n"
                + "Username: " + username + "\n"
                + "Email: " + userEmail);
        mailSender.send(message);
    }
}
