import { DeepClient } from "./client";
import { Id, Link } from "./minilinks";
import fs from 'fs';
import path from 'path';
import { Package } from "./packager";

export class Packages {
  deep: DeepClient<Link<Id>>;
  constructor(deep) {
    this.deep = deep;
  }
  async select() {
    const deep = this.deep;
    return await deep.select({
      type_id: deep.idLocal('@deep-foundation/core', 'Package'),
      string: { value: { _neq: 'deep' } },
    });
  }
  async export(address: string): Promise<{ [name: string]: Package }> {
    const deep = this.deep;
    const packager = deep.Packager();
    const { data: packages } = await this.select();
    const results = {};
    for (let i = 0; i < packages.length; i++) {
      const p = packages[i];
      const pckg = await packager.export({ packageLinkId: p.id });
      results[pckg.package.name];
    }
    return results;
  }
  async write(address: string, pckgs: { [name: string]: Package }) {
    const packages = Object.values(pckgs);
    const deep = this.deep;
    for (let i = 0; i < packages.length; i++) {
      const p = packages[i];
      fs.writeFileSync(
        path.join(address, `${p?.package?.name}@${p.package.version}`),
        JSON.stringify(p, null, 2),
        { encoding: 'utf-8' },
      );
    }
  }
  async read(address: string): Promise<{ [name: string]: Package }> {
    const deep = this.deep;
    const packager = deep.Packager();
    const pckgs = fs.readdirSync(address);
    const results = {};
    for (let i = 0; i < pckgs.length; i++) {
      if (pckgs[i].slice(-5) === '.json' && pckgs[i] != 'deep.config.json') {
        console.log(path.join(address, pckgs[i]));
        const json = fs.readFileSync(path.join(address, pckgs[i]), { encoding: 'utf-8' });
        try {
          const pckg = JSON.parse(json);
          results[pckg.package.name] = pckg;
        } catch(e) {
          console.log(e);
        }
      }
    }
    return results;
  }
  async import(pckgs: { [name: string]: Package }): Promise<{ [name: string]: Package }> {
    const deep = this.deep;
    const packager = deep.Packager();
    const packages = Object.values(pckgs);
    const results = {};
    for (let i = 0; i < packages.length; i++) {
      const p = packages[i];
      results[`${p.package.name}@${p.package.version}`] = await packager.import(p);
    }
    return results;
  }
};