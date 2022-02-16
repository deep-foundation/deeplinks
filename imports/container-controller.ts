import { execSync } from 'child_process';
import crypto from 'crypto';
import axios from 'axios';
import getPort from 'get-port';
import Debug from 'debug';

const debug = Debug('deeplinks:container-controller');

export interface ContainerControllerOptions {
  gqlURN: string;
  network: string;
  portsHash?: any;
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
  gqlURN: 'deep_deeplinks_1:3006',
  network: 'deep_network',
  portsHash: {},
  handlersHash: {},
};

export class ContainerController {
  gqlURN: string;
  network: string;
  docker: number;
  portsHash: { [id: number]: string } = {};
  handlersHash: { [id: string]: Container } = {};
  constructor(options?: ContainerControllerOptions) {
    this.network = options?.network || runnerControllerOptionsDefault.network;
    this.gqlURN = options?.gqlURN || runnerControllerOptionsDefault.gqlURN;
    this.handlersHash = options?.handlersHash || runnerControllerOptionsDefault.handlersHash;
  };
  async _findPort(): Promise<number> {
    const { portsHash } = this;
    let dockerPort;
    debug('portsHash', { portsHash });
    do {
      dockerPort = await getPort();
    } while (portsHash[dockerPort])
    return dockerPort;
  }
  async newContainer( options: NewContainerOptions ): Promise<Container> {
    const { handler, forcePort, forceName, forceRestart, publish } = options;
    const { network, handlersHash, gqlURN } = this;
    debug('options, network, handlersHash', { options, network, handlersHash });
    const containerName = forceName || crypto.createHash('md5').update(handler).digest("hex");
    debug('containerName, forceName', { containerName, forceName });
    let container = await this.findContainer(containerName);
    if (container) return container;
    let dockerPort = forcePort || await this._findPort();
    let dockerRunResult;
    let done = false;
    let count = 30;
    while (!done) {
      debug('count', { count });
      if (count < 0) return { error: 'timeout findPort' };
      count--;
      try {
        const command = `docker run -e PORT=${dockerPort} -e GQL_URN=${gqlURN} -e GQL_SSL=0 --name ${containerName} ${publish ? `-p ${dockerPort}:${dockerPort}` : `--expose ${dockerPort}` } --net ${network} -d ${handler}`;
        debug('command', { command });
        dockerRunResult = execSync(command).toString();
        debug('dockerRunResult', { dockerRunResult });
      } catch (e) {
        debug('error', e);
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
        const inspectResult = execSync(`docker inspect ${containerName}`).toString();
        const inspectJSON = JSON.parse(inspectResult)
        const ip = inspectJSON?.[0]?.NetworkSettings?.Networks?.deep_network?.IPAddress;
        container = { name: containerName, host: ip, port: dockerPort };

        // wait on
        execSync(`npx wait-on http://${ip}:${dockerPort}/healthz`);

        handlersHash[containerName] = container;
        // handlersHash[containerName] = dockerPort;
        // portsHash[dockerPort] = publish ? 'localhost' : containerName;
      }
      if (!done && !forcePort) dockerPort = await this._findPort();
    }
    return container;
  }
  async findContainer( containerName: string ) {
    const { handlersHash } = this;
    return handlersHash[containerName];
  }
  async _dropContainer( containerName: string ) {
    return await execSync(`docker stop ${containerName} && docker rm ${containerName}`).toString();
  }
  async dropContainer( container: Container ) {
    const { handlersHash } = this;
    if (!handlersHash[container.name]) return;
    let dockerStopResult = await this._dropContainer(container.name);
    handlersHash[container.name] = undefined;
    debug('dockerStopResult', { dockerStopResult });
  }
  async initHandler( container: Container ): Promise<{ error?: string; }> {
    const { host, port } = container;
    let initResult;
    try {
      const initRunner = `http://${host}:${port}/init`
      debug('initRunner', { initRunner })
      initResult = await axios.post(initRunner);
      debug('initResult', { initResult: initResult.toString() });
    } catch (e) {
      debug('error', e);
      return ({ error: e });
    }
    if (initResult?.data?.error) return { error: initResult?.data?.error};
    return {};
  }
  async callHandler( options: CallOptions ): Promise<{ error?: string; }> {
    const { container } = options;
    try {
      const callRunner = `http://${container.host}:${container.port}/call`
      debug('callRunner', { callRunner, params: options })
      const result = await axios.post(callRunner, { params: options });
      if (result?.data?.error) return { error: result?.data?.error };
      if (result?.data?.resolved) {
        return result.data.resolved;
      }
      return Promise.reject(result?.data?.rejected);
    } catch (e) {
      debug('error', e);
      return ({ error: e });
    }
  }
}