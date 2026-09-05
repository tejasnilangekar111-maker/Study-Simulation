package com.studylibrary.app.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SummaryRequest {

    @NotBlank
    private String content;
}
