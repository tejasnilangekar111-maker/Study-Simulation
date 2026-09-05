# Study Simulation — Complete Interview Study Guide

Project: an "AI Study Simulation" web app — animated library scene, Pomodoro timer, ambient
sound mixer, productivity sidebar (todos/notes/flashcards/streak/analytics), floating AI chat
assistant, JWT auth. **Stack:** Spring Boot 3.3 (Java 17) + PostgreSQL + Redis + WebSocket/STOMP
on the backend, React 19 (Vite) + Zustand + Tailwind v4 + Framer Motion + Howler.js on the
frontend, wired together with Docker Compose + Nginx.

---

# PART 1 — Project Overview

## What the app does

A user registers/logs in (JWT), lands on a "study room" with an animated day/night library
background, a floating Pomodoro timer, a 9-channel ambient sound mixer, a collapsible sidebar
(todo list, quick notes, flashcards, streak, weekly analytics chart), and a draggable AI chat
orb. Pomodoro sessions and streaks are persisted to Postgres via the backend; most UI/session
state (todos, sound levels, timer) lives client-side in Zustand and is synced to `localStorage`.

## Architecture (text diagram)

```
┌─────────────┐        HTTPS/JSON (REST)         ┌──────────────────┐
│   Browser    │ ───────────────────────────────▶ │  nginx (proxy)    │
│  React SPA   │ ◀─────────────────────────────── │  routes /api /ws  │
│  (Vite/JS)   │        WS (STOMP over SockJS)     │  /swagger-ui       │
└─────────────┘                                    └────────┬─────────┘
                                                              │
                                        ┌─────────────────────┴─────────────────────┐
                                        │            Spring Boot backend             │
                                        │  Controller → Service → Repository → JPA   │
                                        │  Security filter chain (JWT)                │
                                        │  WebSocket/STOMP broker (/topic)            │
                                        └───────┬───────────────────────┬───────────┘
                                                │                       │
                                       ┌────────▼────────┐    ┌─────────▼─────────┐
                                       │   PostgreSQL     │    │      Redis         │
                                       │ (durable data:   │    │ (ephemeral live    │
                                       │ users, sessions, │    │ Pomodoro timer      │
                                       │ notes, cards)    │    │ state, TTL 6h)      │
                                       └──────────────────┘    └────────────────────┘
```

## Request flow, browser to DB (example: completing a Pomodoro session)

1. `PomodoroTimer.jsx` calls `useSessionStore().tick()` every second (client-only countdown).
2. On cycle completion the frontend *could* call `POST /api/pomodoro/complete` (backend has
   the endpoint) — the request goes through the axios instance in `services/api.js`, which
   attaches `Authorization: Bearer <jwt>` via an interceptor.
3. Nginx (`nginx/nginx.conf`) proxies `/api/*` to the Spring Boot container on port 8080.
4. Spring's `JwtAuthFilter` intercepts the request, validates the JWT, and populates the
   `SecurityContext` with an authenticated principal.
5. `PomodoroController.complete()` receives the validated `@RequestBody`, delegates to
   `PomodoroService.complete()`.
6. The service loads the `User` and owned `PomodoroSession` from `PomodoroSessionRepository`
   (Spring Data JPA → Hibernate → PostgreSQL), marks it completed, updates the streak, calls
   `AnalyticsService.recordCompletedSession()`, and clears the Redis "active session" cache key.
7. The saved entity is mapped to a `PomodoroSessionDto` and serialized to JSON in the
   `ResponseEntity`, flows back through nginx to the browser.

---

# PART 2 — Spring Boot / Java Backend

## 2.1 Layered architecture

```
controller/   → HTTP boundary: @RestController classes, map JSON ⇄ DTOs, no business logic
service/      → business logic, transactions, orchestration
repository/   → Spring Data JPA interfaces, no implementation code needed
entity/       → @Entity classes mapped 1:1 to DB tables
dto/          → request/response shapes exposed over HTTP (never expose entities directly)
security/     → JWT filter, UserDetailsService, SecurityConfig
websocket/    → STOMP config + message-mapped controller
config/       → cross-cutting @Configuration beans (CORS, Redis, OpenAPI)
exception/    → custom exceptions + @RestControllerAdvice global handler
```

**Why separate DTOs from entities?** Entities carry JPA/Hibernate concerns (lazy proxies,
bidirectional relationships) that don't serialize cleanly to JSON and would leak internal
schema to clients. `PomodoroSessionDto.fromEntity(saved)` is the mapping boundary — you'll see
this pattern (a static factory method on the DTO) throughout the project (`NotesService.toDto`).

## 2.2 Core Spring Boot annotations used in this repo

| Annotation | Where | What it does |
|---|---|---|
| `@RestController` | `AuthController`, `PomodoroController`, etc. | `@Controller` + `@ResponseBody` — every method return value is serialized straight to the HTTP response body (JSON) instead of resolved to a view name |
| `@RequestMapping("/api/auth")` | class-level on controllers | base path prefix for all methods in the class |
| `@PostMapping` / `@GetMapping` / `@PutMapping` / `@DeleteMapping` | controller methods | shortcuts for `@RequestMapping(method=...)` |
| `@RequestBody` | controller method params | deserializes the JSON request body into a Java object via Jackson |
| `@PathVariable` | `NotesController.update(@PathVariable UUID id, ...)` | binds a URI template variable |
| `@Valid` | e.g. `@Valid @RequestBody RegisterRequest request` | triggers Bean Validation on the DTO before the method body runs |
| `@Service` | `AuthService`, `PomodoroService`, `NotesService`, `AnalyticsService` | marks a class as a Spring-managed business-logic bean |
| `@Repository` (implicit) | Spring Data interfaces extend `JpaRepository`, which is already a bean — no explicit annotation needed here |
| `@Entity` / `@Table` | `User`, `PomodoroSession`, etc. | marks a class as a JPA-mapped table |
| `@Configuration` | `RedisConfig`, `CorsConfig`, `SecurityConfig`, `OpenApiConfig`, `WebSocketConfig` | class produces `@Bean`s wired into the Spring context |
| `@Bean` | methods inside `@Configuration` classes | registers the method's return value as a managed bean |
| `@Component` | `JwtAuthFilter` | generic stereotype for any Spring-managed bean that isn't a controller/service/repository |
| `@RestControllerAdvice` | `GlobalExceptionHandler` | applies `@ExceptionHandler` methods globally across all `@RestController`s |
| `@Transactional` | e.g. `AuthService.register()`, `PomodoroService.complete()` | wraps the method in a DB transaction; rolls back all changes if an unchecked exception is thrown |
| `@ConditionalOnProperty` | `OpenAiService` | only registers this bean if `openai.api-key` is present in config |
| `@Primary` | `StubAiService` | when two beans implement `AiService`, Spring autowires this one by default |

## 2.3 Dependency Injection (constructor injection)

Every service/controller in this project uses **constructor injection** via Lombok's
`@RequiredArgsConstructor`, which generates a constructor for all `final` fields:

```java
@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    ...
}
```

**Why constructor injection over `@Autowired` field injection?** Fields are `final` (immutable
after construction), dependencies are explicit/visible in the constructor signature, and the
class is trivially testable — you can `new AuthService(mockRepo, mockEncoder, mockJwt)` in a
unit test without needing a Spring context. This is the modern recommended Spring pattern.

## 2.4 Spring Data JPA

### Entities & relationships

All entities use `UUID` primary keys generated by the DB/JPA (`GenerationType.UUID`), matching
Postgres's `pgcrypto`-generated UUIDs in `V1__init_schema.sql`. Every child entity
(`PomodoroSession`, `StudyNote`, `Flashcard`, `AnalyticsSnapshot`) has a `@ManyToOne` back to
`User`:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id", nullable = false)
private User user;
```

- `@ManyToOne` — many sessions belong to one user.
- `FetchType.LAZY` — the `User` isn't loaded from the DB until `.getUser()` is actually
  accessed, avoiding unnecessary joins. (Note: `@ManyToOne` defaults to `EAGER` in plain JPA —
  explicitly setting `LAZY` here is a deliberate performance choice.)
- `@JoinColumn` — names the foreign-key column.

`@CreationTimestamp` / `@UpdateTimestamp` (Hibernate-specific, not standard JPA) auto-populate
`createdAt`/`updatedAt` on insert/update — see `StudyNote`.

`PomodoroSession.SessionType` is a Java `enum` (`WORK, SHORT_BREAK, LONG_BREAK`), persisted with
`@Enumerated(EnumType.STRING)` so the DB stores the readable string, not the ordinal int (safer
against enum-reordering bugs).

### Repositories — derived query methods

```java
public interface PomodoroSessionRepository extends JpaRepository<PomodoroSession, UUID> {
    List<PomodoroSession> findByUserIdOrderByStartedAtDesc(UUID userId);
    List<PomodoroSession> findByUserIdAndCompletedTrueAndCompletedAtBetween(
            UUID userId, LocalDateTime start, LocalDateTime end);
}
```

Spring Data JPA parses the method **name** into a query at startup — no SQL/JPQL is written.
`findByUserIdAndCompletedTrueAndCompletedAtBetween` → `WHERE user_id = ? AND completed = true
AND completed_at BETWEEN ? AND ?`. Extending `JpaRepository<Entity, IdType>` gives you
`save()`, `findById()`, `findAll()`, `delete()`, etc. for free — no implementation class needed;
Spring generates a dynamic proxy at runtime.

### `ddl-auto` vs Flyway

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update   # dev convenience
  flyway:
    enabled: false        # reference migration exists but is off
```

`ddl-auto: update` lets Hibernate inspect your `@Entity` classes and auto-alter the schema to
match — convenient in dev, **dangerous in production** (no history, can silently drop/alter
columns). `V1__init_schema.sql` under `db/migration/` is a hand-written Flyway migration that
mirrors the entities exactly, intended as the production path: flip `flyway.enabled: true` and
`ddl-auto: validate` (Hibernate then just checks the schema matches, never mutates it).
**Interview talking point:** this is exactly the "dev auto-DDL vs. versioned migrations"
trade-off interviewers like to probe.

## 2.5 Full REST flow walkthrough — `POST /api/auth/register`

```java
// 1. Controller: validate + delegate, return the right HTTP status
@PostMapping("/register")
public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    AuthResponse response = authService.register(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

```java
// 2. DTO: validation lives on the DTO, declaratively
public class RegisterRequest {
    @NotBlank private String username;
    @NotBlank @Email private String email;
    @NotBlank @Size(min = 6) private String password;
}
```

```java
// 3. Service: business logic + transaction boundary
@Transactional
public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByUsername(request.getUsername()))
        throw new DuplicateUserException("Username is already taken: " + request.getUsername());
    if (userRepository.existsByEmail(request.getEmail()))
        throw new DuplicateUserException("Email is already registered: " + request.getEmail());

    User user = new User();
    user.setUsername(request.getUsername());
    user.setEmail(request.getEmail());
    user.setPassword(passwordEncoder.encode(request.getPassword())); // BCrypt hash, never store plaintext
    user.setStreak(0);
    userRepository.save(user);

    String token = jwtService.generateToken(user.getUsername());
    return new AuthResponse(token, user.getUsername());
}
```

4. **Repository** — `userRepository.save(user)` is a generated JPA proxy method; Hibernate
   issues an `INSERT` (or `UPDATE` if the entity already has an id) inside the ambient
   transaction opened by `@Transactional`.
5. **Response** — `AuthResponse` (a simple DTO with `token` + `username`) is serialized to JSON
   by Spring's Jackson `HttpMessageConverter` and returned with `201 Created`.

If either "already exists" check fails, `DuplicateUserException` propagates up uncaught from the
service — Spring rolls back the transaction (nothing was inserted) and `GlobalExceptionHandler`
converts it into a structured `409 Conflict` JSON body (see 2.7).

## 2.6 Spring Security + JWT — full authentication flow

**The moving parts:**
- `SecurityConfig` — wires the filter chain, exposes `PasswordEncoder`, permits/denies routes.
- `JwtService` — signs/verifies/parses tokens (uses `io.jsonwebtoken` / JJWT).
- `JwtAuthFilter` — a servlet filter that runs on *every* request, reads the token, populates
  the security context.
- `CustomUserDetailsService` — loads a `UserDetails` given a username (used by both the JWT
  filter's downstream authorities and, if ever needed, form-login style auth).

### Step-by-step: what happens on a request to a protected endpoint

1. Client sends `Authorization: Bearer <token>` header (added automatically by the axios
   interceptor on the frontend — see 3.5).
2. `SecurityConfig.securityFilterChain()` registers:
   ```java
   .csrf(csrf -> csrf.disable())                       // no CSRF tokens needed — stateless API, not cookie/session based
   .cors(cors -> {})                                     // delegates to the CorsConfigurationSource bean
   .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
   .authorizeHttpRequests(auth -> auth
       .requestMatchers("/api/auth/**", "/swagger-ui/**", "/v3/api-docs/**", "/ws/**").permitAll()
       .anyRequest().authenticated())
   .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
   ```
   `STATELESS` means Spring Security never creates an `HttpSession` — every request must carry
   its own proof of identity (the JWT). `addFilterBefore` splices `JwtAuthFilter` into the
   filter chain *before* Spring's default username/password filter, so JWT auth runs first.
3. `JwtAuthFilter.doFilterInternal()` runs on every request (it extends `OncePerRequestFilter`,
   guaranteeing exactly one execution per request even with internal dispatch/forwarding):
   ```java
   String authHeader = request.getHeader("Authorization");
   if (authHeader == null || !authHeader.startsWith("Bearer ")) {
       filterChain.doFilter(request, response);   // no token — let it through unauthenticated
       return;
   }
   String token = authHeader.substring(7);
   if (jwtService.validateToken(token)) {
       String username = jwtService.extractUsername(token);
       if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
           UserDetails userDetails = userDetailsService.loadUserByUsername(username);
           UsernamePasswordAuthenticationToken authToken =
               new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
           SecurityContextHolder.getContext().setAuthentication(authToken);
       }
   }
   filterChain.doFilter(request, response);
   ```
   If the header is missing/malformed or the token is invalid, the filter simply doesn't set an
   `Authentication` — the request continues *unauthenticated*, and `authorizeHttpRequests` later
   rejects it with `403` if the endpoint requires auth.
4. `JwtService.validateToken()` parses and verifies the HMAC-SHA256 signature with the shared
   secret (`jwt.secret`), and checks expiry:
   ```java
   public boolean validateToken(String token) {
       try {
           Jwts.parser().verifyWith(signingKey()).build().parseSignedClaims(token);
           Date expiration = extractClaim(token, Claims::getExpiration);
           return expiration.after(new Date());
       } catch (Exception e) {
           return false;   // malformed / tampered / expired token
       }
   }
   ```
5. Once `SecurityContextHolder` holds an authenticated principal, downstream controllers can
   call `authentication.getName()` to get the current username — used throughout
   (`PomodoroController.start(..., Authentication authentication)`).
6. **Password hashing:** `BCryptPasswordEncoder` (registered as the `PasswordEncoder` bean in
   `SecurityConfig`) hashes passwords with a per-password random salt baked into the hash
   string, and is deliberately slow (adaptive cost factor) to resist brute-forcing. Login
   compares with `passwordEncoder.matches(rawPassword, storedHash)` — you never decrypt a hash,
   you re-hash the input and compare.

**Common interview follow-ups:**
- *Why disable CSRF here?* CSRF protection matters for cookie/session-based auth where the
  browser auto-attaches credentials. A stateless JWT-in-header API isn't vulnerable to CSRF the
  same way, since the token must be explicitly attached by JS, not automatically sent by the
  browser.
- *What if the JWT secret leaks?* Anyone can forge valid tokens for any user — hence
  `application.yml`'s comment to override the dev placeholder in production.
- *Where's authorization (roles/permissions)?* This project only distinguishes
  authenticated-vs-not (`CustomUserDetailsService` grants `Collections.emptyList()` authorities)
  — there's no role-based access control (RBAC) layer, a reasonable "what would you add next"
  discussion point.

## 2.7 Centralized exception handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors())
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        ApiError error = new ApiError(LocalDateTime.now(), 400, "Bad Request", "Validation failed", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler({EntityNotFoundException.class, ResourceNotFoundException.class})
    public ResponseEntity<ApiError> handleNotFound(RuntimeException ex) { ... }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex) { ... }

    @ExceptionHandler(DuplicateUserException.class)
    public ResponseEntity<ApiError> handleDuplicateUser(DuplicateUserException ex) { ... }

    @ExceptionHandler(Exception.class)   // catch-all fallback
    public ResponseEntity<ApiError> handleGeneric(Exception ex) { ... }
}
```

`@RestControllerAdvice` = `@ControllerAdvice` + `@ResponseBody`, applied globally to every
controller — one place to centralize error→HTTP-status mapping instead of try/catch in every
controller method. Custom exceptions (`DuplicateUserException`, `ResourceNotFoundException`,
both simple `RuntimeException` subclasses) let service code `throw new
ResourceNotFoundException(...)` and stay decoupled from HTTP concerns entirely — the *service*
layer never imports `HttpStatus`. `ApiError` is a consistent JSON error shape
(`timestamp/status/error/message/fieldErrors`) the frontend can rely on.

## 2.8 Redis usage

```java
@Bean
public RedisTemplate<String, Object> redisTemplate() {
    ...
    template.setValueSerializer(new GenericJackson2JsonRedisSerializer(objectMapper));
    ...
}
```

`PomodoroService` caches "live" session state in Redis with a 6-hour TTL:

```java
private void cacheActiveSession(UUID userId, PomodoroSession session, String status) {
    String key = ACTIVE_SESSION_KEY_PREFIX + userId;
    Map<String, Object> state = Map.of(
        "sessionId", session.getId().toString(), "status", status,
        "durationMinutes", session.getDurationMinutes(), "sessionType", session.getSessionType().name());
    redisTemplate.opsForValue().set(key, state, Duration.ofHours(6));
}
```

**Why Postgres *and* Redis?** Postgres is the durable system of record (session history,
users, streaks — needs ACID guarantees and complex queries). Redis holds *ephemeral, frequently
read/written* "what's happening right now" state — an in-memory key-value store is far faster
for this and the TTL means stale sessions self-expire without a cleanup job. This is the classic
"cache/hot-state store next to a durable relational DB" pattern.

## 2.9 WebSocket / STOMP — real-time Pomodoro sync

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");           // in-memory pub/sub broker for outbound messages
        registry.setApplicationDestinationPrefixes("/app"); // inbound messages routed to @MessageMapping methods
    }
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }
}
```

STOMP (Simple Text Oriented Messaging Protocol) is a messaging sub-protocol layered on top of
raw WebSocket frames — it adds the notion of *destinations* (like `/topic/pomodoro/{id}`) and
verb-like frames (`SEND`, `SUBSCRIBE`), which is why Spring can route messages to annotated
methods much like HTTP controllers. `withSockJS()` adds a fallback (long-polling etc.) for
environments where raw WebSockets are blocked.

```java
@Controller
public class PomodoroWebSocketController {
    @MessageMapping("/pomodoro/{sessionId}")     // client sends to /app/pomodoro/{sessionId}
    @SendTo("/topic/pomodoro/{sessionId}")        // broadcast the return value to everyone subscribed here
    public Map<String, Object> handleTimerEvent(@DestinationVariable String sessionId, Map<String, Object> payload) {
        String action = String.valueOf(payload.getOrDefault("action", "")).toUpperCase();
        Map<String, Object> state = switch (action) {
            case "START" -> Map.of("sessionId", sessionId, "status", "RUNNING", "action", action);
            case "PAUSE" -> Map.of("sessionId", sessionId, "status", "PAUSED", "action", action);
            case "SKIP"  -> Map.of("sessionId", sessionId, "status", "SKIPPED", "action", action);
            default      -> Map.of("sessionId", sessionId, "status", "UNKNOWN", "action", action);
        };
        redisTemplate.opsForValue().set(REDIS_KEY_PREFIX + sessionId, state, Duration.ofHours(6));
        return state;
    }
}
```

Flow: any client opens a STOMP connection to `/ws`, subscribes to `/topic/pomodoro/{sessionId}`,
and sends control messages to `/app/pomodoro/{sessionId}`. The server persists the latest state
to Redis and re-broadcasts it to *every* subscriber — this is what lets the same Pomodoro timer
stay in sync across multiple open tabs/devices for one user (or, in principle, a shared study
room). Note the `switch` expression here is modern Java (14+) "arrow" syntax, returning a value
directly instead of `case: ... break;`.

## 2.10 AI service abstraction — Strategy pattern

```java
public interface AiService {
    ChatResponse chat(String message);
    QuizResponse generateQuiz(String topic, int numberOfQuestions);
    SummaryResponse summarize(String content);
}

@Service @Primary
public class StubAiService implements AiService { /* deterministic canned responses */ }

@Service
@ConditionalOnProperty(name = "openai.api-key", matchIfMissing = false)
public class OpenAiService implements AiService { /* TODO: real OpenAI calls */ }
```

Both classes implement the same interface — classic **Strategy pattern**: `AiController`
depends only on the `AiService` interface, never on a concrete class, so which implementation
actually runs is decided entirely by Spring's DI container at startup. `@ConditionalOnProperty`
means `OpenAiService` is only registered as a bean at all when `openai.api-key` is non-empty;
`@Primary` on `StubAiService` breaks the tie when both *could* be candidates, ensuring the app
always boots and works even with zero external API keys configured — a nice example of
designing for local development/demo-ability without hard-coding a vendor dependency.

## 2.11 Bean Validation

`jakarta.validation` annotations declared on DTOs (`@NotBlank`, `@Email`, `@Size(min = 6)`) are
enforced automatically the moment a controller parameter is marked `@Valid`. A failure throws
`MethodArgumentNotValidException` before the controller body even runs, which
`GlobalExceptionHandler` turns into a structured 400 with one message per invalid field — no
manual `if` checks needed in controllers.

## 2.12 OpenAPI / Swagger

```java
@Bean
public OpenAPI studySimulationOpenAPI() {
    return new OpenAPI()
        .info(new Info().title("Study Simulation API").version("1.0.0")...)
        .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
        .components(new Components().addSecuritySchemes("bearerAuth",
            new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
}
```

`springdoc-openapi-starter-webmvc-ui` auto-generates interactive API docs at
`/swagger-ui.html` by reflecting over all `@RestController`s. This bean adds a global "bearer
JWT" auth scheme to the generated docs UI, so testers can paste a token once and try protected
endpoints directly from the browser.

## 2.13 CORS configuration

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of(allowedOrigin));               // e.g. http://localhost:5173
    configuration.setAllowedOriginPatterns(List.of("http://localhost:*")); // any dev port
    configuration.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
    configuration.setAllowCredentials(true);
    ...
}
```

CORS (Cross-Origin Resource Sharing) is a *browser-enforced* restriction — the frontend (served
from one origin, e.g. `localhost:5173` or nginx's `:8081`) calls the backend on a different
origin (`localhost:8080`), so the backend must explicitly opt that origin in via response
headers, or the browser blocks the response from reaching JS. `SecurityConfig.cors(cors -> {})`
tells Spring Security to delegate to this `CorsConfigurationSource` bean rather than disabling
CORS handling outright.

## 2.14 `application.yml` configuration

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5433/study_simulation}
    username: ${DB_USERNAME:postgres}
  data:
    redis:
      host: ${REDIS_HOST:localhost}
jwt:
  secret: ${JWT_SECRET:change-this-in-production-...}
openai:
  api-key: ${OPENAI_API_KEY:}
```

`${VAR:default}` is Spring's placeholder syntax: read from an environment variable, falling back
to the literal after the colon if unset. This is how the *same* jar/image behaves differently in
local dev (defaults) vs. Docker Compose (env vars injected — see `docker-compose.yml`) vs.
production, with zero code changes — a core "12-factor app" configuration principle.

## 2.15 Common Spring Boot interview Q&A (tied to this codebase)

**Q: What's the difference between `@Component`, `@Service`, `@Repository`, `@Controller`?**
Functionally near-identical (all register a Spring bean); they're semantic stereotypes.
`@Repository` additionally enables persistence-exception translation. This project uses
`@Service` for business logic classes and relies on Spring Data JPA to auto-implement
repositories without ever writing `@Repository` explicitly.

**Q: How does `@Transactional` work?** Spring wraps the annotated method call in a proxy that
begins a DB transaction on entry and commits on successful return, or rolls back on an
unchecked exception (e.g. `AuthService.register` rolls back both `existsBy*` checks and the
`save()` together if anything throws after the insert).

**Q: Why is `open-in-view: false` set?** (`application.yml`) It disables the "Open Session In
View" anti-pattern, where a Hibernate session stays open for the whole HTTP request so lazy
associations can be fetched from views/serializers. Disabling it forces you to fetch everything
you need inside the `@Transactional` service method (as this project does via DTO mapping), which
avoids surprise N+1 queries and keeps the persistence layer cleanly separated from the web layer.

**Q: Explain the security filter chain order here.** `JwtAuthFilter` is inserted
`addFilterBefore(..., UsernamePasswordAuthenticationFilter.class)`, so JWT validation happens
before Spring's default form-login filter would ever run (which this app doesn't use, but the
ordering still matters conceptually for any additional filters).

**Q: Why UUID primary keys instead of auto-increment longs?** Harder to enumerate/guess
(`/api/notes/1`, `/2`, `/3` leaks info), safely mergeable across distributed systems, and
generated client- or DB-side without a round trip. Trade-off: larger index size than a bigint.

**Q: What happens if two requests race to register the same username?** The `existsByUsername`
check plus `@Transactional` doesn't fully protect against a race between two concurrent
transactions (a classic TOCTOU gap); the real guard is the DB-level `UNIQUE` constraint in
`V1__init_schema.sql` (`CONSTRAINT uq_users_username UNIQUE (username)`), which would raise a
`DataIntegrityViolationException` on the second insert — currently **not** explicitly caught by
`GlobalExceptionHandler` (falls through to the generic 500 handler), a good "what would you
improve" answer.

---

# PART 3 — React / JavaScript Frontend

## 3.1 Project structure & Vite

```
src/
  components/   reusable UI split by feature (Pomodoro/ SoundMixer/ Sidebar/ LibraryScene/ AIAssistant/ Navbar/)
  pages/        route-level screens (LandingPage, LoginPage, StudyRoomPage, TodoPage, AnalyticsPage)
  hooks/        custom hooks (useFocusMode, useIdleDetection, useProceduralAudio)
  services/     api.js (axios), audioEngine.js (Web Audio)
  store/        Zustand stores
  utils/        pure helper functions + constants
```

Vite is the build tool/dev server (replacing older tools like Create React App/Webpack for new
projects): it serves source files over native ES modules in dev (near-instant startup, no
bundling step until you actually load a module) and uses Rollup to bundle for production
(`vite build`). Config:

```js
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

`@vitejs/plugin-react` enables JSX transform + Fast Refresh (hot-reload that preserves component
state during edits); `@tailwindcss/vite` integrates Tailwind v4's new native Vite plugin (no
separate PostCSS config file needed, unlike Tailwind v3).

`import.meta.env.VITE_API_URL` (`utils/constants.js`) is Vite's env-var mechanism — only
variables prefixed `VITE_` are exposed to client code (a deliberate security boundary so secret
server-side env vars never leak into the bundle).

## 3.2 Functional components & JSX — walkthrough of `PomodoroTimer.jsx`

```jsx
export default function PomodoroTimer() {
  const { mode, secondsLeft, isRunning, workMinutes, breakMinutes, start, pause, tick, skip, setDurations } =
    useSessionStore()
  const recordStudyMinutes = useSidebarStore((s) => s.recordStudyMinutes)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const prevSecondsRef = useRef(secondsLeft)

  useEffect(() => {
    const interval = setInterval(() => { tick() }, 1000)
    return () => clearInterval(interval)
  }, [tick])
  ...
  return ( /* JSX markup */ )
}
```

- It's a **function component** — modern React has no need for class components; state and
  lifecycle come from **hooks**.
- JSX (`<div className="...">{expr}</div>`) is syntactic sugar compiled (by the Vite/Babel React
  plugin) into `React.createElement(...)` calls — it's not HTML, it's JS expressions with
  HTML-like syntax; `{}` embeds any JS expression.
- Destructuring the Zustand store (`const { mode, ... } = useSessionStore()`) subscribes this
  component to *every* field in the store — see 3.4 for why selective selectors
  (`useSidebarStore((s) => s.recordStudyMinutes)`) are used elsewhere to avoid unnecessary
  re-renders.

## 3.3 Hooks used in this project

### Built-in hooks

- **`useState`** — local component state, e.g. `const [settingsOpen, setSettingsOpen] =
  useState(false)` in `PomodoroTimer`, or the login form fields in `LoginPage.jsx`. Calling the
  setter triggers a re-render with the new value.
- **`useEffect`** — runs side effects after render, re-running when dependencies change. The
  timer interval above is the textbook example: it registers a `setInterval` on mount and
  *must* `clearInterval` in the returned cleanup function on unmount/re-run, otherwise you'd
  stack duplicate intervals every re-render (a very common interview gotcha).
- **`useRef`** — a mutable box that persists across renders *without* triggering a re-render
  when changed. `prevSecondsRef` in `PomodoroTimer` tracks the previous tick's `secondsLeft` to
  detect "the countdown just rolled over" (a completed cycle) — using plain state here would
  cause an extra unnecessary render every second.

### Custom hooks

**`useIdleDetection.js`** — detects user inactivity:
```js
export function useIdleDetection(timeout = IDLE_TIMEOUT_MS) {
  const [isIdle, setIsIdle] = useState(false)
  const timerRef = useRef(null)
  useEffect(() => {
    const resetTimer = () => {
      setIsIdle(false)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setIsIdle(true), timeout)
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach((evt) => window.addEventListener(evt, resetTimer))
    resetTimer()
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timeout])
  return isIdle
}
```
Attaches listeners for common "user is active" events; any activity resets a debounce-style
timeout. If no activity fires before `timeout` (10s, from `constants.js`), `isIdle` flips true.
Cleanup removes every listener and clears the pending timeout — critical to avoid memory leaks /
stale closures when the component unmounts.

**`useFocusMode.js`** — composes the hook above with global UI state:
```js
export function useFocusMode() {
  const isIdle = useIdleDetection()
  const setFocusMode = useUiStore((s) => s.setFocusMode)
  useEffect(() => { setFocusMode(isIdle) }, [isIdle, setFocusMode])
  return useUiStore((s) => s.focusMode)
}
```
This demonstrates **hook composition** — building higher-level behavior (auto-hiding UI chrome
during "focus mode") out of a lower-level primitive (`useIdleDetection`), while pushing the
actual boolean into a shared Zustand store so *any* component (`Sidebar`, `Navbar`,
`StudyRoomPage`) can react to focus mode without prop drilling.

**`useProceduralAudio.js`** — syncs Web Audio gain nodes to store state:
```js
export function useProceduralAudio() {
  const channels = useSoundStore((s) => s.channels)
  useEffect(() => {
    SOUND_CHANNELS.forEach(({ key }) => {
      const ch = channels[key]
      if (!ch) return
      const effective = ch.muted ? 0 : ch.volume
      setChannelVolume(key, effective)
    })
  }, [channels])
}
export function startAudioEngine() { ensureStarted() }
```
Whenever `channels` (volumes/mutes for all 9 ambient sound channels) changes in the store, this
effect pushes the new values into the underlying `AudioContext` gain nodes (`audioEngine.js`).
`startAudioEngine` is called from a click handler (`SoundMixer`'s toggle button) because browsers
block `AudioContext` from starting audio without a user gesture — a real-world browser API
constraint interviewers sometimes ask about.

## 3.4 State management — Zustand

Five stores, each a focused slice of global state:

```js
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null, token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth-storage' }
  )
)
```

`create(fn)` returns a hook; `fn` receives `set` (and `get`) and returns the initial state plus
action functions that call `set` to mutate it. `persist(config, { name })` is a Zustand
middleware that auto-syncs the store to `localStorage` under that key, and rehydrates it on page
load — this is how `authStore` (JWT token), `sidebarStore` (todos/notes/flashcards/streak),
`soundStore` (channel volumes) survive a browser refresh with zero manual code.

**`sidebarStore.js`** is the most complex store — it manages todos (`addTodo`/`toggleTodo`/
`removeTodo`/`reorderTodos`), notes, flashcards, and derives streak/heatmap/weekly-chart data:
```js
recordStudyMinutes: (minutes) =>
  set((state) => {
    const key = todayKey()
    const weeklyMinutes = { ...state.weeklyMinutes, [key]: (state.weeklyMinutes[key] || 0) + minutes }
    let { count, lastActiveDate, best = 0 } = state.streak
    if (lastActiveDate !== key) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      count = lastActiveDate === yesterday ? count + 1 : 1
      lastActiveDate = key
    }
    best = Math.max(best, count)
    ...
    return { weeklyMinutes, streak: { count, lastActiveDate, best }, history }
  }),
```
Note `set((state) => ({...}))` — the **functional updater** form, which reads the *current*
state atomically and returns a partial patch that gets shallow-merged in. All updates are
immutable (`{ ...state.weeklyMinutes, [key]: ... }` spreads a new object rather than mutating in
place) — required so React/Zustand can correctly detect changes by reference equality.

**Why Zustand over Redux or Context?** No boilerplate (no actions/reducers/dispatch, no
Provider wrapping the tree — `useSidebarStore()` can be called from any component directly), a
tiny bundle size, and — critically — **selective subscriptions**: `useSidebarStore((s) =>
s.streak)` only re-renders the component when `streak` changes, not on every store update
(unlike naive `useContext`, where *any* context value change re-renders every consumer unless
you manually split contexts).

**`sessionStore.js`** models the Pomodoro timer's own countdown state machine (`work` ⇄ `break`)
independent of any store persistence (it's not wrapped in `persist` — a running timer shouldn't
survive a hard refresh mid-count).

## 3.5 React Router & protected routes (`App.jsx`)

```jsx
const StudyRoomPage = lazy(() => import('./pages/StudyRoomPage'))

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

<Route path="/study" element={
  <ProtectedRoute>
    <Suspense fallback={<PageLoader label="Loading study room…" />}>
      <StudyRoomPage />
    </Suspense>
  </ProtectedRoute>
} />
```

- `lazy(() => import(...))` code-splits `StudyRoomPage`/`TodoPage`/`AnalyticsPage` into separate
  JS chunks (visible in `frontend/dist/assets/*.js`), only downloaded when the user actually
  navigates there — smaller initial bundle.
- `<Suspense fallback={...}>` shows a loading placeholder while the lazy chunk is fetched.
- `ProtectedRoute` is a simple **higher-order wrapper component**: it reads auth state from the
  Zustand store and redirects unauthenticated users to `/login` via `<Navigate replace />`
  (`replace` avoids polluting browser history with the bounce).
- The catch-all `<Route path="*" element={<Navigate to="/" replace />} />` handles unknown URLs.

## 3.6 API layer — axios + JWT interceptor (`services/api.js`)

```js
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
```

A single shared axios instance centralizes the base URL and content-type. The **request
interceptor** runs before every outgoing request, pulls the current JWT straight out of the
Zustand store (`useAuthStore.getState()` — reading state *outside* a React component/hook,
which Zustand explicitly supports), and injects the `Authorization: Bearer` header
automatically — every call site (`ChatPanel`, `LoginPage`) just does `api.post('/ai/chat',
{...})` with zero auth boilerplate.

## 3.7 Component composition & props patterns

`SoundMixer.jsx` renders one `<SoundSlider key={channel.key} channel={channel} />` per entry in
`SOUND_CHANNELS` (from `constants.js`) — a **data-driven list rendering** pattern: adding a 10th
ambient sound channel means editing one array in `constants.js`, not touching component code.
`ChatPanel` receives `onClose` as a prop from its parent (`FloatingOrb`, presumably) — a classic
"lift state up, pass callback down" pattern instead of the child managing its own visibility.

## 3.8 Framer Motion (animation)

Used throughout for entrance/exit transitions and micro-interactions, e.g. in `SoundMixer.jsx`:
```jsx
<AnimatePresence>
  {mixerOpen && (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    >
```
`motion.div` is a drop-in animated version of `div` — `initial`/`animate`/`exit` describe the
three animation states declaratively (no manual CSS class toggling or timing code).
`AnimatePresence` is required to animate elements *out* — React normally unmounts a conditionally
rendered element instantly; `AnimatePresence` delays the actual unmount until the `exit`
animation finishes. `PomodoroTimer` also uses `animate={{ scale: [1, 1.05, 1] }}` with `repeat:
Infinity` for the low-time pulsing warning effect.

## 3.9 Howler.js (audio)

```js
export function useHowlerSound(src, { volume = 0, muted = false, loop = true } = {}) {
  const howlRef = useRef(null)
  useEffect(() => {
    const howl = new Howl({ src: [src], loop, volume: 0, onloaderror: () => {} })
    howlRef.current = howl
    return () => { howlRef.current?.stop(); howlRef.current?.unload() }
  }, [src])
  useEffect(() => {
    const howl = howlRef.current
    if (!howl) return
    const effectiveVolume = muted ? 0 : volume
    howl.volume(effectiveVolume)
    if (effectiveVolume > 0 && !howl.playing(idRef.current)) idRef.current = howl.play()
    else if (effectiveVolume === 0 && howl.playing(idRef.current)) howl.pause(idRef.current)
  }, [volume, muted])
}
```
Howler wraps the raw `<audio>`/Web Audio API with a friendlier cross-browser API (looping,
sprites, fade, mobile unlock handling). Two separate `useEffect`s: one to create/destroy the
`Howl` instance only when `src` changes (expensive — loads a file), another to cheaply
start/pause/adjust volume whenever `volume`/`muted` change, without recreating the whole sound
object. `onloaderror`/`onplayerror` are handled as no-ops deliberately — per the README, no real
`.mp3` files ship yet, so the UI must degrade gracefully rather than crash. `playOneShot` is a
fire-and-forget helper used for the Pomodoro completion chime.

(Note: the project actually has *two* parallel audio systems — Howler-based `useHowlerSound`
and a raw Web Audio `useProceduralAudio`/`audioEngine.js` — worth mentioning if asked "what
would you consolidate.")

## 3.10 Tailwind CSS v4

Utility classes compose all styling directly in JSX (`className="glass rounded-2xl p-4 flex
items-center gap-4 shadow-2xl"`) rather than separate CSS files/CSS-in-JS. Custom design tokens
(`bg-walnut-950`, `text-offwhite`, `text-coral-500`, `bg-accent-blue`) are theme colors defined
via Tailwind v4's new CSS-first `@theme` configuration (in `index.css`), not a `tailwind.config.js`
(v4's biggest workflow change from v3). `glass` is a custom utility class (likely
`backdrop-blur` + translucent background) reused everywhere for the frosted-glass panel look.

## 3.11 Core JavaScript concepts appearing in this codebase

- **Arrow functions** everywhere (`(set) => ({...})`, `.map((t) => ...)`)  — lexically bind
  `this` (irrelevant here since there's no `this` usage, but crucial for callback contexts) and
  are more concise than `function` expressions.
- **Destructuring** — `const { mode, secondsLeft, ... } = useSessionStore()` (object), `const
  [moved] = todos.splice(fromIdx, 1)` (array).
- **Spread/rest** — `{ ...state.channels, [key]: {...} }` (immutable object update pattern used
  throughout every Zustand store), `[...state.todos, newTodo]` (immutable array append).
- **Template literals** — `` `Bearer ${token}` ``, `` `pomodoro:active:user:${userId}` `` (Java
  side) equivalent pattern.
- **Modules (`import`/`export`)** — every file is an ES module; `export default function App()`
  (default export) vs `export function useHowlerSound(...)` (named export) — both patterns used
  side by side in this codebase.
- **`async`/`await` + Promises** — every API call:
  ```js
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/auth/login', { email, password })
      ...
    } catch { setError('Login failed...') } finally { setLoading(false) }
  }
  ```
  `axios.post()` returns a Promise; `await` pauses the async function until it resolves/rejects
  without blocking the JS thread — this is what keeps the UI responsive during the network
  round-trip. `try/catch/finally` handles both success and failure paths, always resetting
  `loading` in `finally`.
- **Closures** — `useIdleDetection`'s `resetTimer` closes over `timerRef` and `setIsIdle` from
  its enclosing scope, and keeps referencing the *current* `timerRef.current` across multiple
  event firings because refs are stable across renders.
- **Array methods** — `.map()` (rendering lists → elements, transforming DTOs), `.filter()`
  (`todos.filter((t) => t.done)`), `.reduce()` (`SOUND_CHANNELS.reduce((acc, ch) => {...},
  {})` building the default channel map), `.find`/`.findIndex` (`reorderTodos`).
- **Event loop basics** — `setInterval`/`setTimeout` (Pomodoro tick, idle-detection debounce)
  are macrotasks scheduled via the browser's timer APIs; Promise `.then`/`await` continuations
  are microtasks that run before the next macrotask — relevant if asked "why does state update
  from a `fetch` resolve before the next `setInterval` tick even if scheduled earlier."

## 3.12 Common React/JS interview Q&A (tied to this codebase)

**Q: Why does `PomodoroTimer`'s `useEffect` return a cleanup function?** Without
`return () => clearInterval(interval)`, every re-render (e.g. when `tick` identity changes,
though here it's stable from Zustand) would register a *new* interval without canceling the old
one, causing the countdown to accelerate — a very common real bug.

**Q: What's the risk of `useRef` vs `useState` for `prevSecondsRef`?** Using `useState` would
work but trigger an extra re-render every second purely to track "previous value," wasted work
since the ref's value isn't rendered.

**Q: How does `persist` middleware differ from calling `localStorage.setItem` manually?** It
handles JSON serialization/deserialization, rehydration on load (merging persisted state back
into the store before first render), and can be swapped to a different storage backend
(sessionStorage, IndexedDB) via config — versus hand-rolling `useEffect(() =>
localStorage.setItem(...), [state])` everywhere.

**Q: Why is `sessionStore` (the live timer) *not* wrapped in `persist` while `sidebarStore` is?**
A running countdown resuming stale after a refresh (e.g. showing 3 seconds left from 10 minutes
ago) is bad UX; todos/notes/streak are meant to survive refreshes.

**Q: What does `lazy()` + `Suspense` buy you here?** Route-based code splitting — the login
page's JS bundle doesn't need to include the whole `StudyRoomPage` (with Framer Motion, Howler,
the library scene) until the user actually navigates past auth.

**Q: How would you avoid prop drilling in this app?** It largely already does, via Zustand
stores acting as global state accessible from any component without threading props down
(`useUiStore`, `useSidebarStore` are called directly inside `Sidebar`, `Navbar`, page components).

---

# PART 4 — Full-stack integration

## Frontend ⇄ Backend

- **REST**: axios (`services/api.js`) → nginx `/api/` → Spring Boot `/api/**` controllers.
- **WebSocket**: (wired on the backend, `/ws` STOMP endpoint; frontend `VITE_WS_URL` env var is
  reserved for a STOMP client, though the current frontend doesn't yet wire it up — the Pomodoro
  timer runs purely client-side via `setInterval`).
- **CORS**: `CorsConfig.allowedOrigin` defaults to `http://localhost:5173` (Vite dev server) but
  is overridden to `http://localhost:8081` inside `docker-compose.yml` (matching nginx's exposed
  port) via the `FRONTEND_ORIGIN` env var — same code, different config per environment.
- **JWT lifecycle**: token issued by `/api/auth/login|register` → stored in `authStore`
  (`persist` → `localStorage`) → attached to every outgoing request by the axios interceptor →
  validated per-request by `JwtAuthFilter` (stateless — no server-side session/refresh-token
  mechanism in this codebase; the token simply expires after `jwt.expiration-ms`, default 24h).
- **Environment variables**: backend reads `DB_URL`/`REDIS_HOST`/`JWT_SECRET`/`OPENAI_API_KEY`/
  `FRONTEND_ORIGIN` from the OS environment (`application.yml` placeholders); frontend reads
  build-time `VITE_API_URL`/`VITE_WS_URL` baked into the bundle at `vite build` time (note:
  unlike backend env vars, changing these requires a rebuild, not just a container restart).
- **Docker Compose wiring** (`docker-compose.yml`): `postgres` and `redis` have `healthcheck`s;
  `backend` uses `depends_on: condition: service_healthy` so it doesn't start connecting to a DB
  that isn't ready yet. `frontend` is built with `VITE_API_URL=/api` (relative path — resolved
  against whatever host serves the page, i.e. nginx) rather than an absolute `localhost:8080`,
  making the built static bundle portable across environments.
- **Nginx reverse proxy** (`nginx/nginx.conf`) is the single entry point on port 8081: `/` →
  frontend's own nginx container (serving the built static SPA), `/api/` → backend:8080,
  `/ws` → backend:8080 with `Upgrade`/`Connection` headers set (required to upgrade an HTTP
  connection to a WebSocket connection), `/swagger-ui/` and `/v3/api-docs` → backend, so Swagger
  works even through the proxy.

---

# PART 5 — Rapid-fire Interview Q&A Cheat Sheet

1. **What layers make up this backend, and why separate them?** controller → service →
   repository → entity, plus dto/ for the wire format — separation of HTTP concerns, business
   logic, and persistence so each can change independently (e.g. swap Postgres without touching
   controllers).
2. **How is a password never stored or compared in plaintext?** `BCryptPasswordEncoder.encode()`
   on registration (`AuthService.register`), `.matches()` on login — one-way adaptive hash.
3. **What makes this API "stateless"?** `SessionCreationPolicy.STATELESS` in `SecurityConfig` —
   no server session; every request authenticates itself via the JWT header.
4. **What happens if a JWT is expired?** `JwtService.validateToken` returns false →
   `JwtAuthFilter` leaves the request unauthenticated → `anyRequest().authenticated()` in
   `SecurityConfig` rejects it with 403.
5. **Why constructor injection (`@RequiredArgsConstructor`) over field `@Autowired`?**
   Immutability, explicit dependencies, easier unit testing without a Spring context.
6. **How does Spring Data JPA generate queries from method names?**
   `findByUserIdAndCompletedTrueAndCompletedAtBetween` is parsed at startup into a JPQL query by
   convention — no manual SQL.
7. **`ddl-auto: update` vs Flyway — when would you use each?** `update` for fast local dev
   iteration; Flyway (`V1__init_schema.sql`) for versioned, reviewable, production-safe schema
   changes with `ddl-auto: validate`.
8. **Why is `@ManyToOne` fetch set to `LAZY` here?** Avoid loading the full `User` row every
   time a `PomodoroSession`/`Note`/`Flashcard` is fetched, unless `.getUser()` is actually
   called — performance.
9. **What's `@Transactional` actually doing under the hood?** AOP proxy wraps the method;
   begins a transaction on entry, commits on normal return, rolls back on unchecked exception.
10. **Why is Redis used alongside Postgres instead of just one DB?** Redis for fast, ephemeral,
    TTL'd "live state" (active Pomodoro session); Postgres for durable relational history —
    different access patterns, different tools.
11. **Explain STOMP over raw WebSocket.** Adds destination-based pub/sub semantics
    (`/topic/...`, `/app/...`) on top of the WebSocket transport so Spring can route messages to
    `@MessageMapping` methods like HTTP routes.
12. **How does the AI service swap between stub and real OpenAI without code changes elsewhere?**
    Strategy pattern via the `AiService` interface; `@ConditionalOnProperty` on `OpenAiService` +
    `@Primary` on `StubAiService` let Spring's DI pick the implementation based on config alone.
13. **How is validation centralized?** `@Valid` + Bean Validation annotations on DTOs
    (`@NotBlank`, `@Email`, `@Size`) + `GlobalExceptionHandler.handleValidation` turning
    `MethodArgumentNotValidException` into a consistent field-error JSON payload.
14. **Why `@RestControllerAdvice` instead of try/catch in every controller?** DRY, centralizes
    exception→HTTP-status mapping in one file, keeps controllers focused on the happy path.
15. **What's the purpose of DTOs vs. returning entities directly?** Decouple the wire format
    from persistence internals (lazy proxies, unwanted fields like password hashes), and allow
    entity refactors without breaking API consumers.
16. **Why UUIDs instead of auto-increment IDs for primary keys?** Non-enumerable/non-guessable,
    safe to generate client-side, no collision across distributed inserts.
17. **How does CORS differ from JWT auth — what problem does each solve?** CORS is a
    browser-enforced cross-origin *access* restriction (server opts in an origin); JWT is
    *authentication* (proves who's calling), completely independent concerns.
18. **How would you add role-based authorization to this app?** Add a `roles` field to `User`,
    populate real `GrantedAuthority`s in `CustomUserDetailsService` (currently
    `Collections.emptyList()`), then use `.requestMatchers(...).hasRole("ADMIN")` in
    `SecurityConfig`.
19. **What's a functional component, and why do modern React apps avoid classes?** A plain JS
    function returning JSX; hooks (`useState`, `useEffect`, etc.) give it state/lifecycle
    without the `this`-binding boilerplate and verbosity of class components.
20. **Why does `useEffect`'s cleanup function matter for the Pomodoro interval?** Prevents
    interval leaks/duplication across re-renders and on unmount — a very common bug source.
21. **`useState` vs `useRef` — when do you pick one over the other?** `useState` when the value
    affects what's rendered (triggers re-render); `useRef` for values that need to persist across
    renders without causing one (e.g. `prevSecondsRef`, timer handles).
22. **How does Zustand avoid unnecessary re-renders compared to React Context?** Selector-based
    subscriptions (`useStore((s) => s.slice)`) only re-render on that slice's change; naive
    Context re-renders every consumer on any Provider value change.
23. **What does the `persist` Zustand middleware do, concretely?** Serializes store state to
    `localStorage` on every change and rehydrates it before first render, keyed by the `name`
    option (`'auth-storage'`, `'sidebar-storage'`, `'sound-storage'`).
24. **How does the JWT get attached to every API call without repeating code?** An axios request
    interceptor (`services/api.js`) reads the token from `useAuthStore.getState()` and injects
    the `Authorization` header for every outgoing request.
25. **Why is `sessionStore` not persisted while `sidebarStore` is?** A live countdown shouldn't
    resume stale after a refresh; historical data (todos, streak, notes) should.
26. **What is route-based code splitting, and where is it used here?** `lazy(() =>
    import('./pages/StudyRoomPage'))` + `<Suspense>` — defers downloading a page's JS bundle
    until navigation, visible as separate chunks in `frontend/dist/assets/`.
27. **Explain `ProtectedRoute`.** A wrapper component reading `token` from `authStore`; renders
    `<Navigate to="/login" />` if absent, otherwise renders its children — a common
    auth-guard pattern in React Router.
28. **What's the difference between `AnimatePresence`'s `exit` and just conditionally rendering
    an element?** Conditional rendering unmounts instantly; `AnimatePresence` delays the actual
    DOM removal until the `exit` animation finishes, enabling smooth exit transitions.
29. **Why must `AudioContext`/Howler playback be triggered from a user gesture?** Browsers block
    autoplay of audio without prior user interaction (a UX/anti-annoyance policy) — hence
    `startAudioEngine()` is called from the mixer toggle's click handler.
30. **What's a controlled input, and where do you see it?** An `<input value={state}
    onChange={...}>` whose displayed value is fully driven by React state — used throughout
    (`LoginPage`, `TodoList`, `PomodoroTimer` settings) so the component is the single source of
    truth for form values.
31. **Explain the request→response flow for the AI chat feature end-to-end.** `ChatPanel` calls
    `api.post('/ai/chat', {message})` → axios attaches JWT → nginx → `AiController.chat()` →
    (currently) `StubAiService.chat()` returns a canned `ChatResponse` → serialized JSON → axios
    resolves → `setMessages` appends the assistant reply → React re-renders the message list.
32. **What would break if `OPENAI_API_KEY` were set but `OpenAiService`'s methods were still
    TODO-stubbed?** `@ConditionalOnProperty` would register `OpenAiService`, but `@Primary` is
    only on `StubAiService` — Spring would then have *two* non-primary `AiService` beans and
    fail to start with an ambiguous-bean error, unless `OpenAiService` is also marked `@Primary`
    or `@Qualifier`-disambiguated. (Genuine subtlety worth flagging as a known gap.)
33. **How does the day/night background know what gradient to show?**
    `useDayNightGradient` reads `new Date().getHours()`, maps it to one of 5 named periods via
    plain `if` range checks, and re-checks every 60 seconds via `setInterval` inside `useEffect`.
34. **Why does `useHowlerSound` split creation and volume-sync into two separate `useEffect`s?**
    Creating a `Howl` (loading an audio file) is expensive and should only happen when `src`
    changes; adjusting volume/play/pause should be cheap and run on every `volume`/`muted` change
    without re-fetching the file.
35. **What is optimistic/local-first state in this app, and where does it show up?** Todos,
    notes, flashcards, and streak all live entirely in `sidebarStore` (client-only, persisted to
    `localStorage`) — no backend round-trip at all for these features currently, despite the
    backend having `NotesController`/`FlashcardController` REST endpoints ready to be wired in.
36. **System design: how would you scale the WebSocket Pomodoro sync to multiple backend
    instances?** The current in-memory STOMP broker (`enableSimpleBroker`) only broadcasts within
    one JVM; scaling horizontally would require an external message broker (e.g. RabbitMQ/Redis
    pub-sub) as the STOMP relay so messages fan out across all backend instances.
37. **Why `open-in-view: false` combined with DTO mapping inside services?** Forces all lazy
    entity access to happen inside the transactional service method (before the transaction/
    Hibernate session closes), converting to DTOs there — avoids `LazyInitializationException`
    in the web layer and keeps a clean boundary.
38. **What's the purpose of the `V1__init_schema.sql` file if Flyway is disabled?** Serves as
    living documentation of the intended production schema and a ready-to-enable migration path
    — a common "we know how we'd productionize this" signal in a portfolio project.
39. **How would you add pagination to `GET /api/pomodoro/history`?** Add `Pageable` parameter to
    the repository method (Spring Data supports this natively — `findByUserIdOrderByStartedAtDesc(UUID
    userId, Pageable pageable)` returning `Page<PomodoroSession>`), accept `page`/`size` query
    params in the controller.
40. **Biggest architectural risk in this codebase to flag in an interview?** `OpenAiService`
    being unimplemented (TODO stubs) plus the `@Primary`/`@ConditionalOnProperty` bean-selection
    ambiguity noted above — a good example of spotting a subtle DI configuration bug purely from
    reading code, which is exactly the kind of thing interviewers want to see you catch.
</content>


1. Inspected the screenshot — confirmed pgAdmin tree showed public schema → Tables node expanded but empty.
2. Searched the repo for schema/migration setup — found:
  - backend/src/main/resources/db/migration/V1__init_schema.sql (Flyway migration, but disabled)
  - backend/src/main/resources/application.yml — showed spring.flyway.enabled: false and spring.jpa.hibernate.ddl-auto: update, meaning schema creation is Hibernate's job at app startup, not Flyway.
3. Found the DB target: application.yml pointed to jdbc:postgresql://localhost:5433/study_simulation — non-default port 5433.
4. Checked if anything was listening on 5433 — nothing was. Root cause candidate #1: Postgres wasn't running.
5. Found docker-compose.dev.yml — this is what maps Postgres to host port 5433 for local dev (docker-compose.yml alone uses internal Docker networking, not exposed to host).
6. Tried to start containers — Docker Desktop wasn't running, so docker compose up failed. User started Docker Desktop manually.
7. User started containers and the Spring Boot backend manually (per given commands: docker compose -f docker-compose.dev.yml up -d, then mvnw.cmd spring-boot:run).
8. Verified port 5433 was now listening, and containers were up (docker ps), including an active connection pool from the backend app.
9. Bypassed pgAdmin entirely and checked ground truth with psql inside the container:
docker exec study-simulation-postgres-1 psql -U postgres -d study_simulation -c "\dt"
9. → All 5 tables existed: users, pomodoro_sessions, study_notes, flashcards, analytics_snapshots.
10. This proved the backend + Hibernate ddl-auto: update had worked correctly — the problem was purely in how pgAdmin was displaying state, not the database itself.
11. Inspected pgAdmin's server connection Properties (db_info.png) — confirmed Host: localhost, Port: 5433 were correct. But the tree behind the dialog showed extra testdb database entries.
12. Cross-checked with psql -l (list all databases on that Postgres instance) — only postgres, study_simulation, template0, template1 existed. No testdb. This confirmed pgAdmin's tree was stale/incorrect — it was showing databases that didn't exist on the live server.
13. Fix applied: Fully disconnect and reconnect the pgAdmin server (not just "Refresh", which only reloads the object tree under an already-open connection, not the top-level database list/session state).
14. Result: After reconnecting, pgAdmin correctly displayed the real database list, and the tables appeared under study_simulation → public → Tables.

Key lesson

When a DB tool (pgAdmin, DBeaver, etc.) shows unexpected/empty state, verify against the database directly (psql, docker exec) before assuming the app/backend/schema is broken — GUI clients often cache stale connection/session state that a simple refresh doesn't clear.
