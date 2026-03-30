import "@typespec/http";

using TypeSpec.Http;
using JobSearchAPI;

@route("/vacancies")
namespace JobSearchAPI.Vacancies {

  model CreateVacancyRequest {
    title: string;
    description: string;
    requirements?: string;
    industry?: string;
    salary_from?: int32;
    salary_to?: int32;
    experience: ExperienceLevel;
    employment_type: EmploymentType;
    city?: string;
    skill_ids?: int32[];
  }

  model UpdateVacancyRequest {
    title?: string;
    description?: string;
    requirements?: string;
    industry?: string;
    salary_from?: int32;
    salary_to?: int32;
    experience?: ExperienceLevel;
    employment_type?: EmploymentType;
    city?: string;
    is_active?: boolean;
    skill_ids?: int32[];
  }

  @get
  @summary("Поиск вакансий с фильтрацией")
  op listVacancies(
    @query q?: string,
    @query industry?: string,
    @query city?: string,
    @query salary_from?: int32,
    @query experience?: ExperienceLevel,
    @query employment_type?: EmploymentType,
    @query page?: int32,
    @query per_page?: int32,
  ):
    | { @statusCode statusCode: 200; @body body: VacancyListResponse; };

  @post
  @summary("Создать вакансию (только работодатель)")
  op createVacancy(@body body: CreateVacancyRequest):
    | { @statusCode statusCode: 201; @body body: Vacancy; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; }
    | { @statusCode statusCode: 422; @body body: ApiError; };

  @get
  @route("/my")
  @summary("Вакансии своей компании")
  op listMyVacancies(
    @query is_active?: boolean,
    @query page?: int32,
    @query per_page?: int32,
  ):
    | { @statusCode statusCode: 200; @body body: VacancyMyListResponse; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; };

  @get
  @route("/{id}")
  @summary("Детали вакансии")
  op getVacancy(@path id: int32):
    | { @statusCode statusCode: 200; @body body: Vacancy; }
    | { @statusCode statusCode: 404; @body body: ApiError; };

  @put
  @route("/{id}")
  @summary("Обновить вакансию")
  op updateVacancy(@path id: int32, @body body: UpdateVacancyRequest):
    | { @statusCode statusCode: 200; @body body: Vacancy; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; }
    | { @statusCode statusCode: 404; @body body: ApiError; };

  @delete
  @route("/{id}")
  @summary("Удалить вакансию")
  op deleteVacancy(@path id: int32):
    | { @statusCode statusCode: 204; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; }
    | { @statusCode statusCode: 404; @body body: ApiError; };
}
