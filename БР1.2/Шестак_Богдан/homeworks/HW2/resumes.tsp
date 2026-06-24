import "@typespec/http";

using TypeSpec.Http;
using JobSearchAPI;

@route("/resumes")
namespace JobSearchAPI.Resumes {

  model CreateResumeRequest {
    title: string;
    summary?: string;
    desired_position?: string;
    desired_salary?: int32;
    city?: string;
    is_published?: boolean;
  }

  model UpdateResumeRequest {
    title?: string;
    summary?: string;
    desired_position?: string;
    desired_salary?: int32;
    city?: string;
    is_published?: boolean;
  }

  model CreateExperienceRequest {
    company: string;
    position: string;
    started_at: plainDate;
    ended_at?: plainDate;
    description?: string;
  }

  model CreateEducationRequest {
    institution: string;
    degree?: string;
    field?: string;
    started_at: plainDate;
    graduated_at?: plainDate;
  }

  model SkillEntry {
    skill_id: int32;
    level: SkillLevel;
  }

  model UpdateSkillsRequest {
    skills: SkillEntry[];
  }

  @get
  @summary("Список своих резюме")
  op listResumes():
    | { @statusCode statusCode: 200; @body body: ResumeListResponse; }
    | { @statusCode statusCode: 401; @body body: ApiError; };

  @post
  @summary("Создать резюме")
  op createResume(@body body: CreateResumeRequest):
    | { @statusCode statusCode: 201; @body body: Resume; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 422; @body body: ApiError; };

  @get
  @route("/{id}")
  @summary("Получить резюме по ID")
  op getResume(@path id: int32):
    | { @statusCode statusCode: 200; @body body: Resume; }
    | { @statusCode statusCode: 403; @body body: ApiError; }
    | { @statusCode statusCode: 404; @body body: ApiError; };

  @put
  @route("/{id}")
  @summary("Обновить резюме")
  op updateResume(@path id: int32, @body body: UpdateResumeRequest):
    | { @statusCode statusCode: 200; @body body: Resume; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; }
    | { @statusCode statusCode: 404; @body body: ApiError; };

  @delete
  @route("/{id}")
  @summary("Удалить резюме")
  op deleteResume(@path id: int32):
    | { @statusCode statusCode: 204; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; }
    | { @statusCode statusCode: 404; @body body: ApiError; };

  @post
  @route("/{id}/experience")
  @summary("Добавить опыт работы")
  op addExperience(@path id: int32, @body body: CreateExperienceRequest):
    | { @statusCode statusCode: 201; @body body: WorkExperience; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; };

  @put
  @route("/{id}/experience/{exp_id}")
  @summary("Обновить запись опыта")
  op updateExperience(@path id: int32, @path exp_id: int32, @body body: CreateExperienceRequest):
    | { @statusCode statusCode: 200; @body body: WorkExperience; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; }
    | { @statusCode statusCode: 404; @body body: ApiError; };

  @delete
  @route("/{id}/experience/{exp_id}")
  @summary("Удалить запись опыта")
  op deleteExperience(@path id: int32, @path exp_id: int32):
    | { @statusCode statusCode: 204; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; };

  @post
  @route("/{id}/education")
  @summary("Добавить образование")
  op addEducation(@path id: int32, @body body: CreateEducationRequest):
    | { @statusCode statusCode: 201; @body body: Education; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; };

  @put
  @route("/{id}/education/{edu_id}")
  @summary("Обновить образование")
  op updateEducation(@path id: int32, @path edu_id: int32, @body body: CreateEducationRequest):
    | { @statusCode statusCode: 200; @body body: Education; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; }
    | { @statusCode statusCode: 404; @body body: ApiError; };

  @delete
  @route("/{id}/education/{edu_id}")
  @summary("Удалить образование")
  op deleteEducation(@path id: int32, @path edu_id: int32):
    | { @statusCode statusCode: 204; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; };

  @put
  @route("/{id}/skills")
  @summary("Обновить навыки резюме")
  op updateSkills(@path id: int32, @body body: UpdateSkillsRequest):
    | { @statusCode statusCode: 200; @body body: ResumeSkill[]; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; };
}
