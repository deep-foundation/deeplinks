import { DeepClient } from './client';

/**
 * Represents a deep package
 * 
 * @remarks
 * This class intended to be extended by packages  
 * 
 * @example
```ts
const package = new Package({deep, name});
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

  constructor(param: PackageOptions) {
    this.deep = param.deep;
    this.name = param.name;
  }

  /**
   * Creates an entity
   * 
   * @example
   * #### Create an entity
```ts
class MyPackage extends Package {
  public yourLinkName = this.createEntity("YourLinkName");
}
const myPackage = new MyPackage({deep});
const myLinkId = await myPackage.yourLinkName.id();
const myLinkLocalId = await myPackage.yourLinkName.idLocal();
```
   */
  public createEntity(name: string) {
    return {
      /**
       * Gets id of the link
       * 
       * @example
       * #### Get id of the link
```ts
const myPackage = new MyPackage({deep});
const myLinkId = await myPackage.yourLinkName.id();
```
       */
      id: async () => {
        return await this.id(name);
      },
      /**
       * Gets id of the link from minilinks
       * 
       * @example
       * #### Get id of the link from minilinks
```ts
const myPackage = new MyPackage({deep});
const myLinkLocalId = await myPackage.yourLinkName.idLocal();
```
       */
      idLocal: () => {
        return this.idLocal(name);
      },
      /**
       * Name of the link
       */
      name: name
    };
  }

  /**
   * Gets id of the package link
   * 
   * @example
   * #### Get id of the package link
```ts
const package = new Package({deep});
const myLinkId = await package.id("MyLinkName");
```
   */
  async id(...names: string[]) {
    return await this.deep.id(this.name, ...names);
  }

    /**
   * Gets id of the package link from minilinks
   * 
   * @example
   * #### Get id of the package link from minilinks
```ts
const package = new Package({deep});
await package.applyMiniLinks();
const myLinkId = await package.idLocal("MyLinkName");
```
   */
  idLocal(...names: string[]) {
    return this.deep.idLocal(this.name, ...names);
  }

  /**
   * Pastes your links into minilinks
   * 
   * @example
   * #### Use applyMiniLinks and idLocal
```ts
const package = new Package({deep});
await package.applyMiniLinks();
const deviceLinkId = await package.Device.idLocal();
```
   */
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

export interface PackageOptions {
  name: string;
  deep: DeepClient;
}
