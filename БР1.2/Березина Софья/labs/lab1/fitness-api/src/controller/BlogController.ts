import { Response } from "express";
import { Request } from "express";
import { AppDataSource } from "../data-source";
import { BlogPost } from "../entity/BlogPost";

export class BlogController {
  static async getPosts(req: Request, res: Response) {
    const { category } = req.query;
    const blogRepo = AppDataSource.getRepository(BlogPost);

    let query = blogRepo
      .createQueryBuilder("b")
      .leftJoinAndSelect("b.author", "a")
      .orderBy("b.created_at", "DESC");

    if (category) {
      query = query.andWhere("b.category = :category", { category });
    }

    const posts = await query.getMany();
    res.json(posts);
  }

  static async getPostById(req: Request, res: Response) {
    const { id } = req.params;
    const blogRepo = AppDataSource.getRepository(BlogPost);

    const post = await blogRepo.findOne({
      where: { id },
      relations: ["author"],
    });

    if (!post) {
      res
        .status(404)
        .json({
          error: "Not Found",
          message: "Post not found",
          status_code: 404,
        });
      return;
    }

    res.json(post);
  }
}
