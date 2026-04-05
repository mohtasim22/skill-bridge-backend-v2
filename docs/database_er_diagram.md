# SkillBridge Database ER Diagram

Here is a visual map of the database schema generated via Mermaid. It maps out your core `User` model integrating seamlessly with Better Auth, connecting through the complex `TutorProfile` into `Courses`, `CourseSlots`, `Bookings`, and `Reviews`.

```mermaid
erDiagram
    %% Core Domain Models
    User {
        String id PK
        Role role "STUDENT | TUTOR | ADMIN"
        String name
        String email
        String password
        UserStatus status
    }

    TutorProfile {
        String id PK
        String display_name
        String bio
        String qualification
        Float hourly_rate
        Float rating_avg
        Int total_reviews
        Boolean is_verified
    }

    Course {
        String id PK
        String name
        String description
        CourseStatus status
    }

    CourseSlot {
        String id PK
        String name
        DateTime start_time
        DateTime end_time
        DateTime date
    }

    Booking {
        String id PK
        BookingStatus booking_status
        PaymentStatus payment_status
        Float total_price
        String transaction_id "Stripe ID"
    }

    Review {
        String id PK
        Int rating "1-5"
        String comment
        ReviewStatus status
    }

    %% Better Auth System Models
    Session {
        String id PK
        DateTime expiresAt
        String token
    }
    Account {
        String id PK
        String providerId
    }

    %% Relationships
    User ||--o{ Session : "authenticates via"
    User ||--o{ Account : "linked to"

    %% Business Logic Raltionships
    User ||--o| TutorProfile : "acts as (if TUTOR)"
    User ||--o{ Booking : "books (as student)"
    User ||--o{ Review : "writes review"

    TutorProfile ||--o{ Course : "teaches"
    TutorProfile ||--o{ CourseSlot : "sets availability"
    TutorProfile ||--o{ Booking : "receives bookings"
    TutorProfile ||--o{ Review : "is reviewed"

    Course ||--o{ CourseSlot : "contains slots"
    
    CourseSlot ||--o{ Booking : "is booked"

    Booking ||--o| Review : "has exactly 1"

```

> [!TIP]
> **Understanding the Arrows:**
> - `||--o{` means **One-to-Many** (e.g., One User has Many Bookings)
> - `||--o|` means **One-to-One** (e.g., One User has exactly One Tutor Profile, One Booking has exactly One Review)
