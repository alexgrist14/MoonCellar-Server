import { Model } from 'mongoose';

export const getCount = async <T>(model: Model<T>) => {
  console.log(`${model.modelName}: ${await model.countDocuments({})}`);
  console.log('');
};

export const updateOrInsertValues = <T>(model: Model<T>, items: unknown) => {
  const queries = [];

  (items as (T & { id: number })[]).forEach((item) => {
    !!item && queries.push(
      model.findOneAndUpdate({ id: item.id }, item, {
        new: true,
        upsert: true,
      }),
    );
  });

  return Promise.all(queries);
};
