import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { isEqual } from 'lodash';
import { TokenProvider, useTokenController } from '@deepcase/deepgraph/imports/react-token';
import { ApolloClientTokenizedProvider } from '@deepcase/react-hasura/apollo-client-tokenized-provider';
import { LocalStoreProvider } from '@deepcase/store/local';
import { QueryStoreProvider, useQueryStore } from '@deepcase/store/query';
import { generateQuery, generateSerial } from '@deepcase/deepgraph/imports/gql';
import ReactResizeDetector from 'react-resize-detector';
import { useSubscription, useMutation } from '@apollo/react-hooks';
import { ForceGraph, ForceGraph2D } from '../imports/graph';
import { LINKS } from '../imports/gql';
import { Paper, ButtonGroup, Button, makeStyles, Grid, Card, CardActions, CardContent, IconButton, Typography, Popover } from '@material-ui/core';
import { Clear, Add } from '@material-ui/icons';
import { useImmutableData } from '../imports/use-immutable-data';
import { LinkCard } from '../imports/link-card';

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
    display: 'grid',
    gridTemplateRows: 'max-content auto',
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
  },
  rightPaper: {
    height: '100%',
    width: 300,
    padding: 6,
    pointerEvents: 'all',
    float: 'right',
    overflow: 'auto',
    boxSizing: 'border-box',
    ...transitionHoverScale,
  },
});

export function PaperPanel(props: any) {
  const classes = useStyles();
  const [hover, setHover] = useState(false);
  
  return <Paper onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} elevation={hover ? 3 : 1} {...props}/>;
}

export function PageContent() {
  const classes = useStyles();
  const [drawerSize, setDrawerSize] = useState({ width: 800, height: 500 });
  const [flyPanel, setFlyPanel] = useState<any>();

  const [showTypes, setShowTypes] = useState(true);
  const [clickSelect, setClickSelect] = useState(false);
  const [selectedLinks, setSelectedLinks] = useQueryStore('dc-dg-sl', []);

  const s = useSubscription(LINKS, {
    variables: {},
  });

  const inD = useMemo(() => {
    const nodes = [];
    const links = [];

    const _links = s?.data?.links || [];
    for (let l = 0; l < _links.length; l++) {
      const link = _links[l];
      nodes.push({ id: link.id, link });
      if (showTypes) links.push({ id: `type--${link.id}`, source: link.id, target: link.type_id, link, type: 'type', color: '#000000' });
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
  onNodeClickRef.current = (node) => {
    if (clickSelect) {
      setFlyPanel({
        top: (mouseMove?.current?.clientY),
        left: (mouseMove?.current?.clientX),
        link: node.link,
      });
    } else {
      setSelectedLinks([ ...selectedLinks, node.link.id ]);
    }
  };

  return <div
    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    onMouseMove={(e) => {
      mouseMove.current = { clientX: e.clientX, clientY: e.clientY };
    }}
  >
    <div className={classes.overlay}>
      <div className={classes.top}>
        <PaperPanel className={classes.topPaper}>
          <Grid container spacing={1}>
            <Grid item>
              <ButtonGroup variant="contained">
                <Button color={showTypes ? 'primary' : 'default'} onClick={() => setShowTypes(!showTypes)}>types</Button>
                <Button color={clickSelect ? 'primary' : 'default'} onClick={() => setClickSelect(!clickSelect)}>select</Button>
              </ButtonGroup>
            </Grid>
            <Grid item>
              <ButtonGroup variant="contained">
                <Button disabled>insert</Button>
                <Button disabled>delete</Button>
              </ButtonGroup>
            </Grid>
          </Grid>
        </PaperPanel>
      </div>
      <div className={classes.right}>
        <PaperPanel className={classes.rightPaper}>
          <Grid container spacing={1}>
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
    </div>
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
      linkCurvature={l => l.type === 'from' ? 0.25 : l.type === 'to' ? -0.25 : 0}
      width={drawerSize.width}
      height={drawerSize.height}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const isSelected = selectedLinks?.find(id => id === node?.link?.id);

        const label = [node.id];
        if (!showTypes && node?.link?.type?.string?.value) label.push(`${node?.link?.type?.string?.value}`);
        if (node?.link?.string?.value) label.push(`string: ${node?.link?.string?.value}`);
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
  </div>
}

export function PageConnected() {
  const [token, setToken] = useTokenController();
  useEffect(() => {
    if (!token) setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsiZ3Vlc3QiXSwieC1oYXN1cmEtZGVmYXVsdC1yb2xlIjoiZ3Vlc3QiLCJ4LWhhc3VyYS11c2VyLWlkIjoiZ3Vlc3QifSwiaWF0IjoxNjIxMzg2MDk2fQ.jwukXmInG4-w_4nObzqvMJZRCd4a1AXnW4cHrNF2xKY');
  }, [token]);

  return <>
    {!!token && <PageContent/>}
  </>
}

export default function Page() {
  return (
    <QueryStoreProvider>
      <LocalStoreProvider>
        <TokenProvider>
          <ApolloClientTokenizedProvider options={{ client: 'deepgraph-app', path: `${process.env.NEXT_PUBLIC_HASURA_PATH}/v1/graphql`, ssl: !!+process.env.NEXT_PUBLIC_HASURA_SSL, ws: !!process?.browser }}>
            <PageConnected/>
          </ApolloClientTokenizedProvider>
        </TokenProvider>
      </LocalStoreProvider>
    </QueryStoreProvider>
  );
}
