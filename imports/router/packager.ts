import gql from 'graphql-tag';
import Gists from 'gists';
import { generateApolloClient } from '@deep-foundation/hasura/client';
import { GLOBAL_ID_PACKAGE_VERSION } from '../client';
import { Packager } from '../packager';
import { ApolloServer } from 'apollo-server-express';
import { DeepClient } from '../client';
import fs from 'fs';
import os from 'os';
import { v4 as uuid } from 'uuid';
import child_process from 'child_process';
import * as semver from 'semver';

const tmpdir = os.tmpdir();

const gists = new Gists({
  username: 'ivansglazunov', 
  password: process?.env?.PASSWORD,
});

const client = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient: client });

const packager = new Packager(deep);

const typeDefs = gql`
  type Query {
    packagerInstall(input: PackagerInstallInput): PackagerInstallOutput
    packagerPublish(input: PackagerPublishInput): PackagerPublishOutput
  }
  input PackagerInstallInput {
    name: String
    version: String
    address: String
    type: String
  }
  type PackagerInstallOutput {
    ids: [Int]
    errors: [String]
  }
  input PackagerPublishInput {
    id: Int
    address: String
    type: String
  }
  type PackagerPublishOutput {
    ids: [Int]
    errors: [String]
  }
`;

const resolvers = {
  Query: {
    packagerInstall: async (source, args, context, info) => {
      const { name, version, address, type } = args.input;
      const errors = [];
      if (type === 'gist') {
        const result = await gists.get(address);
        const files = result?.body?.files;
        const deepPckgContent = files?.['deep.json']?.content;
        if (deepPckgContent) {
          try {
            const deepPckg = JSON.parse(deepPckgContent);
            const { ids, errors } = await packager.import(deepPckg);
            return { ids, errors };
          } catch(error) {
            errors.push(error);
          }
        } else {
          errors.push(`deep.json not founded in gist`);
        }
      } else if (type === 'npm') {
        const dirid = uuid();
        const dir = [tmpdir,dirid].join('/');
        fs.mkdirSync(dir);
        let selector = address;
        if (version) selector += '@' + version;
        try {
          child_process.execSync(`cd ${dir}; npm install --no-cache ${selector};`,{stdio:[0,1,2]});
        } catch(error) {
          errors.push(error);
          errors.push('istallation failed');
          return { errors };
        }
        const npmPckgContent = fs.readFileSync([dir,'node_modules',address,'package.json'].join('/'), { encoding: 'utf-8' });
        const deepPckgContent = fs.readFileSync([dir,'node_modules',address,'deep.json'].join('/'), { encoding: 'utf-8' });
        if (deepPckgContent) {
          try {
            const npmPckg = JSON.parse(npmPckgContent);
            const deepPckg = JSON.parse(deepPckgContent);
            const { ids, errors } = await packager.import(deepPckg);
            fs.rmSync(dir, { recursive: true, force: true });
            return { ids, errors };
          } catch(error) {
            errors.push(error);
          }
        } else {
          errors.push(`deep.json not founded in gist`);
        }
        fs.rmSync(dir, { recursive: true, force: true });
      } else {
        errors.push(`type ${type} is not valid`);
      }
      return { ids: [], errors };
    },
    packagerPublish: async (source, args, context, info) => {
      const { id, address, type } = args.input;
      const errors = [];
      if (type === 'gist') {
        
      } else if (type === 'npm') {
        const dirid = uuid();
        const dir = [tmpdir,dirid].join('/');
        const pckgDir = [tmpdir,dirid,'node_modules',address].join('/');
        fs.mkdirSync(dir);
        try {
          child_process.execSync(`cd ${dir}; npm install --no-cache ${address};`,{stdio:[0,1,2]});
        } catch(error) {
          errors.push(error);
          errors.push('installation failed');
          return { errors };
        }
        const npmPckgPath = [pckgDir,'package.json'].join('/');
        const npmPckgJSON = fs.readFileSync(npmPckgPath, { encoding: 'utf-8' });
        let npmPckg;
        let nextVersion;
        if (!npmPckgJSON) {
          errors.push('package.json not founded in installed package');
          return { errors };
        } else {
          npmPckg = JSON.parse(npmPckgJSON);
          npmPckg.version = nextVersion = semver.inc(npmPckg?.version || '0.0.0', 'patch');
        }
        await deep.update({
          link: {
            type_id: { _eq: GLOBAL_ID_PACKAGE_VERSION },
            to_id: { _eq: id },
          },
        }, { value: nextVersion }, { table: 'strings' });
        fs.writeFileSync(npmPckgPath, JSON.stringify(npmPckg), { encoding: 'utf-8' });
        const deepPckgContent = await packager.export({ packageLinkId: id });
        console.log(JSON.stringify(deepPckgContent, null, 2));
        fs.writeFileSync([pckgDir,'deep.json'].join('/'), JSON.stringify(deepPckgContent), { encoding: 'utf-8' });
        child_process.execSync(`cd ${pckgDir}; npm publish;`,{stdio:[0,1,2]});
        fs.rmSync(dir, { recursive: true, force: true });
      }
      return { errors };
    },
  }
};

const context = ({ req }) => {
  return { headers: req.headers };
};

const apolloServer = new ApolloServer({ introspection: true, typeDefs, resolvers, context });

export default apolloServer;
