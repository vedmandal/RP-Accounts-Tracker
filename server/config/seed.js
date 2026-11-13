import Category from '../models/Category.js';
import { DEFAULT_CATEGORIES } from './constants.js';

const seedCategories = async () => {
  await Category.bulkWrite(
    DEFAULT_CATEGORIES.map((c) => ({
      updateOne: {
        filter: { name: c.name, type: c.type },
        update: { $setOnInsert: { ...c, isDefault: true } },
        upsert: true,
      },
    }))
  );
};

export default seedCategories;
