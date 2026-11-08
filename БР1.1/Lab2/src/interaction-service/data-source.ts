import 'reflect-metadata';

import { DataSource } from 'typeorm';

import SETTINGS from '../shared/settings';
import { Comment } from './entities/comment.entity';
import { Favorite } from './entities/favorite.entity';
import { RecipeLike } from './entities/recipe-like.entity';

const interactionDataSource = new DataSource({
    type: 'postgres',
    ...SETTINGS.INTERACTION_DB,
    entities: [Comment, RecipeLike, Favorite],
    logging: true,
    synchronize: true,
});

export default interactionDataSource;
