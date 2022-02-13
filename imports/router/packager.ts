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
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import url from 'url';

const tmpdir = os.tmpdir();

const client = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient: client });

const packager = new Packager(deep);

export const typeDefsString = `
  type Query {
    packager_install(input: PackagerInstallInput): PackagerInstallOutput
    packager_publish(input: PackagerPublishInput): PackagerPublishOutput
  }
  input PackagerInstallInput {
    address: String
  }
  type PackagerInstallOutput {
    ids: [Int]
    errors: [String]
    packageId: Int
  }
  input PackagerPublishInput {
    id: Int
    address: String
  }
  type PackagerPublishOutput {
    ids: [Int]
    errors: [String]
  }
`;
export const typeDefs = gql`${typeDefsString}`;

const resolvers = {
  Query: {
    packager_install: async (source, args, context, info) => {
      const errors = [];
      if (
        context?.headers?.['x-hasura-role'] !== 'admin' &&
        !await deep.can(
          await deep.id('@deep-foundation/core', 'AllowPackagerInstall'),
          +context?.headers?.['x-hasura-user-id'],
          await deep.id('@deep-foundation/core', 'AllowPackagerInstall')
        )
      ) {
        errors.push('cant');
        return { errors };
      }
      const { address } = args.input;
      const uri = new url.URL(address);

      // gist.github.com/ivansglazunov/4cf14e3e58f4e96f7e7914b963ecdd29
      const isGist = uri.hostname === 'gist.github.com';
      const isNpm = uri.hostname === 'npmjs.com' || uri.hostname === 'www.npmjs.com';

      if (isGist) {
        const username = uri.username;
        const password = uri.password;
        const gistId = uri.pathname.split('/')[1];
        if (!username || !password) {
          errors.push('gist requires user and pass');
        }
        if (!username || !password) {
          errors.push('gist valid address like http://gist.github.com/account/gist');
        }
        if (errors.length) return { errors };
        // const gist = new Gists({ token: user + ':' + pass }); copilot Oo
        const gists = new Gists({ username, password });
        const result = await gists.get(gistId);
        const files = result?.body?.files;
        const deepPckgContent = files?.['deep.json']?.content;
        if (deepPckgContent) {
          try {
            const deepPckg = JSON.parse(deepPckgContent);
            const { ids, errors, packageId } = await packager.import(deepPckg);
            return { ids, errors, packageId };
          } catch(error) {
            errors.push(error);
          }
        } else {
          errors.push(`deep.json not founded in gist`);
        }
      } else if (isNpm) {
        // const dirid = uuid();
        // const dir = [tmpdir,dirid].join('/');
        // fs.mkdirSync(dir);
        // let selector = address;
        // if (version) selector += '@' + version;
        // try {
        //   child_process.execSync(`cd ${dir}; npm install --no-cache ${selector};`,{stdio:[0,1,2]});
        // } catch(error) {
        //   errors.push(error);
        //   errors.push('installation failed');
        //   return { errors };
        // }
        // const npmPckgContent = fs.readFileSync([dir,'node_modules',address,'package.json'].join('/'), { encoding: 'utf-8' });
        // const deepPckgContent = fs.readFileSync([dir,'node_modules',address,'deep.json'].join('/'), { encoding: 'utf-8' });
        // if (deepPckgContent) {
        //   try {
        //     const npmPckg = JSON.parse(npmPckgContent);
        //     const deepPckg = JSON.parse(deepPckgContent);
        //     const { ids, errors, packageId } = await packager.import(deepPckg);
        //     fs.rmSync(dir, { recursive: true, force: true });
        //     return { ids, errors, packageId };
        //   } catch(error) {
        //     errors.push(error);
        //   }
        // } else {
        //   errors.push(`deep.json not founded in gist`);
        // }
        // fs.rmSync(dir, { recursive: true, force: true });
      } else {
        errors.push(`address is not valid`);
      }
      return { ids: [], errors };
    },
    packager_publish: async (source, args, context, info) => {
      if (
        context?.headers?.['x-hasura-role'] !== 'admin' &&
        !await deep.can(
          await deep.id('@deep-foundation/core', 'AllowPackagerPublish'),
          +context?.headers?.['x-hasura-user-id'],
          await deep.id('@deep-foundation/core', 'AllowPackagerPublish')
        )
      ) {
        return { error: 'cant' };
      }
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

const generateApolloServer = (httpServer) => {
  return new ApolloServer({ 
    introspection: true,
    typeDefs, 
    resolvers,
    context,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageGraphQLPlayground()
    ]});
  }

export default generateApolloServer;