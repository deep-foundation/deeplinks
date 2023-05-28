import tsNode from 'ts-node';
import config from '../tsconfig.json';
import dotenv from 'dotenv';

tsNode.register(config);
dotenv.config();

export default () => {};
