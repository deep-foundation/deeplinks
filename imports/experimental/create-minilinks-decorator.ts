import { MinilinkCollection } from "../minilinks"

export function createMinilinksDecorator<TMinilinks extends MinilinkCollection>(minilinks: TMinilinks): MinilinksDecorator<TMinilinks> {
  const result: MinilinksDecorator<TMinilinks> = Object.assign({
    id: function (this: MinilinksDecorator<TMinilinks>, pathItems: [string, ...Array<string>]) {
        const result = this.idOrNull(pathItems)
        if(result === null) throw new Error(`Minilink Error: id not found by path ${pathItems.join('/')}`)
        return result
    },
    idOrNull: function (this: TMinilinks, pathItems: [string, ...Array<string>]) {
      const result = this.query({
        id: {
          _id: pathItems
        }
      })
      if (result.length === 0) return null;
      return result[0].id
    }
  } , minilinks)
  return result;
}

export type MinilinksDecorator<TMinilinks extends MinilinkCollection> = TMinilinks & {
  id(this: MinilinksDecorator<TMinilinks>, pathItems: [string, ...Array<string>]): number;
  idOrNull(this: MinilinksDecorator<TMinilinks>, pathItems: [string, ...Array<string>]): number | null;
}
