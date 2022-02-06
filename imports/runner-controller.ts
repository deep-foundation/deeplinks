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

export interface handlerOptions {
  handler: string,
  code: string,
  jwt: string,
  data: any
  port?: number;
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
  async useHandler( options: handlerOptions ): Promise<{ error?: string; }> {
    const { handler, port } = options;
    const { network, handlersHash, portsHash, docker, gqlURN } = this;
    console.log({ handlersHash, portsHash });
    const containerName = crypto.createHash('md5').update(handler).digest("hex");
    if (handlersHash[containerName] && portsHash[handlersHash[containerName]] !== 'broken') return this.callHandler({ ...options, port: handlersHash[containerName] });
    let dockerPort = port || await getPort();
    while (portsHash[port]) {
      dockerPort = await getPort();
    }
    portsHash[dockerPort] = containerName;
    handlersHash[containerName] = dockerPort;
    const startDocker = `docker run -e PORT=${dockerPort} -e GQL_URN=${gqlURN} -e GQL_SSL=0 --name ${containerName} ${docker ? `--expose ${dockerPort}` : `-p ${dockerPort}:${dockerPort}` } --net ${network} -d ${handler} && npx wait-on http://${docker ? portsHash[dockerPort] : 'localhost'}:${dockerPort}/healthz`;
    console.log('startDocker', { startDocker });
    let startResult;
    try {
      startResult = await execSync(startDocker).toString();
    } catch (e){
      startResult = e.stderr;
    }
    console.log('startResult', { startResult: startResult.toString() });

    while (startResult.indexOf('port is already arllocated') !== -1) {
      // fix hash that this port is busy
      portsHash[port] = 'broken';
      dockerPort = await getPort();
      portsHash[dockerPort] = containerName;
      const RestartDocker = `docker run -e PORT=${dockerPort} -e GQL_URN=${gqlURN} -e GQL_SSL=0 --name ${containerName} ${docker ? `--expose ${dockerPort}` : `-p ${dockerPort}:${dockerPort}` } --net ${network} -d ${handler} && npx wait-on http://${docker ? containerName : 'localhost'}:${dockerPort}/healthz`;
      console.log('already arllocated, RestartDocker', { RestartDocker });
      const startResult = await execSync(RestartDocker).toString();
      console.log('RestartResult', { startResult });
    }
    if (startResult.indexOf('is already in use by container') !== -1){
      const RestartDocker = `docker stop ${containerName} && docker rm ${containerName} && docker run -e PORT=${dockerPort} -e GQL_URN=${gqlURN} -e GQL_SSL=0 --name ${containerName} ${docker ? `--expose ${dockerPort}` : `-p ${dockerPort}:${dockerPort}` } --net ${network} -d ${handler} && npx wait-on http://${docker ? containerName : 'localhost'}:${dockerPort}/healthz`;
      console.log('already in use, RestartDocker', { RestartDocker });
      try {
        await execSync(RestartDocker).toString();
        console.log('RestartResult', { startResult: startResult.toString() });
      } catch (e){
        console.log('error', e);
        return ({ error: e });
      }
    }
    return await this.initHandler({...options, port: dockerPort});
  }
  async initHandler( options: handlerOptions ): Promise<{ error?: string; }> {
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
    return await this.callHandler(options);
  }
  async callHandler( options: handlerOptions ): Promise<{ error?: string; }> {
    const { port, data, code, jwt } = options;
    const { portsHash, docker } = this;
    try {
      const callRunner = `http://${docker ? portsHash[port] : 'localhost'}:${port}/call`
      console.log('callRunner', { callRunner, params: { data, code, jwt } })
      const result = await axios.post(callRunner,  { params: { data, code, jwt }});
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