import "@typespec/http";
import "./common.tsp";
import "./user.tsp";

namespace FitnessApi {
  enum BlogCategory {
    nutrition: "nutrition",
    health: "health",
    motivation: "motivation",
    recovery: "recovery",
    science: "science",
  }
  
  model BlogPost {
    id: string;
    title: string;
    content: string;
    featured_image?: string;
    category: BlogCategory;
    author_id: string;
    @format("date-time")
    created_at: string;
  }
  
  model CreateBlogPostRequest {
    title: string;
    content: string;
    featured_image?: string;
    category: BlogCategory;
  }
}


