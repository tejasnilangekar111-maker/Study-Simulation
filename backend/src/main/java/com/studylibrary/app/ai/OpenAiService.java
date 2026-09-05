package com.studylibrary.app.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studylibrary.app.dto.QuizQuestion;
import com.studylibrary.app.dto.QuizResponse;
import com.studylibrary.app.dto.SummaryResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * {@link AiService} implementation backed by the real OpenAI Chat Completions API.
 * Only activated when the {@code openai.api-key} property is set (see application.yml,
 * bound from the {@code OPENAI_API_KEY} env var). When absent, {@link StubAiService} is
 * used instead so the app remains fully runnable without a key.
 */
@Service
@ConditionalOnProperty(name = "openai.api-key", matchIfMissing = false)
public class OpenAiService implements AiService {

    private static final String CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String model;

    public OpenAiService(@Value("${openai.api-key}") String apiKey, @Value("${openai.model:gpt-4o-mini}") String model) {
        this.model = model;
        this.restClient = RestClient.builder()
                .baseUrl(CHAT_COMPLETIONS_URL)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    @Override
    public QuizResponse generateQuiz(String topic, int numberOfQuestions) {
        String systemPrompt = "You are a quiz generator. Respond ONLY with JSON matching this exact shape, "
                + "no prose: {\"questions\":[{\"question\":string,\"options\":[string,string,string,string],"
                + "\"correctAnswerIndex\":number}]}";
        String userPrompt = "Generate " + numberOfQuestions + " multiple choice questions about: " + topic;

        String rawJson = chatCompletion(systemPrompt, userPrompt, true);
        JsonNode root = parseJson(rawJson);

        List<QuizQuestion> questions = new ArrayList<>();
        for (JsonNode q : root.path("questions")) {
            List<String> options = new ArrayList<>();
            q.path("options").forEach(o -> options.add(o.asText()));
            questions.add(new QuizQuestion(q.path("question").asText(), options, q.path("correctAnswerIndex").asInt()));
        }
        return new QuizResponse(questions);
    }

    @Override
    public SummaryResponse summarize(String content) {
        String systemPrompt = "You are a concise summarizer. Summarize the user's content in 2-3 sentences.";
        String summary = chatCompletion(systemPrompt, content, false);
        return new SummaryResponse(summary);
    }

    private String chatCompletion(String systemPrompt, String userPrompt, boolean jsonMode) {
        Map<String, Object> body = jsonMode
                ? Map.of(
                        "model", model,
                        "messages", List.of(
                                Map.of("role", "system", "content", systemPrompt),
                                Map.of("role", "user", "content", userPrompt)),
                        "response_format", Map.of("type", "json_object"))
                : Map.of(
                        "model", model,
                        "messages", List.of(
                                Map.of("role", "system", "content", systemPrompt),
                                Map.of("role", "user", "content", userPrompt)));

        JsonNode response = restClient.post()
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        return response.path("choices").get(0).path("message").path("content").asText();
    }

    private JsonNode parseJson(String rawJson) {
        try {
            return objectMapper.readTree(rawJson);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse OpenAI JSON response", e);
        }
    }
}
