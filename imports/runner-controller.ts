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
  docker: number;
}

export interface findPortOptions {
  handler: string,
  code: string,
  jwt: string,
  data: any
  forceName?: string;
  forcePort?: number;
}
export interface initOptions {
  port: number;
}
export interface callOptions {
  code: string;
  jwt: string,
  data: any
  port: number;
}

export const runnerControllerOptionsDefault: runnerControllerOptions = {
  gqlURN: 'deep_deeplinks_1:3006',
  network: 'deep_network',
  portsHash: {},
  handlersHash: {},
  docker: 0
};

export class RunnerController {
  gqlURN: string;
  network: string;
  docker: number;
  portsHash: { [id: number]: string } = {};
  handlersHash: { [id: string]: number } = {};
  constructor(options?: runnerControllerOptions) {
    this.network = options?.network || runnerControllerOptionsDefault.network;
    this.gqlURN = options?.gqlURN || runnerControllerOptionsDefault.gqlURN;
    this.docker = options?.docker || runnerControllerOptionsDefault.docker;
    this.portsHash = options?.portsHash || runnerControllerOptionsDefault.portsHash;
    this.handlersHash = options?.handlersHash || runnerControllerOptionsDefault.handlersHash;
  };
  async findPort( options: findPortOptions ): Promise<{port?: number; error?: string}> {
    const { handler, forcePort, forceName } = options;
    const { network, handlersHash, portsHash, docker, gqlURN } = this;
    console.log({ handlersHash, portsHash });
    const containerName = forceName || crypto.createHash('md5').update(handler).digest("hex");
    if (handlersHash[containerName]) return { port: handlersHash[containerName] };
    let dockerPort = forcePort || await getPort();
    let dockerRunResult;
    let done = false;
    let count = 30;
    while (!done) {
      console.log({ count });
      if (count < 0) return { error: 'timeout findPort' };
      count--;
      try {
        dockerRunResult = execSync(`docker run -e PORT=${dockerPort} -e GQL_URN=${gqlURN} -e GQL_SSL=0 --name ${containerName} ${docker ? `--expose ${dockerPort}` : `-p ${dockerPort}:${dockerPort}` } --net ${network} -d ${handler} && npx wait-on http://${docker ? portsHash[dockerPort] : 'localhost'}:${dockerPort}/healthz`).toString();
        console.log('dockerRunResult', { dockerRunResult });
      } catch (e) {
        dockerRunResult = e.stderr;
      }
      if (dockerRunResult.indexOf('port is already arllocated') !== -1) {
        continue;
      } else if (dockerRunResult.indexOf('is already in use by container') !== -1) {
        let dockerStopResult = await execSync(`docker stop ${containerName} && docker rm ${containerName}`).toString();
        console.log('dockerStopResult', { dockerStopResult });
      } else {
        done = true;
        handlersHash[containerName] = dockerPort;
        portsHash[dockerPort] = containerName;
      }
      if (!done) while (portsHash[dockerPort]) {
        dockerPort = await getPort();
      }
    }
    return { port: dockerPort };
  }
  async initHandler( options: initOptions ): Promise<{ error?: string; }> {
    const { portsHash, docker } = this;
    const { port } = options;
    let initResult;
    try {
      const initRunner = `http://${docker ? portsHash[port] : 'localhost'}:${port}/init`
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
    const { code, port, data, jwt } = options;
    const { portsHash, docker } = this;
    try {
      const callRunner = `http://${docker ? portsHash[port] : 'localhost'}:${port}/call`
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