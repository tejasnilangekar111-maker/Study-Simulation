package com.studylibrary.app.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DailyAnalytics {

    private LocalDate date;
    private int focusMinutes;
    private int completedSessions;
}
