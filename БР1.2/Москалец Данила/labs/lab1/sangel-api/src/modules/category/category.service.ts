import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { AppDataSource } from '../../config/database';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';

export class CategoryService {
  private categoryRepository: Repository<Category>;

  constructor() {
    this.categoryRepository = AppDataSource.getRepository(Category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { is_published: true },
      order: { title: 'ASC' },
    });
  }

  async findAllAdmin(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: { title: dto.title },
    });
    if (existing) {
      throw new Error('Category with this title already exists');
    }

    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);
    
    if (dto.title !== undefined) {
      const existing = await this.categoryRepository.findOne({
        where: { title: dto.title },
      });
      if (existing && existing.id !== id) {
        throw new Error('Category with this title already exists');
      }
      category.title = dto.title;
    }
    if (dto.is_published !== undefined) {
      category.is_published = dto.is_published;
    }
    
    return this.categoryRepository.save(category);
  }

  async delete(id: number): Promise<void> {
    const category = await this.findById(id);
    await this.categoryRepository.remove(category);
  }
}