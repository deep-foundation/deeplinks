import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import Gists from 'gists';
import gql from 'graphql-tag';
import _ from 'lodash';
import os from 'os';
import path from 'path';
import url from 'url';
import { DeepClient } from '../client.js';
import { Packager } from '../packager.js';

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
    errors: [String]
    address: String
  }
`;
export const typeDefs = gql`${typeDefsString}`;

export const packagerInstallCore = async (errors = [], address: string) => {
  const uri = new url.URL(address);

  // gist.github.com/ivansglazunov/4cf14e3e58f4e96f7e7914b963ecdd29
  const isGist = uri.hostname === 'gist.github.com';
  const isNpm = uri.hostname === 'npmjs.com' || uri.hostname === 'www.npmjs.com';

  if (isGist) {
    const username = uri.username;
    const gistId = uri.pathname.split('/')[2];
    if (!username) {
      errors.push('gist requires token');
    }
    if (!gistId) {
      errors.push('gist valid address like http://gist.github.com/account/gist');
    }
    if (errors.length) return { errors };
    // const gist = new Gists({ token: user + ':' + pass }); copilot Oo
    const gists = new Gists({ token: username });
    const result = await gists.get(gistId);
    const files = result?.body?.files;
    const deepPckgContent = files?.['deep.json']?.content;
    if (deepPckgContent) {
      try {
        const deepPckg = JSON.parse(deepPckgContent);
        const { ids, errors, packageId } = await packager.import(deepPckg);
        return { ids, errors, packageId };
      } catch(e) {
        errors.push(String(e));
      }
    } else {
      errors.push(`deep.json not founded in gist`);
    }
  // } else if (isNpm) {
    // const dirid = uuid();
    // const dir = [tmpdir,dirid].join('/');
    // fs.mkdirSync(dir);
    // let selector = address;
    // if (version) selector += '@' + version;
    // try {
    //   child_process.execSync(`cd ${dir}; npm install --no-cache ${selector};`,{stdio:[0,1,2]});
    // } catch(e) {
    //   errors.push(e);
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
    //   } catch(e) {
    //     errors.push(e);
    //   }
    // } else {
    //   errors.push(`deep.json not founded in gist`);
    // }
    // fs.rmSync(dir, { recursive: true, force: true });
  } else {
    errors.push(`address is not valid`);
  }
};

export const packagerPublishCore = async (errors = [], address: string, id: number) => {
  console.log('packagerPublishCore');
  if (!id) return { errors: ['!id'] };
  const packageResults = await deep.select(id);
  if (!packageResults.data?.length) return { errors: ['!package'] }

  const uri = new url.URL(address);

  // gist.github.com/ivansglazunov/4cf14e3e58f4e96f7e7914b963ecdd29
  const isGist = uri.hostname === 'gist.github.com';
  const isNpm = uri.hostname === 'npmjs.com' || uri.hostname === 'www.npmjs.com';
  console.log('packagerPublishCore', { isGist, isNpm });
  
  if (isGist) {
    const username = uri.username;
    const gistId = uri.pathname.split('/')[2];
    console.log('packagerPublishCore', { username, gistId });
    if (!username) {
      errors.push('gist requires token');
    }
    if (errors.length) return { errors };
    if (gistId) {
      // const gist = new Gists({ token: user + ':' + pass }); copilot Oo
      const deepPckgContent = await packager.export({ packageLinkId: id });
      console.log('packagerPublishCore deepPckgContent', deepPckgContent);
      if (deepPckgContent?.errors?.length) {
        errors.push(...deepPckgContent.errors);
      }
      if (_.isEmpty(deepPckgContent?.package)) {
        errors.push('!package');
      }
      if (_.isEmpty(deepPckgContent?.data)) {
        errors.push('!data');
      }
      if (errors.length) return { errors };
      const gists = new Gists({ token: username });
      console.log('packagerPublishCore gists.edit', gistId, { files: { 'deep.json': { content: JSON.stringify(deepPckgContent) } } });
      const result = await gists.edit(gistId, { files: { 'deep.json': { content: JSON.stringify(deepPckgContent) } } });
      console.log('packagerPublishCore result', result);
      if (result?.body?.id) return { errors, address: `https://${username}@gist.github.com${uri.pathname}` };
    } else {
      // const gist = new Gists({ token: user + ':' + pass }); copilot Oo
      const deepPckgContent = await packager.export({ packageLinkId: id });
      if (deepPckgContent?.errors?.length) {
        errors.push(...deepPckgContent.errors);
        return { errors };
      }
      const gists = new Gists({ token: username });
      const result = await gists.create({ files: { 'deep.json': { content: JSON.stringify(deepPckgContent) } } });
      if (result?.body?.id) return { errors, address: `https://${username}@gist.github.com${path.normalize(`${uri.pathname}/${result?.body?.id}`)}` };
    }
    if (errors.length) return { errors };
  // } else if (isNpm) {
    // const dirid = uuid();
    // const dir = [tmpdir,dirid].join('/');
    // const pckgDir = [tmpdir,dirid,'node_modules',address].join('/');
    // fs.mkdirSync(dir);
    // try {
    //   child_process.execSync(`cd ${dir}; npm install --no-cache ${address};`,{stdio:[0,1,2]});
    // } catch(e) {
    //   errors.push(e);
    //   errors.push('installation failed');
    //   return { errors };
    // }
    // const npmPckgPath = [pckgDir,'package.json'].join('/');
    // const npmPckgJSON = fs.readFileSync(npmPckgPath, { encoding: 'utf-8' });
    // let npmPckg;
    // let nextVersion;
    // if (!npmPckgJSON) {
    //   errors.push('package.json not founded in installed package');
    //   return { errors };
    // } else {
    //   npmPckg = JSON.parse(npmPckgJSON);
    //   npmPckg.version = nextVersion = semver.inc(npmPckg?.version || '0.0.0', 'patch');
    // }
    // await deep.update({
    //   link: {
    //     type_id: { _eq: _ids?.['@deep-foundation/core']?.PackageVersion },
    //     to_id: { _eq: id },
    //   },
    // }, { value: nextVersion }, { table: 'strings' });
    // fs.writeFileSync(npmPckgPath, JSON.stringify(npmPckg), { encoding: 'utf-8' });
    // const deepPckgContent = await packager.export({ packageLinkId: id });
    // fs.writeFileSync([pckgDir,'deep.json'].join('/'), JSON.stringify(deepPckgContent), { encoding: 'utf-8' });
    // child_process.execSync(`cd ${pckgDir}; npm publish;`,{stdio:[0,1,2]});
    // fs.rmSync(dir, { recursive: true, force: true });
  }
};

const resolvers = {
  Query: {
    packager_install: async (source, args, context, info) => {
      const errors = [];
      if (
        context?.headers?.['x-hasura-role'] !== 'admin' &&
        !await deep.can(
          await deep.id('@deep-foundation/core', 'AllowPackageInstall'),
          +context?.headers?.['x-hasura-user-id'],
          await deep.id('@deep-foundation/core', 'AllowPackageInstall')
        ) &&
        !await deep.can(
          null,
          +context?.headers?.['x-hasura-user-id'],
          await deep.id('@deep-foundation/core', 'AllowAdmin')
        )
      ) {
        errors.push('cant');
        return { errors };
      }
      const { address } = args.input;
      const result = await packagerInstallCore(errors, args.input?.address);
      if (result) return result;
      return { ids: [], errors };
    },
    packager_publish: async (source, args, context, info) => {
      const errors = [];
      console.log({
        userId: +context?.headers?.['x-hasura-user-id'],
        roleAdmin: context?.headers?.['x-hasura-role'] === 'admin',
        AllowPackagePublish: await deep.can(
          await deep.id('@deep-foundation/core', 'AllowPackagePublish'),
          +context?.headers?.['x-hasura-user-id'],
          await deep.id('@deep-foundation/core', 'AllowPackagePublish')
        ),
        AllowAdmin: await deep.can(
          null,
          +context?.headers?.['x-hasura-user-id'],
          await deep.id('@deep-foundation/core', 'AllowAdmin')
        ),
      });
      if (
        context?.headers?.['x-hasura-role'] !== 'admin' &&
        !await deep.can(
          await deep.id('@deep-foundation/core', 'AllowPackagePublish'),
          +context?.headers?.['x-hasura-user-id'],
          await deep.id('@deep-foundation/core', 'AllowPackagePublish')
        ) &&
        !await deep.can(
          null,
          +context?.headers?.['x-hasura-user-id'],
          await deep.id('@deep-foundation/core', 'AllowAdmin')
        )
      ) {
        errors.push('cant');
        return { errors };
      }
      const { id, address } = args.input;
      const result = await packagerPublishCore(errors, address, id);
      if (result) return result;
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