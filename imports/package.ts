import { DeepClient } from './client';

/**
 * Represents a deep package
 * 
 * @remarks
 * This class intended to be extended by packages  
 * 
 * @example
```ts
const package = nwe Package({deep});
const {name: packageName} = package;
const batteryLevelValueLinkId = await package.batteryLevelValue.id();
```
  */
export class Package {
  public deep: DeepClient;
  /**
   * Name of the package
   */
  public name: string;

  constructor(param: PackageConstructorParam) {
    this.deep = param.deep;
    this.name = param.name;
  }

  public createEntity(...names: string[]) {
    return {
      id: async () => {
        return await this.id(this.name, ...names);
      },
      idLocal: async () => {
        return await this.idLocal(this.name, ...names);
      },
    };
  }

  async id(...names: string[]) {
    return await this.deep.id(this.name, ...names);
  }

  idLocal(...names: string[]) {
    return this.deep.idLocal(this.name, ...names);
  }

}

export interface PackageConstructorParam {
  name: string;
  deep: DeepClient;
}
