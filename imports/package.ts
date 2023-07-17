import { DeepClient } from './client';

/**
 * Represents a deep package
 * 
 * @remarks
 * This class intended to be extended by packages  
 * 
 * @example
```ts
const package = new Package({deep});
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

  // TODO: test this draft
  async applyMiniLinks() {
    const {data: packageLinks} = await this.deep.select({
      up: {
        tree_id: {
          _id: ["@deep-foundation/core", 'containTree']
        },
        parent_id: {
          _id: [this.name]
        }
      }
    })
    if(!packageLinks) {
      throw new Error(`Package with name ${this.name} is not found`)
    }
    this.deep.minilinks.apply(packageLinks)
  }
}

export interface PackageConstructorParam {
  name: string;
  deep: DeepClient;
}
