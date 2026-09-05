package com.studylibrary.app.ai;

import com.studylibrary.app.dto.QuizQuestion;
import com.studylibrary.app.dto.QuizResponse;
import com.studylibrary.app.dto.SummaryResponse;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Default {@link AiService} implementation used when no real AI provider is configured.
 * Returns deterministic, topic-aware canned responses so the rest of the application
 * (frontend, tests, demos) can be exercised without an OpenAI API key.
 */
@Service
@Primary
public class StubAiService implements AiService {

    @Override
    public QuizResponse generateQuiz(String topic, int numberOfQuestions) {
        List<QuizQuestion> questions = new ArrayList<>();
        int count = Math.max(1, numberOfQuestions);

        for (int i = 1; i <= count; i++) {
            String question = "Question " + i + ": What is a key concept related to \"" + topic + "\"?";
            List<String> options = List.of(
                    "A fundamental principle of " + topic,
                    "An unrelated concept",
                    "A common misconception about " + topic,
                    "None of the above"
            );
            questions.add(new QuizQuestion(question, options, 0));
        }

        return new QuizResponse(questions);
    }

    @Override
    public SummaryResponse summarize(String content) {
        String trimmed = content.trim();
        int maxLength = 200;
        String summary = trimmed.length() > maxLength
                ? trimmed.substring(0, maxLength).trim() + "..."
                : trimmed;
        return new SummaryResponse("Summary: " + summary);
    }
}
