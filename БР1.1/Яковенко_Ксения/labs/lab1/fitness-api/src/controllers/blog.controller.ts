import {
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  QueryParam,
  Req,
  UseBefore,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from 'routing-controllers';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  ArrayMinSize,
} from 'class-validator';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { BlogCategory } from '../models/blog-category.entity';
import { BlogPost } from '../models/blog-post.entity';
import { User } from '../models/user.entity';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';

class CreateBlogCategoryDto {
  @IsString()
  @Type(() => String)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @Type(() => String)
  slug!: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  description?: string;
}

class CreateBlogPostDto {
  @IsString()
  @Type(() => String)
  title!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @Type(() => String)
  slug!: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  summary?: string;

  @IsString()
  @Type(() => String)
  content!: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  coverImageUrl?: string;

  @IsIn(['draft', 'published'])
  @Type(() => String)
  status!: 'draft' | 'published';

  @IsOptional()
  @IsDateString()
  @Type(() => String)
  publishedAt?: string;

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  categoryIds!: number[];
}

class UpdateBlogPostDto {
  @IsOptional()
  @IsString()
  @Type(() => String)
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @Type(() => String)
  slug?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  summary?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  content?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  coverImageUrl?: string;

  @IsOptional()
  @IsIn(['draft', 'published'])
  @Type(() => String)
  status?: 'draft' | 'published';

  @IsOptional()
  @IsDateString()
  @Type(() => String)
  publishedAt?: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  categoryIds?: number[];
}

function ensureBlogManager(request: RequestWithUser) {
  const role = request.user?.role;
  if (!role || !['trainer', 'admin'].includes(role)) {
    throw new ForbiddenError('Only trainer or admin can manage blog content');
  }
}

@EntityController({
  baseRoute: '/blog',
  entity: BlogPost,
})
class BlogController extends BaseController {
  @Get('/categories')
  async getCategories() {
    const categoryRepository = this.repository.manager.getRepository(BlogCategory);
    const items = await categoryRepository.find({
      order: { id: 'ASC' },
    });

    return { items };
  }

  @Post('/categories')
  @UseBefore(authMiddleware)
  async createCategory(
    @Req() request: RequestWithUser,
    @Body({ type: CreateBlogCategoryDto }) body: CreateBlogCategoryDto,
  ) {
    ensureBlogManager(request);

    const categoryRepository = this.repository.manager.getRepository(BlogCategory);

    const existingByName = await categoryRepository.findOneBy({ name: body.name });
    if (existingByName) {
      throw new BadRequestError('Category with this name already exists');
    }

    const existingBySlug = await categoryRepository.findOneBy({ slug: body.slug });
    if (existingBySlug) {
      throw new BadRequestError('Category with this slug already exists');
    }

    const category = categoryRepository.create(body);
    const savedCategory = await categoryRepository.save(category);

    return { category: savedCategory };
  }

  @Get('/posts')
  async getPosts(
    @QueryParam('q') q?: string,
    @QueryParam('categoryIds') categoryIds?: string,
    @QueryParam('status') status?: string,
    @QueryParam('page') page?: string,
    @QueryParam('pageSize') pageSize?: string,
  ) {
    const qb = this.repository
      .createQueryBuilder('blogPost')
      .leftJoinAndSelect('blogPost.categories', 'categories')
      .distinct(true);

    if (q) {
      qb.andWhere(
        '(LOWER(blogPost.title) LIKE LOWER(:q) OR LOWER(COALESCE(blogPost.summary, \'\')) LIKE LOWER(:q) OR LOWER(blogPost.content) LIKE LOWER(:q))',
        { q: `%${q}%` },
      );
    }

    if (status) {
      qb.andWhere('blogPost.status = :status', { status });
    } else {
      qb.andWhere('blogPost.status = :status', { status: 'published' });
    }

    if (categoryIds) {
      const parsedCategoryIds = categoryIds
        .split(',')
        .map((id) => Number(id.trim()))
        .filter((id) => !Number.isNaN(id));

      if (parsedCategoryIds.length > 0) {
        qb.andWhere('categories.id IN (:...categoryIds)', { categoryIds: parsedCategoryIds });
      }
    }

    qb.orderBy('blogPost.createdAt', 'DESC');

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSizeNumber = Math.min(Math.max(Number(pageSize) || 20, 1), 100);

    qb.skip((pageNumber - 1) * pageSizeNumber).take(pageSizeNumber);

    const [items, totalItems] = await qb.getManyAndCount();

    return {
      items,
      pagination: {
        page: pageNumber,
        pageSize: pageSizeNumber,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSizeNumber),
      },
    };
  }

  @Get('/posts/:id')
  async getPostById(@Param('id') id: number) {
    const blogPost = await this.repository.findOne({
      where: { id },
      relations: ['categories'],
    });

    if (!blogPost) {
      throw new NotFoundError('Blog post not found');
    }

    return { blogPost };
  }

  @Post('/posts')
  @UseBefore(authMiddleware)
  async createPost(
    @Req() request: RequestWithUser,
    @Body({ type: CreateBlogPostDto }) body: CreateBlogPostDto,
  ) {
    ensureBlogManager(request);

    const categoryRepository = this.repository.manager.getRepository(BlogCategory);
    const userRepository = this.repository.manager.getRepository(User);

    const existingSlug = await this.repository.findOneBy({ slug: body.slug });
    if (existingSlug) {
      throw new BadRequestError('Post with this slug already exists');
    }

    const categories = await categoryRepository
      .createQueryBuilder('category')
      .where('category.id IN (:...ids)', { ids: body.categoryIds })
      .getMany();

    if (categories.length !== body.categoryIds.length) {
      throw new BadRequestError('One or more categories were not found');
    }

    const author = await userRepository.findOneBy({ id: request.user.id });
    if (!author) {
      throw new NotFoundError('Author not found');
    }

    const post = this.repository.create({
      title: body.title,
      slug: body.slug,
      summary: body.summary,
      content: body.content,
      coverImageUrl: body.coverImageUrl,
      status: body.status,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
      authorId: author.id,
      categories,
    });

    const savedPost = await this.repository.save(post);

    const fullPost = await this.repository.findOne({
      where: { id: savedPost.id },
      relations: ['categories'],
    });

    return { blogPost: fullPost };
  }

  @Patch('/posts/:id')
  @UseBefore(authMiddleware)
  async updatePost(
    @Req() request: RequestWithUser,
    @Param('id') id: number,
    @Body({ type: UpdateBlogPostDto }) body: UpdateBlogPostDto,
  ) {
    ensureBlogManager(request);

    const categoryRepository = this.repository.manager.getRepository(BlogCategory);

    const post = await this.repository.findOne({
      where: { id },
      relations: ['categories'],
    });

    if (!post) {
      throw new NotFoundError('Blog post not found');
    }

    if (body.slug && body.slug !== post.slug) {
      const existingSlug = await this.repository.findOneBy({ slug: body.slug });
      if (existingSlug) {
        throw new BadRequestError('Post with this slug already exists');
      }
    }

    if (body.categoryIds) {
      const categories = await categoryRepository
        .createQueryBuilder('category')
        .where('category.id IN (:...ids)', { ids: body.categoryIds })
        .getMany();

      if (categories.length !== body.categoryIds.length) {
        throw new BadRequestError('One or more categories were not found');
      }

      post.categories = categories;
    }

    Object.assign(post, {
      title: body.title ?? post.title,
      slug: body.slug ?? post.slug,
      summary: body.summary ?? post.summary,
      content: body.content ?? post.content,
      coverImageUrl: body.coverImageUrl ?? post.coverImageUrl,
      status: body.status ?? post.status,
      publishedAt:
        body.publishedAt !== undefined
          ? new Date(body.publishedAt)
          : post.publishedAt,
    });

    const updatedPost = await this.repository.save(post);

    return { blogPost: updatedPost };
  }

  @Delete('/posts/:id')
  @UseBefore(authMiddleware)
  async deletePost(
    @Req() request: RequestWithUser,
    @Param('id') id: number,
  ) {
    ensureBlogManager(request);

    const post = await this.repository.findOneBy({ id });

    if (!post) {
      throw new NotFoundError('Blog post not found');
    }

    await this.repository.remove(post);

    return { success: true };
  }
}

export default BlogController;