package com.studylibrary.app.ai;

import com.studylibrary.app.dto.QuizResponse;
import com.studylibrary.app.dto.SummaryResponse;

public interface AiService {

    QuizResponse generateQuiz(String topic, int numberOfQuestions);

    SummaryResponse summarize(String content);
}
