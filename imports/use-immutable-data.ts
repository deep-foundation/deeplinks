import { remove } from 'lodash';
import { useEffect, useState } from "react";

export interface IData {
  nodes: any[];
  links: any[];
}

export function applyChanges(aList: any[], bList: any[], compare: (a, b) => boolean): [any[], boolean] {
  const aHash = {};
  let isChanged = false;
  for (let i = 0; i < aList.length; i++) {
    const item = aList[i];
    aHash[item.id] = item;
  }
  const bHash = {};
  for (let i = 0; i < bList.length; i++) {
    const item = bList[i];
    bHash[item.id] = item;
  }
  for (let i = 0; i < bList.length; i++) {
    const item = bList[i];
    if (aHash[item.id]) {
      if (!compare(aHash[item.id], item)) {
        // changed
        isChanged = true;
        remove(aList, i => i.id === item.id);
        aList.push(item);
      }
    } else {
      // added
      isChanged = true;
      aList.push(item);
    }
  }
  // removed
  for (let i = 0; i < aList.length; i++) {
    const item = aList[i];
    if (!bHash[item.id]) {
      isChanged = true;
      remove(aList, i => i.id === item.id);
    }
  }
  return [aList, isChanged];
};

export function useImmutableData(inD: IData, compare: (a, b) => boolean) {
  const [outD, setOutD] = useState<IData>({ nodes: [], links: [] });

  useEffect(() => {
    if (!inD.nodes.length || !inD.links.length) return;
    const [nodes, nodesChanged] = applyChanges(outD.nodes, inD.nodes, compare);
    const [links, linksChanged] = applyChanges(outD.links, inD.links, compare);
    if (nodesChanged || linksChanged) setOutD({ nodes, links });
  }, [inD]);

  return outD;
}
