import "@typespec/http";

using TypeSpec.Http;
using JobSearchAPI;

@route("/companies")
namespace JobSearchAPI.Companies {

  model CreateCompanyRequest {
    name: string;
    description?: string;
    industry?: string;
    city?: string;
    website?: url;
  }

  model UpdateCompanyRequest {
    name?: string;
    description?: string;
    industry?: string;
    city?: string;
    website?: url;
  }

  @get
  @route("/my")
  @summary("Получить свою компанию (работодатель)")
  op getMyCompany():
    | { @statusCode statusCode: 200; @body body: Company; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; }
    | { @statusCode statusCode: 404; @body body: ApiError; };

  @post
  @route("/my")
  @summary("Создать компанию")
  op createCompany(@body body: CreateCompanyRequest):
    | { @statusCode statusCode: 201; @body body: Company; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; }
    | { @statusCode statusCode: 409; @body body: ApiError; };

  @patch
  @route("/my")
  @summary("Обновить компанию")
  op updateCompany(@body body: UpdateCompanyRequest):
    | { @statusCode statusCode: 200; @body body: Company; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 403; @body body: ApiError; };

  @get
  @route("/{id}")
  @summary("Публичная страница компании")
  op getCompany(@path id: int32):
    | { @statusCode statusCode: 200; @body body: Company; }
    | { @statusCode statusCode: 404; @body body: ApiError; };
}
