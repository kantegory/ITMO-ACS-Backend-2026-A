import { Request, Response, NextFunction } from 'express';
import { DictionaryService } from '../services/dictionary.service';

const service = new DictionaryService();

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (err) {
      next(err);
    }
  };

export const getCountries = wrap(async (_req, res) => res.json(await service.getCountries()));
export const getCities = wrap(async (_req, res) => res.json(await service.getCities()));
export const getIndustries = wrap(async (_req, res) => res.json(await service.getIndustries()));
export const getSkills = wrap(async (_req, res) => res.json(await service.getSkills()));
export const getEmploymentTypes = wrap(async (_req, res) =>
  res.json(await service.getEmploymentTypes()),
);
export const getDegreeTypes = wrap(async (_req, res) => res.json(await service.getDegreeTypes()));

export const createCountry = wrap(async (req, res) => {
  res.status(201).json(await service.createCountry(req.body));
});
export const updateCountry = wrap(async (req, res) => {
  res.json(await service.updateCountry(req.params.id, req.body));
});
export const deleteCountry = wrap(async (req, res) => {
  await service.deleteCountry(req.params.id);
  res.status(204).send();
});

export const createCity = wrap(async (req, res) => {
  res.status(201).json(await service.createCity(req.body));
});
export const updateCity = wrap(async (req, res) => {
  res.json(await service.updateCity(req.params.id, req.body));
});
export const deleteCity = wrap(async (req, res) => {
  await service.deleteCity(req.params.id);
  res.status(204).send();
});

export const createIndustry = wrap(async (req, res) => {
  res.status(201).json(await service.createIndustry(req.body));
});
export const updateIndustry = wrap(async (req, res) => {
  res.json(await service.updateIndustry(req.params.id, req.body));
});
export const deleteIndustry = wrap(async (req, res) => {
  await service.deleteIndustry(req.params.id);
  res.status(204).send();
});

export const createSkill = wrap(async (req, res) => {
  res.status(201).json(await service.createSkill(req.body));
});
export const updateSkill = wrap(async (req, res) => {
  res.json(await service.updateSkill(req.params.id, req.body));
});
export const deleteSkill = wrap(async (req, res) => {
  await service.deleteSkill(req.params.id);
  res.status(204).send();
});

export const createEmploymentType = wrap(async (req, res) => {
  res.status(201).json(await service.createEmploymentType(req.body));
});
export const updateEmploymentType = wrap(async (req, res) => {
  res.json(await service.updateEmploymentType(req.params.id, req.body));
});
export const deleteEmploymentType = wrap(async (req, res) => {
  await service.deleteEmploymentType(req.params.id);
  res.status(204).send();
});

export const createDegreeType = wrap(async (req, res) => {
  res.status(201).json(await service.createDegreeType(req.body));
});
export const updateDegreeType = wrap(async (req, res) => {
  res.json(await service.updateDegreeType(req.params.id, req.body));
});
export const deleteDegreeType = wrap(async (req, res) => {
  await service.deleteDegreeType(req.params.id);
  res.status(204).send();
});
