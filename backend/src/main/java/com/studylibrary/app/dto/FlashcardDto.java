package com.studylibrary.app.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FlashcardDto {

    private UUID id;

    @NotBlank
    private String question;

    @NotBlank
    private String answer;

    private LocalDateTime createdAt;
}
