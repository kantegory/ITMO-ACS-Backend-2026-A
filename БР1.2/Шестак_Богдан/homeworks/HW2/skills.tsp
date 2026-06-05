import "@typespec/http";

using TypeSpec.Http;
using JobSearchAPI;

@route("/skills")
namespace JobSearchAPI.Skills {

  @get
  @summary("Справочник навыков")
  op listSkills(@query q?: string):
    | { @statusCode statusCode: 200; @body body: SkillListResponse; };
}
