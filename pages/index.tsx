import { useSubscription } from '@apollo/client';
import { Capacitor } from '@capacitor/core';
import { GLOBAL_ID_CONTAIN, GLOBAL_ID_PACKAGE, GLOBAL_ID_PROMISE, GLOBAL_ID_THEN, GLOBAL_ID_RESOLVED, GLOBAL_ID_REJECTED } from '@deepcase/deeplinks/imports/global-ids';
import { minilinks } from '@deepcase/deeplinks/imports/minilinks';
import { useTokenController } from '@deepcase/deeplinks/imports/react-token';
import { useApolloClient } from '@deepcase/react-hasura/use-apollo-client';
import { useLocalStore } from '@deepcase/store/local';
import { useQueryStore } from '@deepcase/store/query';
import { Add, Clear, Colorize, LaptopChromebook, Visibility as VisibilityOn , VisibilityOff } from '@material-ui/icons';
import { useTheme } from '@material-ui/styles';
import { useDebounceCallback } from '@react-hook/debounce';
import axios from 'axios';
import cn from 'classnames';
import gql from 'graphql-tag';
import { random } from 'lodash';
import dynamic from 'next/dynamic';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import ReactResizeDetector from 'react-resize-detector';
import { useAuth } from '../imports/auth';
import { useClickEmitter } from '../imports/click-emitter';
import { EnginePanel, EngineWindow, useEngineConnected } from '../imports/engine';
import { deleteLink, insertLink, LINKS_string } from '../imports/gql';
import { ForceGraph, ForceGraph2D } from '../imports/graph';
import { LinkCard } from '../imports/link-card/index';
import { Provider } from '../imports/provider';
import { Backdrop, Button, ButtonGroup, Grid, IconButton, makeStyles, Paper, Popover, TextField, Typography } from '../imports/ui';
import pckg from '../package.json';

// @ts-ignore
const Graphiql = dynamic(() => import('../imports/graphiql').then(m => m.Graphiql), { ssr: false });

const transitionHoverScale = {
  transition: 'all 0.5s ease',
  transform: 'scale(1)',
  '&:hover': {
    transform: 'scale(1.01)',
  },
};

type StyleProps = { connected: boolean; };
const connectedPosition = (style: any) => ({
  position: 'relative',
  transition: 'all 1s ease',
  ...style,
});

const useStyles = makeStyles((theme) => ({
  "@global": {
    body: {
      backgroundColor: theme?.palette?.background?.default,
    },
  },
  '@keyframes deeplinksBackground': {
    from: {
      backgroundSize: '0.5em 0.5em',
    },
    to: {
      backgroundSize: '3em 3em',
    },
  },
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: theme?.palette?.background?.default,
    backgroundImage: 'linear-gradient(#202a38 .1em, transparent .1em), linear-gradient(90deg, #202a38 .1em, transparent .1em)',
    overflow: 'hidden',
    animation: '5s $deeplinksBackground ease'
  },
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
    boxSizing: 'border-box',
  },
  topPaper: ({ connected }: StyleProps) => ({
    pointerEvents: 'all',
    boxSizing: 'border-box',
    padding: theme.spacing(1),
    ...connectedPosition({ top: connected ? 0 : -500 }),
  }),
  right: {
    margin: `16px 0 16px 16px`,
    boxSizing: 'border-box',
    position: 'relative',
  },
  rightPaper: ({ connected }: StyleProps) => ({
    ...connectedPosition({ right: connected ? 0 : -1000 }),
    position: 'absolute',
    overflow: 'scroll',
    width: 300,
    height: '100%',
    padding: theme.spacing(1),
    pointerEvents: 'all',
    boxSizing: 'border-box',
  }),
  bottom: {
    width: '100%',
  },
  bottomPaper: ({ connected }: StyleProps) => ({
    width: '100%',
    height: '100%',
    pointerEvents: 'all',
    overflow: 'auto',
    boxSizing: 'border-box',
    ...connectedPosition({ bottom: connected ? 0 : -1000 }),
  }),
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
  },
  transitionHoverScale,
}));

export function PaperPanel(props: any) {
  const [hover, setHover] = useState(false);
  const classes = useStyles({ connected: false });
  
  return <Paper onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} elevation={hover ? 3 : 1} className={props.flying ? classes.transitionHoverScale : null} {...props}/>;
}

export function useOperation() {
  return useLocalStore('dc-dg-operation', '');
}

export const AuthPanel = React.memo<any>(function AuthPanel() {
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
});

export function useSelectedLinks() {
  return useQueryStore('dc-dg-sl', []);
}

const defaultGraphiqlHeight = 300;

export function PageContent() {
  const auth = useAuth();
  const theme = useTheme();
  const [drawerSize, setDrawerSize] = useState({ width: 800, height: 500 });
  const [graphiqlHeight, setGraphiqlHeight] = useState(defaultGraphiqlHeight);
  const [flyPanel, setFlyPanel] = useState<any>();

  const [showTypes, setShowTypes] = useQueryStore('show-types', false);
  const [promises, setPromises] = useQueryStore('promises', false);
  const [showMP, setShowMP] = useQueryStore('show-mp', false);
  const [clickSelect, setClickSelect] = useState(false);
  const [selectedLinks, setSelectedLinks] = useSelectedLinks();
  const [container, setContainer] = useQueryStore('container', 0);
  const [containerVisible, setContainerVisible] = useState(true);
  const [inserting, setInserting] = useQueryStore<any>('dc-dg-ins', {});
  const [operation, setOperation] = useOperation();
  const [connected, setConnected] = useEngineConnected();
  const [screenFind, setScreenFind] = useQueryStore<any>('screen-find', '');
  const [labelsConfig, setLabelsConfig] = useQueryStore('labels-config', { types: true, contains: false, values: true });

  const classes = useStyles({ connected });

  const client = useApolloClient();

  useEffect(() => {
    // @ts-ignore
    global.axios = axios;
    const pl = Capacitor.getPlatform();
    if (pl === 'web') {
      console.log(`platform is web, connection to server to ${process.env.NEXT_PUBLIC_DEEPLINKS_SERVER}/api/deeplinks`);
      axios.post(`${process.env.NEXT_PUBLIC_DEEPLINKS_SERVER}/api/deeplinks`, { abc: 123 }).then(console.log, console.log);
    } else if (pl === 'electron') {
      console.log(`platform is electron, connection to server to ${process.env.NEXT_PUBLIC_DEEPLINKS_SERVER}/api/deeplinks`);
      axios.post(`${process.env.NEXT_PUBLIC_DEEPLINKS_SERVER}/api/deeplinks`, { def: 234 }).then(console.log, console.log);
    } else {
      console.log(`platform is not detected, connection to server lost`);
    }
  }, []);

  const insertLinkD = useCallback(async (link) => (
    await client.mutate(insertLink(link))
  ), []);
  const deleteLinkD = useCallback(async (id) => (
    await client.mutate(deleteLink(id))
  ), []);

  const [query, setQuery] = useState(gql`subscription ${LINKS_string}`);
  const [variables, setVariables] = useState({});

  const s = useSubscription(query, { variables });

  const prevD = useRef<any>({ nodes: [], links: [] });
  const ml = useMemo(() => minilinks(s?.data?.links), [s]);
  const outD = useMemo(() => {
    if (s?.data?.links) {
      const prev = prevD.current;
      var prevNodes = prev?.nodes?.reduce(function(map, node) {
        map[node.id] = node;
        return map;
      }, {});

      const nodes = [];
      const links = [];

      for (let l = 0; l < ml.links.length; l++) {
        const link = ml.links[l];
        const isTransparent = link.type_id === GLOBAL_ID_CONTAIN && link?.from?.type_id === GLOBAL_ID_PACKAGE && !containerVisible;

        if (!promises && [GLOBAL_ID_PROMISE, GLOBAL_ID_THEN, GLOBAL_ID_RESOLVED, GLOBAL_ID_REJECTED].includes(link.type_id)) {
          continue;
        }

        const label: (string|number)[] = [];
        if (!isTransparent) {
          label.push(link.id);
          if (labelsConfig?.values && link?.value?.value) label.push(`value:${link.value.value}`);
          if (labelsConfig?.contains) (link?.inByType?.[GLOBAL_ID_CONTAIN] || []).forEach(link => label.push(`name:${link?.value?.value}`));
          if (labelsConfig?.types) if (link?.type?.value?.value) label.push(`type:${link?.type?.value?.value}`);
        }

        nodes.push({ ...prevNodes?.[link.id], id: link.id, link, label });

        if (showTypes && link.type_id) links.push({ id: `type--${link.id}`, source: link.id, target: link.type_id, link, type: 'type', color: isTransparent ? 'transparent' : '#ffffff' });

        if (showMP) for (let i = 0; i < link._by_item.length; i++) {
          const pos = link._by_item[i];
          links.push({ id: `by-item--${pos.id}`, source: link.id, target: pos.path_item_id, link, pos, type: 'by-item', color: isTransparent ? 'transparent' : '#ffffff' });
        }
      }
      for (let l = 0; l < ml.links.length; l++) {
        const link = ml.links[l];
        const isTransparent = link.type_id === GLOBAL_ID_CONTAIN && link?.from?.type_id === GLOBAL_ID_PACKAGE && !containerVisible;

        if (!promises && [GLOBAL_ID_PROMISE, GLOBAL_ID_THEN, GLOBAL_ID_RESOLVED, GLOBAL_ID_REJECTED].includes(link.type_id)) {
          continue;
        }

        if (link.from) links.push({ id: `from--${link.id}`, source: link.id, target: link.from_id || link.id, link, type: 'from', color: isTransparent ? 'transparent' : '#a83232' });
        if (link.to) links.push({ id: `to--${link.id}`, source: link.id, target: link.to_id || link.id, link, type: 'to', color: isTransparent ? 'transparent' : '#32a848' });
      }

      return { nodes, links };
    }
    return prevD.current;
  }, [s, containerVisible, container, labelsConfig]);
  prevD.current = outD;
  
  const mouseMove = useRef<any>();
  const onNodeClickRef = useRef<any>();
  const clickEventEmitter = useClickEmitter();
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
    } else if (operation === 'pipette') {
      setInserting({ ...inserting, from: node.link.from_id, to: node.link.to_id, type: node.link.type_id });
      setOperation('');
    } else if (operation === 'container') {
      setContainer(node.link.id);
      setOperation('');
    } else if (clickSelect) {
      setFlyPanel({
        top: (mouseMove?.current?.clientY),
        left: (mouseMove?.current?.clientX),
        link: node.link,
      });
    } else if (operation) {
      clickEventEmitter.emit(operation, node.link);
    } else {
      if (!selectedLinks.find(i => i === node.link.id)) setSelectedLinks([ ...selectedLinks, node.link.id ]);
    }
  }, 500);
  onNodeClickRef.current = onNodeClick;

  const rootRef = useRef<any>();
  const handleZoom = useCallback(({ k, x, y }) => {
    if (rootRef.current) {
      const size = k * 3;
      rootRef.current.style['background-position'] = `${x}px ${y}px`;
      rootRef.current.style['background-size'] = `${size}em ${size}em`;
    }
  }, []);

  return <div
    ref={rootRef}
    className={classes.root}
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
      // backgroundColor={theme?.palette?.background?.default}
      linkAutoColorBy={(l) => l.color || '#fff'}
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
        const _l = node.label || [];

        const isSelected = screenFind ? (
          node?.link?.id.toString() === screenFind || !!(_l?.join(' ')?.includes(screenFind))
        ) : selectedLinks?.find(id => id === node?.link?.id);

        const fontSize = 12/globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        let textWidth = 0;
        for (var i = 0; i < _l.length; i++)
          textWidth = ctx.measureText(node.label).width > textWidth ? ctx.measureText(node.label).width : textWidth;
        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

        ctx.fillStyle = 'rgba(0,0,0, 0)';
        ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, textWidth, fontSize * _l.length);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isSelected ? '#fff' : '#707070';

        for (var i = 0; i < _l.length; i++)
          ctx.fillText(_l[i], node.x, node.y + (i * 12/globalScale) );
      }}
      // nodeThreeObject={node => {
      //   const sprite = new SpriteText(node?.n?.key);
      //   sprite.color = '#fff';
      //   sprite.textHeight = 8;
      //   return sprite;
      // }}
      onNodeDragEnd={node => {
        if (node.fx) delete node.fx;
        else node.fx = node.x;
        if (node.fy) delete node.fy;
        else node.fy = node.y;
        if (node.fz) delete node.fz;
        else node.fz = node.z;
      }}
      onNodeClick={(node) => {
        onNodeClickRef.current(node);
      }}
      onNodeHover={(node) => {
        
      }}
      onZoom={handleZoom}
    />
    <div className={classes.overlay}>
      <div className={classes.top}>
        <PaperPanel className={cn(classes.topPaper, classes.transitionHoverScale)}>
          <Grid container justify="space-between" spacing={1}>
            <Grid item>
              <Grid container spacing={1}>
                <Grid item>
                  <ButtonGroup variant="outlined">
                    <Button color={showTypes ? 'primary' : 'default'} onClick={() => setShowTypes(!showTypes)}>types</Button>
                    <Button color={showMP ? 'primary' : 'default'} onClick={() => setShowMP(!showMP)}>mp</Button>
                    <Button color={clickSelect ? 'primary' : 'default'} onClick={() => setClickSelect(!clickSelect)}>select</Button>
                  </ButtonGroup>
                </Grid>
                <Grid item>
                  <ButtonGroup variant="outlined">
                    <Button color={promises ? 'primary' : 'default'} onClick={() => setPromises(!promises)}>promises</Button>
                  </ButtonGroup>
                </Grid>
                <Grid item>
                  <ButtonGroup variant="outlined">
                    <Button color={labelsConfig.types ? 'primary' : 'default'} onClick={() => setLabelsConfig({ ...labelsConfig, types: !labelsConfig.types })}>types</Button>
                    <Button color={labelsConfig.values ? 'primary' : 'default'} onClick={() => setLabelsConfig({ ...labelsConfig, values: !labelsConfig.values })}>values</Button>
                    <Button color={labelsConfig.contains ? 'primary' : 'default'} onClick={() => setLabelsConfig({ ...labelsConfig, contains: !labelsConfig.contains })}>contains</Button>
                  </ButtonGroup>
                </Grid>
                <Grid item>
                  <ButtonGroup variant="outlined">
                    <Button
                      color={operation === 'container' ? 'primary' : 'default'}
                      onClick={() => setOperation(operation === 'container' ? '' : 'container')}
                    >
                      container: {container}
                    </Button>
                    <Button
                      onClick={() => setContainer(0)}
                    ><Clear/></Button>
                    <Button
                      color={containerVisible ? 'primary' : 'default'}
                      onClick={() => setContainerVisible((containerVisible) => !containerVisible)}
                    >
                      {containerVisible ? <VisibilityOn/> : <VisibilityOff/>}
                    </Button>
                  </ButtonGroup>
                </Grid>
                <Grid item>
                  <ButtonGroup variant="outlined">
                    <Button
                      color={operation === 'pipette' ? 'primary' : 'default'}
                      onClick={() => setOperation(operation === 'pipette' ? '' : 'pipette')}
                    ><Colorize/></Button>
                    <Button
                      onClick={async () => {
                        const r = await insertLinkD({
                          from_id: inserting.from || 0,
                          to_id: inserting.to || 0,
                          type_id: inserting.type || 0,
                        });
                        if (container) await insertLinkD({
                          from_id: container,
                          to_id: r?.data?.m0?.returning?.[0]?.id,
                          type_id: 13,
                        });
                      }}
                    ><Add/></Button>
                    <Button
                      style={{ color: '#a83232' }}
                      color={operation === 'from' ? 'primary' : 'default'}
                      onClick={() => setOperation(operation === 'from' ? '' : 'from')}
                      >
                      from: {inserting?.from}
                    </Button>
                    <Button
                      style={{ color: '#32a848' }}
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
            </Grid>
            <Grid item>
              <Grid container spacing={1}>
                <Grid item>
                  <TextField variant="outlined" size="small"
                    value={screenFind}
                    onChange={e => setScreenFind(e.target.value)}
                    placeholder="find..."
                  />
                </Grid>
                <Grid item>
                  <Button disabled>{pckg.version}</Button>
                </Grid>
                <Grid item>
                  <EnginePanel/>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </PaperPanel>
      </div>
      <div className={classes.right}>
        <PaperPanel className={cn(classes.rightPaper, classes.transitionHoverScale)}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Button variant="outlined" fullWidth onClick={() => setSelectedLinks([])}>
                clear
              </Button>
            </Grid>
            <Grid item xs={12}><LinkCard link={{ id: 1, type: 1 }}/></Grid>
            {selectedLinks.map((id) => {
              const link = ml.byId[id];
              return <Grid key={id} item xs={12} style={{ position: 'relative' }}>
                <LinkCard link={link}/>
                <IconButton
                  size="small" style={{ position: 'absolute', top: 6, right: 6 }}
                  onClick={() => setSelectedLinks(selectedLinks.filter(link => link !== id))}
                ><Clear/></IconButton>
              </Grid>;
            })}
          </Grid>
        </PaperPanel>
      </div>
      <div className={classes.bottom} style={{ height: graphiqlHeight }}>
        <PaperPanel className={classes.bottomPaper} elevation={1}>
          {/* @ts-ignore */}
          <Graphiql defaultQuery={LINKS_string} onVisualize={(query: string, variables: any) => {
            setQuery(gql`
              #${random(0, 9999)}
              ${query}
            `);
            setVariables(variables);
          }}/>
        </PaperPanel>
      </div>
    </div>
    {!!connected && <Draggable
      axis="y"
      handle=".handle"
      defaultPosition={{x: 0, y: 0}}
      position={null}
      scale={1}
      onStart={(data) => {
      }}
      onDrag={(data) => {
      }}
      onStop={(data: any) => {
        setGraphiqlHeight((window.innerHeight - data?.pageY) - 10);
      }}
    >
      <div style={{
        position: 'fixed', zIndex: 10, bottom: defaultGraphiqlHeight, left: 0,
        width: '100%', height: 10,
        userSelect: 'none',
      }}>
        <div className="handle" style={{
          height: '100%', width: '100%', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 'calc(50% - 30px)', top: 'calc(50% - 3px)', 
            width: 60, height: 6, backgroundColor: 'grey', borderRadius: 7,
          }}></div>
        </div>
      </div>
    </Draggable>}
    <Backdrop className={classes.backdrop} open={!connected}>
      <PaperPanel flying>
        <EngineWindow/>
        <Typography align='center'><Button disabled>{pckg.version}</Button></Typography>
      </PaperPanel>
    </Backdrop>
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
