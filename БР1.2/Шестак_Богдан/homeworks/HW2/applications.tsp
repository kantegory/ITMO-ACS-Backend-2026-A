import "@typespec/http";

using TypeSpec.Http;
using JobSearchAPI;

namespace JobSearchAPI.Applications {

  model ApplyRequest {
    resume_id: int32;
    cover_letter?: string;
  }

  model UpdateStatusRequest {
    status: ApplicationStatus;
  }

  @post
  @route("/vacancies/{id}/apply")
  @summary("Откликнуться на вакансию (соискатель)")
  op apply(@path id: int32, @body body: ApplyRequest):
    | { @statusCode statusCode: 201; @body body: Application; }
    | { @statusCode statusCode: 400; @body body: ApiError; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; }
    | { @statusCode statusCode: 404; @body body: ApiError; }
    | { @statusCode statusCode: 409; @body body: ApiError; };

  @get
  @route("/applications/my")
  @summary("Мои отклики (соискатель)")
  op listMyApplications(
    @query status?: ApplicationStatus,
    @query page?: int32,
    @query per_page?: int32,
  ):
    | { @statusCode statusCode: 200; @body body: ApplicationListResponse; }
    | { @statusCode statusCode: 401; @body body: ApiError; };

  @get
  @route("/vacancies/{id}/applications")
  @summary("Отклики на вакансию (работодатель)")
  op listVacancyApplications(
    @path id: int32,
    @query status?: ApplicationStatus,
    @query page?: int32,
    @query per_page?: int32,
  ):
    | { @statusCode statusCode: 200; @body body: ApplicationListResponse; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; }
    | { @statusCode statusCode: 404; @body body: ApiError; };

  @patch
  @route("/applications/{id}/status")
  @summary("Изменить статус отклика (работодатель)")
  op updateStatus(@path id: int32, @body body: UpdateStatusRequest):
    | { @statusCode statusCode: 200; @body body: Application; }
    | { @statusCode statusCode: 400; @body body: ApiError; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; }
    | { @statusCode statusCode: 404; @body body: ApiError; };
}
