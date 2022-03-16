import { exec } from 'child_process';
import crypto from 'crypto';
import axios from 'axios';
import getPort from 'get-port';
import Debug from 'debug';
import util from 'util';
const execAsync = util.promisify(exec);

const debug = Debug('deeplinks:container-controller');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

const DOCKER = process.env.DOCKER || '0';

export interface ContainerControllerOptions {
  gqlUrnWithoutProject: string;
  network: string;
  handlersHash?: any;
}

export interface NewContainerOptions {
  handler: string,
  code: string,
  jwt: string,
  data: any
  forceName?: string;
  forcePort?: number;
  forceRestart?: boolean;
  publish?: boolean;
}
export interface InitOptions {
  port: number;
}
export interface Container {
  name?: string;
  host?: string;
  port?: number;
  error?: string;
}
export interface CallOptions {
  code: string;
  jwt: string,
  data: any
  container: Container;
}

export const runnerControllerOptionsDefault: ContainerControllerOptions = {
  gqlUrnWithoutProject: 'links_1:3006',
  network: 'network',
  handlersHash: {},
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export class ContainerController {
  gqlUrnWithoutProject: string;
  network: string;
  delimiter: string;
  runContainerHash: { [id: string]: Boolean } = {};
  handlersHash: { [id: string]: Container } = {};
  constructor(options?: ContainerControllerOptions) {
    this.network = options?.network || runnerControllerOptionsDefault.network;
    this.gqlUrnWithoutProject = options?.gqlUrnWithoutProject || runnerControllerOptionsDefault.gqlUrnWithoutProject;
    this.handlersHash = options?.handlersHash || runnerControllerOptionsDefault.handlersHash;
  };
  async _runContainer( containerName: string, dockerPort: number, options: NewContainerOptions ) {
    const { handler, forcePort, forceRestart, publish } = options;
    const { network, gqlUrnWithoutProject } = this;
    let done = false;
    let count = 30;
    let dockerRunResult;
    while (!done) {
      log('count _runContainer', { count });
      if (count < 0) return { error: 'timeout _runContainer' };
      count--;
      try {
        const command = `docker run -e PORT=${dockerPort} -e GQL_URN=deep${await this.getDelimiter()}${gqlUrnWithoutProject} -e GQL_SSL=0 --name ${containerName} ${publish ? `-p ${dockerPort}:${dockerPort}` : `--expose ${dockerPort}` } --net ${network} -d ${handler}`;
        log('command', { command });
        const dockerRunResultObject = await execAsync(command);
        log('dockerRunResultObject', JSON.stringify(dockerRunResultObject, null, 2));
        dockerRunResult = dockerRunResultObject.toString();
        log('dockerRunResultString', { dockerRunResult });
      } catch (e) {
        error('error', e);
        dockerRunResult = e.stderr;
      }
      if (dockerRunResult.indexOf('port is already allocated') !== -1) {
        if (forcePort) return { error: 'port is already allocated' };
        continue;
      } else if (dockerRunResult.indexOf('is already in use by container') !== -1) {
        if (!forceRestart) return { error: 'is already in use by container' };
        await this._dropContainer(containerName);
      } else {
        done = true;

        // execute docker inspect 138d60d2a0fd040bfe13e80d143de80d
        let host = +DOCKER ? 'host.docker.internal' : 'localhost';
        if (!publish) {
          const inspectResult = (await execAsync(`docker inspect ${containerName}`)).toString();
          const inspectJSON = JSON.parse(inspectResult)
          host = inspectJSON?.[0]?.NetworkSettings?.Networks?.[network]?.IPAddress;
        }
        const container = { name: containerName, host, port: dockerPort };
        log('container', container);
        
        // wait on
        await execAsync(`npx wait-on --timeout 5000 http-get://${host}:${dockerPort}/healthz`);

        return container;
      }
    }
  }
  async _waitContainer( containerName: string ) {
    const { runContainerHash } = this;
    let done = false;
    let count = 100;
    while (!done) {
      log('count _waitContainer', { count });
      if (count < 0) return { error: 'timeout _waitContainer' };
      count--;

      if (runContainerHash[containerName]) {
        await delay(1000);
      } else {
        done = true;
      }
    }
  }
  async getDelimiter() {
    if (this.delimiter) return this.delimiter;
    const versionResult = await execAsync(`docker-compose version --short`);
    log('versionResult', { versionResult });
    const majorVersion = versionResult?.stdout?.match(/\d+/)[0];
    log('majorVersion', { majorVersion });
    this.delimiter = majorVersion === '1' ? '_' : '-';
    return this.delimiter;
  }

  async newContainer( options: NewContainerOptions ): Promise<Container> {
    const { handler, forcePort, forceName } = options;
    const { network, handlersHash, runContainerHash } = this;
    log('options, network, handlersHash', { options, network, handlersHash });
    const containerName = forceName || `deep${await this.getDelimiter()}${crypto.createHash('md5').update(handler).digest("hex")}`;
    log('containerName, forceName', { containerName, forceName });
    let container = await this.findContainer(containerName);
    if (container) return container;
    let dockerPort = forcePort || await getPort();
    
    let done = false;
    let count = 30;
    while (!done) {
      log('count findPort', { count });
      if (count < 0) return { error: 'timeout findPort' };
      count--;
      if (runContainerHash[containerName]) {
        await this._waitContainer(containerName);
        if (!!handlersHash[containerName]) {
          container = handlersHash[containerName];
        }
      }
      else {
        runContainerHash[containerName] = true;
        container = await this._runContainer(containerName, dockerPort, options);
      }
      if (!!container && !container?.error) {
        done = true;
        handlersHash[containerName] = container;
        runContainerHash[containerName] = undefined;
      }
      if (!done && !forcePort) dockerPort = await getPort();
    }
    return container;
  }
  async findContainer( containerName: string ) {
    const { handlersHash, runContainerHash } = this;
    log('findContainer hashes', { handlersHash, runContainerHash });
    return handlersHash[containerName];
  }
  async _dropContainer( containerName: string ) {
    log('_dropContainer', containerName);
    return (await execAsync(`docker stop ${containerName} && docker rm ${containerName}`)).toString();
  }
  async dropContainer( container: Container ) {
    const { handlersHash } = this;
    if (!handlersHash[container.name]) return;
    let dockerStopResult = await this._dropContainer(container.name);
    handlersHash[container.name] = undefined;
    log('dockerStopResult', { dockerStopResult });
  }
  async initHandler( container: Container ): Promise<{ error?: string; }> {
    const { host, port } = container;
    let initResult;
    try {
      const initRunner = `http://${host}:${port}/init`
      log('initRunner', { initRunner })
      initResult = await axios.post(initRunner);
      log('initResult', { initResult: initResult.toString() });
    } catch (e) {
      error('error', e);
      return ({ error: e });
    }
    if (initResult?.data?.error) return { error: initResult?.data?.error};
    return {};
  }
  async callHandler( options: CallOptions ): Promise<{ error?: string; }> {
    const { container } = options;
    try {
      const callRunner = `http://${container.host}:${container.port}/call`
      log('callRunner', { callRunner, params: options })
      const result = await axios.post(callRunner, { params: options });
      if (result?.data?.error) return { error: result?.data?.error };
      if (result?.data?.resolved) {
        return result.data.resolved;
      }
      return Promise.reject(result?.data?.rejected);
    } catch (e) {
      error('error', e);
      return ({ error: e });
    }
  }
}