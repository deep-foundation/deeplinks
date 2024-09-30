import { DeepClient } from "./client.js";
import { Id, Link } from "./minilinks.js";
import fs from 'fs';
import path from 'path';
import { Package } from "./packager.js";
import _ from 'lodash';;

export class Packages {
  deep: DeepClient<Link<Id>>;
  constructor(deep) {
    this.deep = deep;
  }
  async select(query) {
    const deep = this.deep;
    const _and = [{
      type_id: deep.idLocal('@deep-foundation/core', 'Package'),
      string: { value: { _neq: 'deep' } },
    }];
    if (query) _and.push(query);
    return await deep.select({
      _and,
    });
  }
  async export(query): Promise<{ [name: string]: Package }> {
    const deep = this.deep;
    const packager = deep.Packager();
    const { data: packages } = await this.select(query);
    console.log('export packages', packages.map(p => p.id).join(', '));
    const results = {};
    for (let i = 0; i < packages.length; i++) {
      const p = packages[i];
      console.log('export package', `${p.id} ${p?.value?.value}`);
      const pckg = await packager.export({ packageLinkId: p.id });
      console.log('exported package', `${pckg.package.name} ${pckg.package.version}`);
      if (pckg.errors) console.log(JSON.stringify(pckg.errors, null, 2));
      results[_.camelCase(`${pckg.package.name}@${pckg.package.version}`)] = pckg;
    }
    return results;
  }
  async write(address: string, pckgs: { [name: string]: Package }) {
    const packages = Object.values(pckgs);
    const deep = this.deep;
    console.log('write packages', Object.keys(pckgs).join(','));
    for (let i = 0; i < packages.length; i++) {
      const p = packages[i];
      fs.writeFileSync(
        path.join(address, _.camelCase(`${p?.package?.name}@${p.package.version}`))+'.json',
        JSON.stringify(p, null, 2),
        { encoding: 'utf-8' },
      );
      console.log('writeed package', `${path.join(address, _.camelCase(`${p?.package?.name}@${p.package.version}`))}`);
    }
  }
  async read(address: string): Promise<{ [name: string]: Package }> {
    const deep = this.deep;
    const packager = deep.Packager();
    const pckgs = fs.readdirSync(address);
    console.log(`read packages from ${address} ${pckgs.join(', ')}`);
    const results = {};
    for (let i = 0; i < pckgs.length; i++) {
      if (pckgs[i].slice(-5) === '.json' && pckgs[i] != 'deep.config.json') {
        console.log('read package', path.join(address, pckgs[i]));
        const json = fs.readFileSync(path.join(address, pckgs[i]), { encoding: 'utf-8' });
        try {
          const pckg = JSON.parse(json);
          results[_.camelCase(`${pckg.package.name}@${pckg.package.version}`)] = pckg;
        } catch(e) {
          console.log('error read package', e);
        }
      }
    }
    return results;
  }
  async import(pckgs: { [name: string]: Package }): Promise<{ [name: string]: Package }> {
    const deep = this.deep;
    const packager = deep.Packager();
    const packages = Object.values(pckgs);
    console.log(`import packages from ${Object.keys(pckgs).join(', ')}`);
    const results = {};
    for (let i = 0; i < packages.length; i++) {
      const p = packages[i];
      console.log(`import package ${_.camelCase(`${p.package.name}@${p.package.version}`)}`);
      results[_.camelCase(`${p.package.name}@${p.package.version}`)] = await packager.import(p);
    }
    return results;
  }
};