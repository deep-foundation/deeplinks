import { execSync } from 'child_process';
import crypto from 'crypto';
import axios from 'axios';
import getPort from 'get-port';
import Debug from 'debug';

const debug = Debug('deeplinks:imports:runner-controller');

export interface runnerControllerOptions {
  network: string;
  portsHash: any;
  handlersHash: any;
}

export interface handlerOptions {
  handler: string,
  code: string,
  jwt: string,
  data: any
  port?: number;
}

export const runnerControllerOptionsDefault: runnerControllerOptions = {
  network: 'deep-network',
  portsHash: {},
  handlersHash: {}
};

export class RunnerController {
  network: string;

  portsHash: { [id: number]: string } = {};
  handlersHash: { [id: string]: number } = {};
  constructor(options?: runnerControllerOptions) {
    this.network = options?.network || runnerControllerOptionsDefault.network;
    this.portsHash = options?.portsHash || runnerControllerOptionsDefault.portsHash;
    this.handlersHash = options?.handlersHash || runnerControllerOptionsDefault.handlersHash;
  };
  async useHandler( options: handlerOptions ): Promise<{ error?: string; }> {
    const { handler, port } = options;
    const { network, handlersHash, portsHash } = this;
    if (handlersHash[handler] && portsHash[handlersHash[handler]] !== 'broken') return this.callHandler(options);
    const containerName = crypto.createHash('md5').update(handler).digest("hex");
    let dockerPort = port || await getPort();
    while (portsHash[port]) {
      dockerPort = await getPort();
    }
    portsHash[dockerPort] = handler;
    handlersHash[handler] = dockerPort;
    const startDocker = `docker run -e PORT=${dockerPort} --name ${containerName} --expose ${dockerPort} --net ${network} -d ${handler} && npx -q wait-on --timeout 20000 ${containerName}:${dockerPort}/healthz`;
    let startResult;
    try {
      startResult = await execSync(startDocker).toString();
    } catch (e){
      startResult = e.stderr;
    }
    debug('startResult', { startResult });

    while (startResult.indexOf('port is already arllocated') !== -1) {
      // fix hash that this port is busy
      portsHash[port] = 'broken';
      dockerPort = await getPort();
      portsHash[dockerPort] = containerName;
      const RestartDocker = `docker run -e PORT=${dockerPort} --name ${containerName} --expose ${dockerPort} --net ${network} -d ${handler} && npx -q wait-on --timeout 20000 ${containerName}:${dockerPort}/healthz`;
      const startResult = await execSync(RestartDocker).toString();
      debug('RestartResult', { startResult });
    }
    return await this.initHandler({...options, port: dockerPort});
  }
  async initHandler( options: handlerOptions ): Promise<{ error?: string; }> {
    const { portsHash } = this;
    const { port } = options;
    let initResult;
    try {
      initResult = await axios.post(`http://${portsHash[port]}:${port}/init`);
      debug('initResult', { initResult });
    } catch (e) {
      debug('error', e);
      return ({ error: e });
    }
    if (initResult?.data?.error) return { error: initResult?.data?.error};
    return await this.callHandler(options);
  }
  async callHandler( options: handlerOptions ): Promise<{ error?: string; }> {
    const { port, data, code, jwt } = options;
    const { portsHash } = this;
    try {
      const result = await axios.post(`http://${portsHash[port]}:${port}/call`,  { params: { data, code, jwt, }});
      if (result?.data?.error) return { error: result?.data?.error};
      if(result?.data?.resolved) {
        return result.data.resolved;
      }
      return Promise.reject(result?.data?.rejected);
    } catch (e) {
      debug('error', e);
      return ({ error: e });
    }
  }
}