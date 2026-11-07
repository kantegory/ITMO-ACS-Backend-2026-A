import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Resume } from './Resume';

// Локальная связь резюме<->навык. Сам навык (название) хранится в Catalog Service,
// здесь хранится только его идентификатор.
@Entity('resume_skills')
export class ResumeSkill {
  @PrimaryColumn({ name: 'resume_id' })
  resumeId!: number;

  @PrimaryColumn({ name: 'skill_id' })
  skillId!: number;

  @ManyToOne(() => Resume, (r) => r.resumeSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resume_id' })
  resume!: Resume;
}
