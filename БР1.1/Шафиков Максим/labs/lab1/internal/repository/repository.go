package repository

import "github.com/jackc/pgx/v5/pgxpool"

type Repositories struct {
	Users        *UsersRepo
	Companies    *CompaniesRepo
	Resumes      *ResumesRepo
	Vacancies    *VacanciesRepo
	Applications *ApplicationsRepo
	Dictionaries *DictionariesRepo
}

func New(pool *pgxpool.Pool) *Repositories {
	return &Repositories{
		Users:        &UsersRepo{pool: pool},
		Companies:    &CompaniesRepo{pool: pool},
		Resumes:      &ResumesRepo{pool: pool},
		Vacancies:    &VacanciesRepo{pool: pool},
		Applications: &ApplicationsRepo{pool: pool},
		Dictionaries: &DictionariesRepo{pool: pool},
	}
}
