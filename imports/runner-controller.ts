import { execSync } from 'child_process';
import crypto from 'crypto';
import axios from 'axios';
import getPort from 'get-port';
import Debug from 'debug';

const debug = Debug('deeplinks:runner-controller');

export interface runnerControllerOptions {
  gqlURN: string;
  network: string;
  portsHash?: any;
  handlersHash?: any;
}

export interface newContainerOptions {
  handler: string,
  code: string,
  jwt: string,
  data: any
  forceName?: string;
  forcePort?: number;
  forceRestart?: boolean;
  publish?: boolean;
}
export interface initOptions {
  port: number;
}
export interface container {
  name?: string;
  host?: string;
  port?: number;
  error?: string;
}
export interface callOptions {
  code: string;
  jwt: string,
  data: any
  container: container;
}

export const runnerControllerOptionsDefault: runnerControllerOptions = {
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
  handlersHash: { [id: string]: container } = {};
  constructor(options?: runnerControllerOptions) {
    this.network = options?.network || runnerControllerOptionsDefault.network;
    this.gqlURN = options?.gqlURN || runnerControllerOptionsDefault.gqlURN;
    // this.portsHash = options?.portsHash || runnerControllerOptionsDefault.portsHash;
    this.handlersHash = options?.handlersHash || runnerControllerOptionsDefault.handlersHash;
  };
  async _findPort(): Promise<number> {
    const { portsHash } = this;
    let dockerPort;
    console.log({ portsHash });
    do {
      dockerPort = await getPort();
    } while (portsHash[dockerPort])
    return dockerPort;
  }
  async newContainer( options: newContainerOptions ): Promise<container> {
    const { handler, forcePort, forceName, forceRestart, publish } = options;
    const { network, handlersHash, portsHash, gqlURN } = this;
    console.log({ handlersHash, portsHash });
    const containerName = forceName || crypto.createHash('md5').update(handler).digest("hex");
    console.log({ containerName, forceName });
    let container = await this.findContainer(containerName);
    if (container) return container;
    let dockerPort = forcePort || await this._findPort();
    let dockerRunResult;
    let done = false;
    let count = 30;
    while (!done) {
      console.log({ count });
      if (count < 0) return { error: 'timeout findPort' };
      count--;
      try {
        const command = `docker run -e PORT=${dockerPort} -e GQL_URN=${gqlURN} -e GQL_SSL=0 --name ${containerName} ${publish ? `-p ${dockerPort}:${dockerPort}` : `--expose ${dockerPort}` } --net ${network} -d ${handler}`;
        // ${ DOCKER && !publish || !DOCKER && publish ? `&& npx wait-on http://${publish ? 'localhost' : containerName}:${dockerPort}/healthz` : ''}
        console.log({ command });
        dockerRunResult = execSync(command).toString();
        console.log('dockerRunResult', { dockerRunResult });
      } catch (e) {
        console.log('error', e);
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
  async dropContainer( container: container ) {
    const { handlersHash } = this;
    if (!handlersHash[container.name]) return;
    let dockerStopResult = await this._dropContainer(container.name);
    handlersHash[container.name] = undefined;
    console.log('dockerStopResult', { dockerStopResult });
  }
  async initHandler( container: container ): Promise<{ error?: string; }> {
    const { portsHash } = this;
    const { host, port } = container;
    let initResult;
    try {
      const initRunner = `http://${host}:${port}/init`
      console.log('initRunner', { initRunner })
      initResult = await axios.post(initRunner);
      console.log('initResult', { initResult: initResult.toString() });
    } catch (e) {
      console.log('error', e);
      return ({ error: e });
    }
    if (initResult?.data?.error) return { error: initResult?.data?.error};
    return {};
  }
  async callHandler( options: callOptions ): Promise<{ error?: string; }> {
    const { code, container, data, jwt } = options;
    const { portsHash, docker } = this;
    try {
      const callRunner = `http://${container.host}:${container.port}/call`
      console.log('callRunner', { callRunner, params: options })
      const result = await axios.post(callRunner,  { params: options});
      if (result?.data?.error) return { error: result?.data?.error};
      if(result?.data?.resolved) {
        return result.data.resolved;
      }
      return Promise.reject(result?.data?.rejected);
    } catch (e) {
      console.log('error', e);
      return ({ error: e });
    }
  }
}