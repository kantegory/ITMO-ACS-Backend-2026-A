import { Brackets } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { BlogPost } from "../entities/BlogPost";
import { BlogCategory } from "../entities/BlogCategory";
import { BlogComment } from "../entities/BlogComment";
import { User } from "../entities/User";
import {
  BlogFiltersDto,
  CreateBlogPostDto,
  CreateCommentDto,
  UpdateBlogPostDto,
} from "../dto/blog.dto";
import { ConflictError, NotFoundError } from "../utils/AppError";

export class BlogService {
  private postRepo = AppDataSource.getRepository(BlogPost);
  private catRepo = AppDataSource.getRepository(BlogCategory);
  private commentRepo = AppDataSource.getRepository(BlogComment);
  private userRepo = AppDataSource.getRepository(User);

  async list(filters: BlogFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const qb = this.postRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.category", "c")
      .leftJoinAndSelect("p.author", "a")
      .where("p.published = :pub", { pub: true })
      .orderBy("p.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.categoryId)
      qb.andWhere("c.id = :cid", { cid: filters.categoryId });
    if (filters.tag)
      qb.andWhere("p.tags LIKE :tag", { tag: `%${filters.tag}%` });
    if (filters.search) {
      qb.andWhere(
        new Brackets((b) => {
          b.where("LOWER(p.title) LIKE :s", {
            s: `%${filters.search!.toLowerCase()}%`,
          }).orWhere("LOWER(p.summary) LIKE :s", {
            s: `%${filters.search!.toLowerCase()}%`,
          });
        }),
      );
    }
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async getBySlug(slug: string) {
    const post = await this.postRepo.findOne({
      where: { slug },
      relations: { category: true, author: true },
    });
    if (!post) throw new NotFoundError("Post not found");
    return post;
  }

  async getById(id: string) {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: { category: true, author: true },
    });
    if (!post) throw new NotFoundError("Post not found");
    return post;
  }

  async create(authorId: string, dto: CreateBlogPostDto) {
    const existing = await this.postRepo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new ConflictError("Slug already in use");
    const author = await this.userRepo.findOne({ where: { id: authorId } });
    if (!author) throw new NotFoundError("Author not found");

    const post = this.postRepo.create({
      title: dto.title,
      slug: dto.slug,
      summary: dto.summary,
      content: dto.content,
      coverImageUrl: dto.coverImageUrl,
      tags: dto.tags,
      published: dto.published ?? false,
      author,
    });
    if (dto.categoryId) {
      const cat = await this.catRepo.findOne({ where: { id: dto.categoryId } });
      if (!cat) throw new NotFoundError("Category not found");
      post.category = cat;
    }
    return this.postRepo.save(post);
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const post = await this.getById(id);
    if (dto.slug && dto.slug !== post.slug) {
      const existing = await this.postRepo.findOne({
        where: { slug: dto.slug },
      });
      if (existing) throw new ConflictError("Slug already in use");
    }
    Object.assign(post, dto);
    if (dto.categoryId !== undefined) {
      if (dto.categoryId) {
        const cat = await this.catRepo.findOne({
          where: { id: dto.categoryId },
        });
        if (!cat) throw new NotFoundError("Category not found");
        post.category = cat;
      } else {
        post.category = undefined;
      }
    }
    return this.postRepo.save(post);
  }

  async delete(id: string) {
    const result = await this.postRepo.delete({ id });
    if (!result.affected) throw new NotFoundError("Post not found");
  }

  // Categories
  async listCategories() {
    return this.catRepo.find({ order: { name: "ASC" } });
  }

  async createCategory(name: string, slug: string, description?: string) {
    const existing = await this.catRepo.findOne({
      where: [{ name }, { slug }],
    });
    if (existing) throw new ConflictError("Category already exists");
    return this.catRepo.save(this.catRepo.create({ name, slug, description }));
  }

  // Comments
  async listComments(postId: string) {
    return this.commentRepo.find({
      where: { post: { id: postId } },
      order: { createdAt: "ASC" },
      relations: { author: true },
    });
  }

  async addComment(postId: string, authorId: string, dto: CreateCommentDto) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundError("Post not found");
    const author = await this.userRepo.findOne({ where: { id: authorId } });
    if (!author) throw new NotFoundError("User not found");
    const comment = this.commentRepo.create({
      content: dto.content,
      post,
      author,
    });
    return this.commentRepo.save(comment);
  }

  async deleteComment(commentId: string, userId: string, isAdmin: boolean) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: { author: true },
    });
    if (!comment) throw new NotFoundError("Comment not found");
    if (!isAdmin && comment.author.id !== userId) {
      throw new NotFoundError("Comment not found");
    }
    await this.commentRepo.remove(comment);
  }
}
