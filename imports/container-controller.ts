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
  gql_docker_domain: string;
  gql_port_path: string;
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
  options?: NewContainerOptions;
  error?: string;
}
export interface CallOptions {
  code: string;
  jwt: string,
  data: any
  container: Container;
}

export const runnerControllerOptionsDefault: ContainerControllerOptions = {
  gql_docker_domain: 'links',
  gql_port_path: '3006/gql',
  network: 'network',
  handlersHash: {},
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export class ContainerController {
  gql_docker_domain: string;
  gql_port_path: string;
  network: string;
  delimiter: string;
  runContainerHash: { [id: string]: Promise<any> } = {};
  handlersHash: { [id: string]: Container } = {};
  constructor(options?: ContainerControllerOptions) {
    this.network = options?.network || runnerControllerOptionsDefault.network;
    this.gql_docker_domain = options?.gql_docker_domain || runnerControllerOptionsDefault.gql_docker_domain;
    this.gql_port_path = options?.gql_port_path || runnerControllerOptionsDefault.gql_port_path;
    this.handlersHash = options?.handlersHash || runnerControllerOptionsDefault.handlersHash;
  };
  async _runContainer( containerName: string, dockerPort: number, options: NewContainerOptions ) {
    const { handler, forcePort, forceRestart, publish } = options;
    const { network, gql_docker_domain, gql_port_path } = this;
    let done = false;
    let count = 30;
    let dockerRunResult;
    while (!done) {
      log('_runContainer count', { count });
      if (count < 0) return { error: 'timeout _runContainer' };
      count--;
      try {
        const command = `docker pull ${handler}; docker run -e PORT=${dockerPort} -e GQL_URN=deep${await this.getDelimiter()}${gql_docker_domain}${await this.getDelimiter()}1:${gql_port_path} -e GQL_SSL=0 --name ${containerName} ${publish ? `-p ${dockerPort}:${dockerPort}` : `--expose ${dockerPort}` } --net ${network} -d ${handler}`;
        log('_runContainer command', { command });
        const dockerRunResultObject = await execAsync(command);
        log('_runContainer dockerRunResultObject', JSON.stringify(dockerRunResultObject, null, 2));
        dockerRunResult = dockerRunResultObject?.stdout;
        log('_runContainer dockerRunResultString', { dockerRunResult });
      } catch (e) {
        dockerRunResult = e.stderr;
      }
      if (dockerRunResult.indexOf('port is already allocated') !== -1) {
        error('port is already allocated');
        if (forcePort) return { error: 'port is already allocated' };
        continue;
      } else if (dockerRunResult.indexOf('is already in use by container') !== -1) {
        error('is already in use by container');
        if (!forceRestart) return { error: 'is already in use by container' };
        await this._dropContainer(containerName);
      } else {
        done = true;

        // execute docker inspect 138d60d2a0fd040bfe13e80d143de80d
        if (!publish && !+DOCKER) throw new Error('Need proxy, dl issue https://github.com/deep-foundation/deeplinks/issues/45')
        let host = publish ? +DOCKER ? 'host.docker.internal' : 'localhost' : +DOCKER ? containerName : '';
        const container = { name: containerName, host, port: dockerPort, options };
        log('_runContainer container', container);
        
        // wait on
        const waitResult = await execAsync(`npx wait-on --timeout 5000 http-get://${host}:${dockerPort}/healthz`);
        log('_runContainer npx done', { waitResult });

        return container;
      }
    }
  }
  async getDelimiter() {
    if (this.delimiter) return this.delimiter;
    const versionResult = await execAsync(`docker-compose version --short`);
    log('getDelimiter versionResult', { versionResult });
    const majorVersion = versionResult?.stdout?.match(/\d+/)[0];
    log('getDelimiter majorVersion', { majorVersion });
    this.delimiter = majorVersion === '1' ? '_' : '-';
    return this.delimiter;
  }

  async newContainer( options: NewContainerOptions ): Promise<Container> {
    const { handler, forcePort, forceName } = options;
    const { network, handlersHash, runContainerHash } = this;
    const containerName = forceName || `deep${await this.getDelimiter()}${crypto.createHash('md5').update(handler).digest("hex")}`;
    log('newContainer options, network, handlersHash, containerName, forceName', { options, network, handlersHash, containerName, forceName });
    let container = await this.findContainer(containerName);
    log('newContainer container', { container });
    if (container) return container;
    let dockerPort = forcePort || await getPort();
    runContainerHash[containerName] = new Promise(async (resolve)=> {
      let done = false;
      let count = 10;
      while (!done){
        log('newContainer while count', { count });
        count--;
        container = await this._runContainer(containerName, dockerPort, options);
        log('newContainer while container', { container });
        if ( container?.error) {
          if (!forcePort) dockerPort = await getPort();
          continue;
        }
        handlersHash[containerName] = container;
        log('newContainer done true', { containerName, handlersHash, runContainerHash});
        done=true;
      }
      resolve(undefined);
    });
    await runContainerHash[containerName];
    return handlersHash[containerName];
  }
  async findContainer( containerName: string ) {
    const { handlersHash, runContainerHash } = this;
    await runContainerHash[containerName]
    return handlersHash[containerName];
  }
  async _dropContainer( containerName: string ) {
    log('_dropContainer', { containerName });
    return (await execAsync(`docker stop ${containerName} && docker rm ${containerName}`))?.stdout;
  }
  async dropContainer( container: Container ) {
    const { handlersHash, runContainerHash } = this;
    await runContainerHash[container.name];
    if (!handlersHash[container.name]) return;
    let dockerStopResult = await this._dropContainer(container.name);
    handlersHash[container.name] = undefined;
    log('dropContainer dockerStopResult', { dockerStopResult });
  }
  async _chekAndRestart(container: Container ): Promise<{ error?: string; }> {
    const { handlersHash, runContainerHash } = this;
    try {
      const healthz = `http://${container.host}:${container.port}/healthz`
      await axios.get(healthz);
      return { error: 'healthz ok'};
    } catch (e) {
      error('heatlthz error code', e.code);
      runContainerHash[container.name] = new Promise(async(resolve)=> {
        handlersHash[container.name] = undefined;
        container.options.forcePort = container.port
        container.options.forceName = container.name;
        const newContainer = await this._runContainer(container.name, container.port, container.options);
        handlersHash[container.name] = newContainer;
        resolve(undefined);
      });
      await runContainerHash[container.name];
      log('_chekAndRestart handlersHash[container.name]', handlersHash[container.name]);
      return handlersHash[container.name];
    }
  }
  async initHandler( container: Container ): Promise<{ error?: string; }> {
    const { runContainerHash } = this;
    const { host, port } = container;
    let initResult;
    await runContainerHash[container.name];
    try {
      const initRunner = `http://${host}:${port}/init`
      log('initHandler initRunner', { initRunner })
      initResult = await axios.post(initRunner);
      log('initHandler initResult status', { status: initResult.status });
    } catch (e) {
      error('init error code', e.code);
      const checkResult = await this._chekAndRestart(container);
      if (checkResult?.error) return {...checkResult};
      await this.initHandler(container);
      return ({ error: e });
    }
    if (initResult?.data?.error) return { error: initResult?.data?.error};
    return {};
  }
  async callHandler( options: CallOptions ): Promise<{ error?: string; }> {
    const { handlersHash, runContainerHash } = this;
    const { container } = options;
    await runContainerHash[container.name];
    try {
      const callRunner = `http://${container.host}:${container.port}/call`
      log('callHandler', { callRunner, params: options })
      const callResult = await axios.post(callRunner, { params: options });
      log('callHandler callResult status', { status: callResult.status });
      if (callResult?.data?.error) return { error: callResult?.data?.error };
      if (callResult?.data?.resolved) {
        return callResult.data.resolved;
      }
      return Promise.reject(callResult?.data?.rejected);
    } catch (e) {
      error('call error', e);
      const checkResult = await this._chekAndRestart(container);
      if (checkResult?.error) return {...checkResult};
      await this.callHandler(options);
      return ({ error: e });
    }
  }
}