import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Resume } from "./Resume";
import { Skill } from "./Skill";

@Entity("resume_skills")
export class ResumeSkill {
  @PrimaryColumn({ name: "resume_id", type: "uuid" })
  resumeId!: string;

  @PrimaryColumn({ name: "skill_id", type: "uuid" })
  skillId!: string;

  @ManyToOne(() => Resume, (r) => r.resumeSkills, { onDelete: "CASCADE" })
  @JoinColumn({ name: "resume_id" })
  resume!: Resume;

  @ManyToOne(() => Skill, { onDelete: "CASCADE", eager: true })
  @JoinColumn({ name: "skill_id" })
  skill!: Skill;
}
