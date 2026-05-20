package main

/* go run seed_test_data.go */

import (
	"context"
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"

	"job-search/internal/config"
	"job-search/internal/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type employerSeed struct {
	Email       string
	Password    string
	CompanyName string
	Description string
	Location    string
	Industry    string
	Vacancies   []vacancySeed
}

type vacancySeed struct {
	Title       string
	Description string
	SalaryMin   int
	SalaryMax   int
	Experience  string
	Format      string
	Skills      []string
}

type resumeSeed struct {
	FullName string
	Title    string
	Bio      string
	Skills   []string
}

func main() {
	cfg := config.Load()
	ctx := context.Background()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect db: %v", err)
	}
	defer pool.Close()

	if err := db.Migrate(ctx, pool); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	if err := seed(ctx, pool); err != nil {
		log.Fatalf("seed test data: %v", err)
	}
}

func seed(ctx context.Context, pool dbTxStarter) error {
	employers := []employerSeed{
		{
			Email:       "seed-lab1-employer-1@example.com",
			Password:    "Employer123!",
			CompanyName: "CloudLine",
			Description: "Разрабатываем backend-сервисы и платформенные решения",
			Location:    "Санкт-Петербург",
			Industry:    "Информационные технологии",
			Vacancies: []vacancySeed{
				{
					Title:       "Go Backend Developer",
					Description: "Разработка REST API, работа с PostgreSQL, контейнеризация",
					SalaryMin:   170000,
					SalaryMax:   240000,
					Experience:  "one_to_three",
					Format:      "hybrid",
					Skills:      []string{"Go", "PostgreSQL", "Docker"},
				},
				{
					Title:       "Platform Engineer",
					Description: "Сопровождение инфраструктуры и CI/CD",
					SalaryMin:   190000,
					SalaryMax:   270000,
					Experience:  "three_to_six",
					Format:      "remote",
					Skills:      []string{"Go", "Docker", "Kubernetes"},
				},
			},
		},
		{
			Email:       "seed-lab1-employer-2@example.com",
			Password:    "Employer123!",
			CompanyName: "DataPulse",
			Description: "Команда аналитики и дата-продуктов",
			Location:    "Москва",
			Industry:    "Финансы",
			Vacancies: []vacancySeed{
				{
					Title:       "Python Data Engineer",
					Description: "Пайплайны обработки данных и интеграции",
					SalaryMin:   160000,
					SalaryMax:   230000,
					Experience:  "one_to_three",
					Format:      "office",
					Skills:      []string{"Python", "PostgreSQL", "Docker"},
				},
				{
					Title:       "Frontend Developer",
					Description: "Развитие пользовательских интерфейсов",
					SalaryMin:   140000,
					SalaryMax:   210000,
					Experience:  "one_to_three",
					Format:      "hybrid",
					Skills:      []string{"JavaScript", "TypeScript", "React"},
				},
				{
					Title:       "Fullstack TypeScript Engineer",
					Description: "Разработка фронта и API на TypeScript",
					SalaryMin:   180000,
					SalaryMax:   250000,
					Experience:  "three_to_six",
					Format:      "remote",
					Skills:      []string{"TypeScript", "React", "PostgreSQL"},
				},
			},
		},
		{
			Email:       "seed-lab1-employer-3@example.com",
			Password:    "Employer123!",
			CompanyName: "SmartFactory",
			Description: "Автоматизация производственных процессов",
			Location:    "Казань",
			Industry:    "Производство",
			Vacancies: []vacancySeed{
				{
					Title:       "Java Developer",
					Description: "Поддержка корпоративных сервисов",
					SalaryMin:   150000,
					SalaryMax:   220000,
					Experience:  "one_to_three",
					Format:      "office",
					Skills:      []string{"Java", "PostgreSQL", "Docker"},
				},
			},
		},
	}

	testCandidateEmail := "seed-lab1-candidate@example.com"
	testCandidatePassword := "Candidate123!"

	resumes := []resumeSeed{
		{
			FullName: "Алексей Смирнов",
			Title:    "Backend Go Developer",
			Bio:      "Разрабатываю API на Go, работаю с PostgreSQL и Docker",
			Skills:   []string{"Go", "PostgreSQL", "Docker"},
		},
		{
			FullName: "Алексей Смирнов",
			Title:    "Frontend Developer",
			Bio:      "Создаю SPA на React/TypeScript",
			Skills:   []string{"JavaScript", "TypeScript", "React"},
		},
		{
			FullName: "Алексей Смирнов",
			Title:    "Data Engineer",
			Bio:      "Пишу ETL и аналитические сервисы на Python",
			Skills:   []string{"Python", "PostgreSQL", "Docker"},
		},
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM users WHERE email LIKE 'seed-lab1-%@example.com'`); err != nil {
		return fmt.Errorf("cleanup old seed users: %w", err)
	}

	industryIDs, err := loadIndustryIDs(ctx, tx, []string{
		"Информационные технологии",
		"Финансы",
		"Производство",
	})
	if err != nil {
		return err
	}

	skillIDs, err := loadSkillIDs(ctx, tx, []string{
		"Go", "Python", "Java", "JavaScript", "TypeScript", "PostgreSQL", "Docker", "Kubernetes", "React",
	})
	if err != nil {
		return err
	}

	for _, employer := range employers {
		employerHash, err := bcrypt.GenerateFromPassword([]byte(employer.Password), 12)
		if err != nil {
			return fmt.Errorf("hash employer password: %w", err)
		}

		var employerUserID uuid.UUID
		err = tx.QueryRow(ctx,
			`INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'employer') RETURNING id`,
			employer.Email, string(employerHash),
		).Scan(&employerUserID)
		if err != nil {
			return fmt.Errorf("create employer user %s: %w", employer.Email, err)
		}

		industryID, ok := industryIDs[employer.Industry]
		if !ok {
			return fmt.Errorf("industry %q not found", employer.Industry)
		}

		var companyID uuid.UUID
		err = tx.QueryRow(ctx,
			`INSERT INTO companies (user_id, industry_id, name, description, location)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING id`,
			employerUserID,
			industryID,
			employer.CompanyName,
			employer.Description,
			employer.Location,
		).Scan(&companyID)
		if err != nil {
			return fmt.Errorf("create company %s: %w", employer.CompanyName, err)
		}

		for _, vacancy := range employer.Vacancies {
			var vacancyID uuid.UUID
			err = tx.QueryRow(ctx,
				`INSERT INTO vacancies (
					company_id, industry_id, currency_code, title, description,
					salary_min, salary_max, experience_level, format, status
				 ) VALUES ($1, $2, 'RUB', $3, $4, $5, $6, $7, $8, 'active')
				 RETURNING id`,
				companyID,
				industryID,
				vacancy.Title,
				vacancy.Description,
				vacancy.SalaryMin,
				vacancy.SalaryMax,
				vacancy.Experience,
				vacancy.Format,
			).Scan(&vacancyID)
			if err != nil {
				return fmt.Errorf("create vacancy %s: %w", vacancy.Title, err)
			}

			for _, skill := range vacancy.Skills {
				skillID, ok := skillIDs[skill]
				if !ok {
					return fmt.Errorf("skill %q not found", skill)
				}
				if _, err := tx.Exec(ctx,
					`INSERT INTO vacancy_skills (vacancy_id, skill_id) VALUES ($1, $2)`,
					vacancyID,
					skillID,
				); err != nil {
					return fmt.Errorf("add vacancy skill %s -> %s: %w", vacancy.Title, skill, err)
				}
			}
		}
	}

	candidateHash, err := bcrypt.GenerateFromPassword([]byte(testCandidatePassword), 12)
	if err != nil {
		return fmt.Errorf("hash candidate password: %w", err)
	}

	var candidateUserID uuid.UUID
	err = tx.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'candidate') RETURNING id`,
		testCandidateEmail,
		string(candidateHash),
	).Scan(&candidateUserID)
	if err != nil {
		return fmt.Errorf("create candidate: %w", err)
	}

	for _, resume := range resumes {
		var resumeID uuid.UUID
		err = tx.QueryRow(ctx,
			`INSERT INTO resumes (user_id, full_name, title, bio) VALUES ($1, $2, $3, $4) RETURNING id`,
			candidateUserID,
			resume.FullName,
			resume.Title,
			resume.Bio,
		).Scan(&resumeID)
		if err != nil {
			return fmt.Errorf("create resume %s: %w", resume.Title, err)
		}

		for _, skill := range resume.Skills {
			skillID, ok := skillIDs[skill]
			if !ok {
				return fmt.Errorf("skill %q not found", skill)
			}
			if _, err := tx.Exec(ctx,
				`INSERT INTO resume_skills (resume_id, skill_id) VALUES ($1, $2)`,
				resumeID,
				skillID,
			); err != nil {
				return fmt.Errorf("add resume skill %s -> %s: %w", resume.Title, skill, err)
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}

	fmt.Println("Test data created successfully.")
	fmt.Printf("Candidate login: %s\n", testCandidateEmail)
	fmt.Printf("Candidate password: %s\n", testCandidatePassword)
	fmt.Println("Re-run is safe: previous seed-lab1 users are removed before insert.")

	return nil
}

type dbTxStarter interface {
	Begin(ctx context.Context) (pgx.Tx, error)
}

func loadIndustryIDs(ctx context.Context, tx pgx.Tx, names []string) (map[string]uuid.UUID, error) {
	ids := make(map[string]uuid.UUID, len(names))
	for _, name := range names {
		var id uuid.UUID
		err := tx.QueryRow(ctx, `SELECT id FROM industries WHERE name = $1`, name).Scan(&id)
		if err != nil {
			return nil, fmt.Errorf("load industry %s: %w", name, err)
		}
		ids[name] = id
	}
	return ids, nil
}

func loadSkillIDs(ctx context.Context, tx pgx.Tx, names []string) (map[string]uuid.UUID, error) {
	ids := make(map[string]uuid.UUID, len(names))
	for _, name := range names {
		var id uuid.UUID
		err := tx.QueryRow(ctx, `SELECT id FROM skills WHERE name = $1`, name).Scan(&id)
		if err != nil {
			return nil, fmt.Errorf("load skill %s: %w", name, err)
		}
		ids[name] = id
	}
	return ids, nil
}
