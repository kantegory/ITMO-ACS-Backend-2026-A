import "../models/index.tsp";

using TypeSpec.Http;

namespace FitnessApi {

  @tag("Blog")
  interface Blog {

    @get
    @route("/blog/posts")
    getPosts(
      @query category?: BlogCategory,
    ): BlogPost[];

    @get
    @route("/blog/posts/{id}")
    getPostById(@path id: string): BlogPost;
  }

}