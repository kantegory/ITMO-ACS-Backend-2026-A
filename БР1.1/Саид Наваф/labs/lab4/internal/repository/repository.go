package repository

import "github.com/jackc/pgx/v5/pgxpool"

type Repositories struct {
Users        *UsersRepo
Vacancies    *VacanciesRepo
Resumes      *ResumesRepo
Applications *ApplicationsRepo
Categories   *CategoriesRepo
}

func NewRepositories(db *pgxpool.Pool) *Repositories {
return &Repositories{
Users:        NewUsersRepo(db),
Vacancies:    NewVacanciesRepo(db),
Resumes:      NewResumesRepo(db),
Applications: NewApplicationsRepo(db),
Categories:   NewCategoriesRepo(db),
}
}
