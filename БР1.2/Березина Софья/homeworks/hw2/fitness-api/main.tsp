import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

import "./models/index.tsp";

import "./endpoints/auth.tsp";
import "./endpoints/users.tsp";
import "./endpoints/progress.tsp";
import "./endpoints/workouts.tsp";
import "./endpoints/exercises.tsp";
import "./endpoints/user_workouts.tsp";
import "./endpoints/blog.tsp";
import "./endpoints/admin.tsp";

using TypeSpec.Http;

@service(#{
  title: "Fitness Platform API"
})
@server("http://localhost:3000/api/v1", "Local server")
namespace FitnessApi;