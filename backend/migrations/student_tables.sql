CREATE TABLE if NOT EXISTS students (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL,
	email TEXT,
	status TEXT NOT NULL DEFAULT 'On Track',
	current_intervention_id UUID NULL,
	created_at TIMESTAMPTZ DEFAULT now(),
	updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE if NOT EXISTS daily_logs (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	student_id UUID REFERENCES students(id) ON DELETE CASCADE,
	quiz_score INT NOT NULL,
	focus_minutes INT NOT NULL,
	created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE if NOT EXISTS interventions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	student_id UUID REFERENCES students(id) ON DELETE CASCADE,
	task TEXT NOT NULL,
	assigned_by TEXT,
	assigned_at TIMESTAMPTZ DEFAULT now(),
	completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ NULL
);

