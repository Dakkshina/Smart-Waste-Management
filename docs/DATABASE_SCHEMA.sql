-- ============================================================
-- Smart Waste Management System — Database Schema
-- Phase 1 | PostgreSQL
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE 1: users (base for all roles)
-- ============================================================
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name     VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  UNIQUE NOT NULL,
    phone         VARCHAR(15)   UNIQUE NOT NULL,
    password_hash TEXT          NOT NULL,
    role          VARCHAR(20)   NOT NULL CHECK (role IN ('admin','collector','household','warehouse','authority')),
    is_active     BOOLEAN       DEFAULT TRUE,
    created_at    TIMESTAMP     DEFAULT NOW(),
    updated_at    TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: role_permissions
-- ============================================================
CREATE TABLE role_permissions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role        VARCHAR(20)  NOT NULL,
    module      VARCHAR(50)  NOT NULL,
    can_read    BOOLEAN      DEFAULT FALSE,
    can_write   BOOLEAN      DEFAULT FALSE,
    can_delete  BOOLEAN      DEFAULT FALSE,
    created_at  TIMESTAMP    DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: collectors
-- ============================================================
CREATE TABLE collectors (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_id     VARCHAR(20)  UNIQUE NOT NULL,
    zone_assigned   VARCHAR(100),
    joining_date    DATE,
    base_salary     NUMERIC(10,2) DEFAULT 12000.00,
    id_proof_url    TEXT,
    photo_url       TEXT,
    is_on_duty      BOOLEAN      DEFAULT FALSE,
    created_at      TIMESTAMP    DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: residents (households)
-- ============================================================
CREATE TABLE residents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    house_number    VARCHAR(30)  NOT NULL,
    street          VARCHAR(150),
    ward            VARCHAR(100),
    city            VARCHAR(100),
    pincode         VARCHAR(10),
    latitude        NUMERIC(10,7),
    longitude       NUMERIC(10,7),
    qr_code_token   VARCHAR(200) UNIQUE,
    nfc_token       VARCHAR(200) UNIQUE,
    created_at      TIMESTAMP    DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: vehicles
-- ============================================================
CREATE TABLE vehicles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_code    VARCHAR(20)  UNIQUE NOT NULL,
    plate_number    VARCHAR(20)  UNIQUE NOT NULL,
    type            VARCHAR(30)  CHECK (type IN ('truck','auto','tricycle','van')),
    capacity_kg     NUMERIC(8,2),
    fuel_type       VARCHAR(20),
    gps_device_id   VARCHAR(50)  UNIQUE,
    is_active       BOOLEAN      DEFAULT TRUE,
    assigned_to     UUID         REFERENCES collectors(id),
    created_at      TIMESTAMP    DEFAULT NOW()
);

-- ============================================================
-- TABLE 6: routes
-- ============================================================
CREATE TABLE routes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_name      VARCHAR(100) NOT NULL,
    zone            VARCHAR(100),
    total_houses    INT          DEFAULT 0,
    estimated_km    NUMERIC(6,2),
    assigned_collector UUID     REFERENCES collectors(id),
    assigned_vehicle   UUID     REFERENCES vehicles(id),
    schedule_day    VARCHAR(10)  CHECK (schedule_day IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
    is_active       BOOLEAN      DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT NOW()
);

-- ============================================================
-- TABLE 7: houses (houses on a route)
-- ============================================================
CREATE TABLE houses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id     UUID REFERENCES residents(id) ON DELETE CASCADE,
    route_id        UUID REFERENCES routes(id),
    sequence_order  INT,
    latitude        NUMERIC(10,7),
    longitude       NUMERIC(10,7),
    qr_code_token   VARCHAR(200),
    created_at      TIMESTAMP    DEFAULT NOW()
);

-- ============================================================
-- TABLE 8: gps_tracking
-- ============================================================
CREATE TABLE gps_tracking (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collector_id    UUID REFERENCES collectors(id) ON DELETE CASCADE,
    vehicle_id      UUID REFERENCES vehicles(id),
    latitude        NUMERIC(10,7) NOT NULL,
    longitude       NUMERIC(10,7) NOT NULL,
    speed_kmph      NUMERIC(5,2),
    heading_deg     NUMERIC(5,2),
    recorded_at     TIMESTAMP     DEFAULT NOW()
);
CREATE INDEX idx_gps_collector_time ON gps_tracking(collector_id, recorded_at DESC);

-- ============================================================
-- TABLE 9: waste_collections
-- ============================================================
CREATE TABLE waste_collections (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collector_id    UUID REFERENCES collectors(id),
    house_id        UUID REFERENCES houses(id),
    route_id        UUID REFERENCES routes(id),
    collection_date DATE          NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(20)   CHECK (status IN ('collected','not_available','skipped','pending')) DEFAULT 'pending',
    scanned_at      TIMESTAMP,
    completed_at    TIMESTAMP,
    photo_url       TEXT,
    ai_job_id       UUID,
    created_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 10: waste_images
-- ============================================================
CREATE TABLE waste_images (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id   UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
    s3_key          TEXT          NOT NULL,
    s3_url          TEXT          NOT NULL,
    file_size_kb    INT,
    uploaded_at     TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 11: ai_predictions
-- ============================================================
CREATE TABLE ai_predictions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id   UUID REFERENCES waste_collections(id) ON DELETE CASCADE,
    image_id        UUID REFERENCES waste_images(id),
    plastic_pct     NUMERIC(5,2)  DEFAULT 0,
    paper_pct       NUMERIC(5,2)  DEFAULT 0,
    metal_pct       NUMERIC(5,2)  DEFAULT 0,
    glass_pct       NUMERIC(5,2)  DEFAULT 0,
    organic_pct     NUMERIC(5,2)  DEFAULT 0,
    ewaste_pct      NUMERIC(5,2)  DEFAULT 0,
    mixed_waste     BOOLEAN       DEFAULT FALSE,
    confidence      NUMERIC(5,2),
    model_version   VARCHAR(20)   DEFAULT 'yolov8-v1',
    processed_at    TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 12: compliance_scores
-- ============================================================
CREATE TABLE compliance_scores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id     UUID REFERENCES residents(id) ON DELETE CASCADE,
    month           INT           CHECK (month BETWEEN 1 AND 12),
    year            INT,
    total_pickups   INT           DEFAULT 0,
    proper_seg_count INT          DEFAULT 0,
    compliance_pct  NUMERIC(5,2)  GENERATED ALWAYS AS (
                        CASE WHEN total_pickups = 0 THEN 0
                             ELSE (proper_seg_count::NUMERIC / total_pickups) * 100
                        END
                    ) STORED,
    updated_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 13: feedback
-- ============================================================
CREATE TABLE feedback (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id     UUID REFERENCES residents(id),
    collector_id    UUID REFERENCES collectors(id),
    collection_id   UUID REFERENCES waste_collections(id),
    behaviour_rating VARCHAR(10)   CHECK (behaviour_rating IN ('Excellent','Good','Average','Poor')),
    comments        TEXT,
    submitted_at    TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 14: ratings
-- ============================================================
CREATE TABLE ratings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collector_id    UUID REFERENCES collectors(id) ON DELETE CASCADE,
    rated_by        UUID REFERENCES users(id),
    stars           NUMERIC(2,1)  CHECK (stars BETWEEN 1.0 AND 5.0),
    month           INT,
    year            INT,
    created_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 15: complaints
-- ============================================================
CREATE TABLE complaints (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id     UUID REFERENCES residents(id),
    collector_id    UUID REFERENCES collectors(id),
    title           VARCHAR(200)  NOT NULL,
    description     TEXT,
    photo_url       TEXT,
    priority        VARCHAR(10)   CHECK (priority IN ('Low','Medium','High')) DEFAULT 'Medium',
    status          VARCHAR(20)   CHECK (status IN ('open','in_progress','resolved','closed')) DEFAULT 'open',
    assigned_to     UUID REFERENCES users(id),
    resolved_at     TIMESTAMP,
    created_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 16: attendance
-- ============================================================
CREATE TABLE attendance (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collector_id    UUID REFERENCES collectors(id) ON DELETE CASCADE,
    date            DATE          NOT NULL,
    check_in        TIMESTAMP,
    check_out       TIMESTAMP,
    status          VARCHAR(20)   CHECK (status IN ('present','absent','half_day','leave')) DEFAULT 'present',
    UNIQUE (collector_id, date)
);

-- ============================================================
-- TABLE 17: salary
-- ============================================================
CREATE TABLE salary (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collector_id        UUID REFERENCES collectors(id) ON DELETE CASCADE,
    month               INT           CHECK (month BETWEEN 1 AND 12),
    year                INT,
    base_salary         NUMERIC(10,2) DEFAULT 12000.00,
    collection_bonus    NUMERIC(10,2) DEFAULT 0,
    segregation_bonus   NUMERIC(10,2) DEFAULT 0,
    attendance_bonus    NUMERIC(10,2) DEFAULT 0,
    rating_bonus        NUMERIC(10,2) DEFAULT 0,
    timeliness_bonus    NUMERIC(10,2) DEFAULT 0,
    penalty             NUMERIC(10,2) DEFAULT 0,
    final_salary        NUMERIC(10,2) GENERATED ALWAYS AS (
                            base_salary + collection_bonus + segregation_bonus +
                            attendance_bonus + rating_bonus + timeliness_bonus - penalty
                        ) STORED,
    paid                BOOLEAN       DEFAULT FALSE,
    paid_on             DATE,
    UNIQUE (collector_id, month, year)
);

-- ============================================================
-- TABLE 18: payments
-- ============================================================
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salary_id       UUID REFERENCES salary(id),
    collector_id    UUID REFERENCES collectors(id),
    amount          NUMERIC(10,2) NOT NULL,
    method          VARCHAR(30)   CHECK (method IN ('bank_transfer','upi','cash')),
    transaction_id  VARCHAR(100),
    paid_at         TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 19: warehouse
-- ============================================================
CREATE TABLE warehouse (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id      UUID REFERENCES vehicles(id),
    arrival_date    DATE          NOT NULL,
    arrival_time    TIMESTAMP,
    plastic_kg      NUMERIC(8,2)  DEFAULT 0,
    paper_kg        NUMERIC(8,2)  DEFAULT 0,
    metal_kg        NUMERIC(8,2)  DEFAULT 0,
    glass_kg        NUMERIC(8,2)  DEFAULT 0,
    organic_kg      NUMERIC(8,2)  DEFAULT 0,
    ewaste_kg       NUMERIC(8,2)  DEFAULT 0,
    mixed_kg        NUMERIC(8,2)  DEFAULT 0,
    total_kg        NUMERIC(8,2)  GENERATED ALWAYS AS (
                        plastic_kg + paper_kg + metal_kg + glass_kg +
                        organic_kg + ewaste_kg + mixed_kg
                    ) STORED,
    recycled_kg     NUMERIC(8,2)  DEFAULT 0,
    landfill_kg     NUMERIC(8,2)  DEFAULT 0,
    revenue_inr     NUMERIC(10,2) DEFAULT 0,
    operator_id     UUID REFERENCES users(id),
    created_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 20: notifications
-- ============================================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200)  NOT NULL,
    body            TEXT,
    type            VARCHAR(50),
    is_read         BOOLEAN       DEFAULT FALSE,
    sent_at         TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 21: reports
-- ============================================================
CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type     VARCHAR(50)   CHECK (report_type IN ('collector','household','warehouse','total','ai_analytics')),
    generated_by    UUID REFERENCES users(id),
    period_from     DATE,
    period_to       DATE,
    data_json       JSONB,
    file_url        TEXT,
    created_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 22: analytics
-- ============================================================
CREATE TABLE analytics (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date            DATE          NOT NULL UNIQUE,
    total_houses    INT           DEFAULT 0,
    collected       INT           DEFAULT 0,
    not_available   INT           DEFAULT 0,
    collection_pct  NUMERIC(5,2),
    segregation_pct NUMERIC(5,2),
    total_waste_kg  NUMERIC(10,2) DEFAULT 0,
    plastic_kg      NUMERIC(10,2) DEFAULT 0,
    organic_kg      NUMERIC(10,2) DEFAULT 0,
    mixed_kg        NUMERIC(10,2) DEFAULT 0,
    top_collector   UUID REFERENCES collectors(id),
    complaints_count INT          DEFAULT 0,
    updated_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 23: collection_history
-- ============================================================
CREATE TABLE collection_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collector_id    UUID REFERENCES collectors(id),
    house_id        UUID REFERENCES houses(id),
    collected_on    DATE          NOT NULL,
    waste_kg        NUMERIC(6,2),
    segregation_ok  BOOLEAN,
    created_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 24: settings
-- ============================================================
CREATE TABLE settings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key             VARCHAR(100)  UNIQUE NOT NULL,
    value           TEXT,
    description     TEXT,
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TABLE 25: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(100)  NOT NULL,
    module          VARCHAR(50),
    record_id       UUID,
    old_value       JSONB,
    new_value       JSONB,
    ip_address      INET,
    user_agent      TEXT,
    logged_at       TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- SEED: Default Settings
-- ============================================================
INSERT INTO settings (key, value, description) VALUES
('BASE_SALARY',         '12000',  'Default monthly base salary for collectors (INR)'),
('COLLECTION_WEIGHT',   '0.30',   'Weight for collection score in wage formula'),
('SEGREGATION_WEIGHT',  '0.25',   'Weight for segregation score in wage formula'),
('ATTENDANCE_WEIGHT',   '0.20',   'Weight for attendance score in wage formula'),
('RATING_WEIGHT',       '0.15',   'Weight for citizen rating in wage formula'),
('TIMELINESS_WEIGHT',   '0.10',   'Weight for timeliness in wage formula'),
('GPS_UPDATE_INTERVAL', '5',      'GPS update interval in seconds'),
('AI_MODEL_VERSION',    'yolov8', 'Current AI model for waste detection'),
('MAX_COMPLAINT_DAYS',  '7',      'Days before complaint auto-escalates');

-- ============================================================
-- SEED: Default Role Permissions
-- ============================================================
INSERT INTO role_permissions (role, module, can_read, can_write, can_delete) VALUES
('admin',      'collectors',  TRUE, TRUE,  TRUE),
('admin',      'routes',      TRUE, TRUE,  TRUE),
('admin',      'vehicles',    TRUE, TRUE,  TRUE),
('admin',      'reports',     TRUE, TRUE,  FALSE),
('admin',      'salary',      TRUE, TRUE,  FALSE),
('admin',      'complaints',  TRUE, TRUE,  TRUE),
('collector',  'routes',      TRUE, FALSE, FALSE),
('collector',  'collections', TRUE, TRUE,  FALSE),
('collector',  'gps',         TRUE, TRUE,  FALSE),
('collector',  'salary',      TRUE, FALSE, FALSE),
('household',  'collections', TRUE, FALSE, FALSE),
('household',  'feedback',    TRUE, TRUE,  FALSE),
('household',  'complaints',  TRUE, TRUE,  FALSE),
('warehouse',  'warehouse',   TRUE, TRUE,  FALSE),
('warehouse',  'analytics',   TRUE, FALSE, FALSE),
('authority',  'reports',     TRUE, FALSE, FALSE),
('authority',  'analytics',   TRUE, FALSE, FALSE);
