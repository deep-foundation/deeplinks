import { useSubscription } from '@apollo/react-hooks';
import { useTokenController } from '@deepcase/deeplinks/imports/react-token';
import { useApolloClient } from '@deepcase/react-hasura/use-apollo-client';
import { useLocalStore } from '@deepcase/store/local';
import { useQueryStore } from '@deepcase/store/query';
import { Add, Clear } from '@material-ui/icons';
import { useDebounceCallback } from '@react-hook/debounce';
import { isEqual } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import { useAuth } from '../imports/auth';
import { check } from '../imports/check';
import { LINKS, LINKS_string, insertLink, deleteLink } from '../imports/gql';
import { ForceGraph, ForceGraph2D } from '../imports/graph';
import { LinkCard } from '../imports/link-card/index';
import { Provider } from '../imports/provider';
import { Button, ButtonGroup, Grid, IconButton, makeStyles, Paper, Popover } from '../imports/ui';
import { useImmutableData } from '../imports/use-immutable-data';
import gql from 'graphql-tag';

import dynamic from 'next/dynamic';
const Graphiql = dynamic(() => import('../imports/graphiql').then(m => m.Graphiql), { ssr: false });

const transitionHoverScale = {
  transition: 'all 0.5s ease',
  transform: 'scale(1)',
  '&:hover': {
    transform: 'scale(1.01)',
  },
};

const useStyles = makeStyles({
  overlay: {
    zIndex: 1, position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
    maxWidth: '100%', maxHeight: '100%',
    display: 'grid',
    gridTemplateRows: 'max-content auto max-content',
    pointerEvents: 'none',
  },
  top: {
    margin: `16px 16px 0 16px`,
    padding: 6,
    boxSizing: 'border-box',
  },
  topPaper: {
    pointerEvents: 'all',
    boxSizing: 'border-box',
    ...transitionHoverScale,
  },
  right: {
    margin: 16,
    padding: 6,
    boxSizing: 'border-box',
    position: 'relative',
  },
  rightPaper: {
    position: 'absolute',
    top: 0, right: 0,
    overflow: 'scroll',
    width: 300,
    height: '100%',
    padding: 6,
    pointerEvents: 'all',
    float: 'right',
    boxSizing: 'border-box',
    ...transitionHoverScale,
  },
  bottom: {
    height: 300,
    width: '100%',
  },
  bottomPaper: {
    width: '100%',
    height: '100%',
    padding: 6,
    pointerEvents: 'all',
    overflow: 'auto',
    boxSizing: 'border-box',
  },
});

export function PaperPanel(props: any) {
  const classes = useStyles();
  const [hover, setHover] = useState(false);
  
  return <Paper onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} elevation={hover ? 3 : 1} {...props}/>;
}

export function useOperation() {
  return useLocalStore('dc-dg-operation', '');
}

export function AuthPanel() {
  const auth = useAuth();
  const [operation, setOperation] = useOperation();

  return <>
    <ButtonGroup variant="outlined">
      <Button disabled>{auth.linkId || 'admin'}</Button>
      <Button color={operation === 'auth' ? 'primary' : 'default'} onClick={() => setOperation(operation === 'auth' ? '' : 'auth')}>login</Button>
      <Button onClick={() => auth.setLinkId(0)}>logout</Button>
    </ButtonGroup>
    {/* <Button disabled>in this example logout = guest = admin</Button> */}
  </>;
}

export function useSelectedLinks() {
  return useQueryStore('dc-dg-sl', []);
}

export function PageContent() {
  const auth = useAuth();
  const classes = useStyles();
  const [drawerSize, setDrawerSize] = useState({ width: 800, height: 500 });
  const [flyPanel, setFlyPanel] = useState<any>();

  const [showTypes, setShowTypes] = useState(true);
  const [showByItem, setShowByItem] = useState(false);
  const [clickSelect, setClickSelect] = useState(false);
  const [selectedLinks, setSelectedLinks] = useSelectedLinks();
  const [inserting, setInserting] = useQueryStore<any>('dc-dg-ins', {});
  const [operation, setOperation] = useOperation();

  const client = useApolloClient();

  // @ts-ignore
  global.CHECKIT = async () => {
    console.log(await check({}, client));
  }

  const insertLinkD = useCallback(async (link) => (
    await client.mutate(insertLink(link))
  ), []);
  const deleteLinkD = useCallback(async (id) => (
    await client.mutate(deleteLink(id))
  ), []);

  const [query, setQuery] = useState(LINKS);
  const s = useSubscription(query);

  const inD = useMemo(() => {
    const nodes = [];
    const links = [];

    const _links = s?.data?.links || [];
    for (let l = 0; l < _links.length; l++) {
      const link = _links[l];
      nodes.push({ id: link.id, link });
      if (showTypes && link.type_id) links.push({ id: `type--${link.id}`, source: link.id, target: link.type_id, link, type: 'type', color: '#000000' });
      if (showByItem) for (let i = 0; i < link._by_item.length; i++) {
        const pos = link._by_item[i];
        links.push({ id: `by-item--${pos.id}`, source: link.id, target: pos.path_item_id, link, pos, type: 'by-item', color: '#000000' });
      }
    }
    for (let l = 0; l < _links.length; l++) {
      const link = _links[l];
      links.push({ id: `from--${link.id}`, source: link.id, target: link.from_id || link.id, link, type: 'from', color: '#a83232' });
      links.push({ id: `to--${link.id}`, source: link.id, target: link.to_id || link.id, link, type: 'to', color: '#32a848' });
    }

    return { nodes, links };
  }, [s]);

  const outD = useImmutableData(inD, (a, b) => isEqual(a.link, b.link));
  
  const mouseMove = useRef<any>();
  const onNodeClickRef = useRef<any>();
  const onNodeClick = useDebounceCallback((node) => {
    if (operation === 'auth') {
      auth.setLinkId(+node.link.id);
      setOperation('');
    } else if (operation === 'delete') {
      deleteLinkD(node.link.id);
      setOperation('');
    } else if (operation === 'from') {
      setInserting({ ...inserting, from: node.link.id });
      setOperation('');
    } else if (operation === 'to') {
      setInserting({ ...inserting, to: node.link.id });
      setOperation('');
    } else if (operation === 'type') {
      setInserting({ ...inserting, type: node.link.id });
      setOperation('');
    } else if (clickSelect) {
      setFlyPanel({
        top: (mouseMove?.current?.clientY),
        left: (mouseMove?.current?.clientX),
        link: node.link,
      });
    } else {
      if (!selectedLinks.find(i => i === node.link.id)) setSelectedLinks([ ...selectedLinks, node.link.id ]);
    }
  }, 500);
  onNodeClickRef.current = onNodeClick;

  return <div
    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    onMouseMove={(e) => {
      mouseMove.current = { clientX: e.clientX, clientY: e.clientY };
    }}
  >
    <ReactResizeDetector
      handleWidth handleHeight
      onResize={(width, height) => setDrawerSize({ width, height })}
    />
    <Popover
      open={!!flyPanel}
      anchorReference="anchorPosition"
      anchorPosition={flyPanel}
      onClose={() => setFlyPanel(null)}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      {!!flyPanel && <div style={{ position: 'relative' }}>
        <LinkCard link={flyPanel.link}/>
        <IconButton
          size="small" style={{ position: 'absolute', top: 6, right: 6 }}
          onClick={() => {
            setSelectedLinks([ ...selectedLinks, flyPanel.link.id ]);
            setFlyPanel(null);
          }}
        ><Add/></IconButton>
      </div>}
    </Popover>
    <ForceGraph
      Component={ForceGraph2D}
      graphData={outD}
      backgroundColor={'#fff'}
      // linkColor={'#000000'}
      linkAutoColorBy={(l) => l.color || '#000000'}
      linkOpacity={1}
      linkWidth={0.5}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      linkLabel={l => (
        l.type === 'by-item'
        ? `${l?.pos?.item_id}/${l?.pos?.path_item_id}/${l?.pos?.path_item_depth}(${l?.pos?.root_id})`
        : ''
      )}
      linkCurvature={l => (
        l.type === 'from'
        ? 0.25
        : l.type === 'to'
        ? -0.25
        : 0
      )}
      linkLineDash={l => (
        l.type === 'by-item'
        ? [5, 5]
        : false
      )}
      width={drawerSize.width}
      height={drawerSize.height}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const isSelected = selectedLinks?.find(id => id === node?.link?.id);

        const label = [node.id];
        if (node?.link?.type?.string?.value) label.push(`${node?.link?.type?.string?.value}`);
        if (node?.link?.string?.value) label.push(`string: ${node?.link?.string?.value}`);
        if (node?.link?.number?.value) label.push(`number: ${node?.link?.number?.value}`);
        const _l = label;
        const fontSize = 12/globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        let textWidth = 0;
        for (var i = 0; i < _l.length; i++)
          textWidth = ctx.measureText(label).width > textWidth ? ctx.measureText(label).width : textWidth;
        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

        ctx.fillStyle = 'rgba(0,0,0, 0)';
        ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, textWidth, fontSize * _l.length);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isSelected ? '#000' : '#707070';

        for (var i = 0; i < _l.length; i++)
          ctx.fillText(_l[i], node.x, node.y + (i * 12/globalScale) );
      }}
      // nodeThreeObject={node => {
      //   const sprite = new SpriteText(node?.n?.key);
      //   sprite.color = '#000';
      //   sprite.textHeight = 8;
      //   return sprite;
      // }}
      onNodeClick={(node) => {
        onNodeClickRef.current(node);
      }}
      onNodeHover={(node) => {
        
      }}
    />
    <div className={classes.overlay}>
      <div className={classes.top}>
        <PaperPanel className={classes.topPaper}>
          <Grid container spacing={1}>
            <Grid item>
              <ButtonGroup variant="outlined">
                <Button color={showTypes ? 'primary' : 'default'} onClick={() => setShowTypes(!showTypes)}>types</Button>
                <Button color={showByItem ? 'primary' : 'default'} onClick={() => setShowByItem(!showByItem)}>by_item</Button>
                <Button color={clickSelect ? 'primary' : 'default'} onClick={() => setClickSelect(!clickSelect)}>select</Button>
              </ButtonGroup>
            </Grid>
            <Grid item>
              <ButtonGroup variant="outlined">
                <Button
                  onClick={async () => {
                    await insertLinkD({
                      from_id: inserting.from || 0,
                      to_id: inserting.to || 0,
                      type_id: inserting.type || 0,
                    });
                  }}
                ><Add/></Button>
                <Button
                  color={operation === 'from' ? 'primary' : 'default'}
                  onClick={() => setOperation(operation === 'from' ? '' : 'from')}
                >
                  from: {inserting?.from}
                </Button>
                <Button
                  color={operation === 'to' ? 'primary' : 'default'}
                  onClick={() => setOperation(operation === 'to' ? '' : 'to')}
                >
                  to: {inserting?.to}
                </Button>
                <Button
                  color={operation === 'type' ? 'primary' : 'default'}
                  onClick={() => setOperation(operation === 'type' ? '' : 'type')}
                >
                  type: {inserting?.type}
                </Button>
                <Button onClick={() => setInserting({})}><Clear/></Button>
              </ButtonGroup>
            </Grid>
            <Grid item>
              <ButtonGroup variant="outlined">
                <Button
                  color={operation === 'delete' ? 'primary' : 'default'}
                  onClick={() => setOperation(operation === 'delete' ? '' : 'delete')}
                >delete</Button>
              </ButtonGroup>
            </Grid>
            <Grid item>
              <AuthPanel/>
            </Grid>
          </Grid>
        </PaperPanel>
      </div>
      <div className={classes.right}>
        <PaperPanel className={classes.rightPaper}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Button variant="outlined" fullWidth onClick={() => setSelectedLinks([])}>
                clear
              </Button>
            </Grid>
            <Grid item xs={12}><Paper style={{ position: 'relative' }}>
              <LinkCard link={{ id: 1, type: 1 }}/>
            </Paper></Grid>
            {selectedLinks.map((id) => {
              const link = (s?.data?.links || []).find(l => l.id === id);
              return <Grid key={id} item xs={12}><Paper style={{ position: 'relative' }}>
                <LinkCard link={link}/>
                <IconButton
                  size="small" style={{ position: 'absolute', top: 6, right: 6 }}
                  onClick={() => setSelectedLinks(selectedLinks.filter(link => link !== id))}
                ><Clear/></IconButton>
              </Paper></Grid>;
            })}
          </Grid>
        </PaperPanel>
      </div>
      <div className={classes.bottom}>
        <PaperPanel className={classes.bottomPaper} elevation={0}>
          <Graphiql defaultQuery={LINKS_string} onVisualize={(query: string) => {
            setQuery(gql`${query}`);
          }}/>
        </PaperPanel>
      </div>
    </div>
  </div>
}

export function PageConnected() {
  const [token, setToken] = useTokenController();
  const client = useApolloClient();
  return <>
    {!!token && !!client.jwt_token && [<PageContent key={token}/>]}
  </>
}

export default function Page() {
  return (
    <Provider>
      <PageConnected/>
    </Provider>
  );
}
