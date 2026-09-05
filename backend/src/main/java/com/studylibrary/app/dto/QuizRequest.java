package com.studylibrary.app.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuizRequest {

    @NotBlank
    private String topic;

    @Min(1)
    private int numberOfQuestions;
}
