import { call } from '../engine';

export default async (req, res) => {
  res.send(await call({ ...req.body }));
};
