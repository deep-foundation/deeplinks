import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { TokenProvider, useTokenController } from '@deepcase/deepgraph/imports/react-token';
import { ApolloClientTokenizedProvider } from '@deepcase/react-hasura/apollo-client-tokenized-provider';
import { LocalStoreProvider } from '@deepcase/store/local';
import { generateQuery, generateSerial } from '@deepcase/deepgraph/imports/gql';
import ReactResizeDetector from 'react-resize-detector';
import { useSubscription, useMutation } from '@apollo/react-hooks';
import { ForceGraph, ForceGraph2D } from '../imports/graph';
import { LINKS } from '../imports/gql';
import { Paper, ButtonGroup, Button } from '@material-ui/core';

export function PageContent() {
  const [drawerSize, setDrawerSize] = useState({ width: 800, height: 500 });

  const [showTypes, setShowTypes] = useState(true);

  const s = useSubscription(LINKS, {
    variables: {},
  });

  const data = useMemo(() => {
    const nodes = [];
    const links = [];

    const _links = s?.data?.links || [];
    for (let l = 0; l < _links.length; l++) {
      const link = _links[l];
      nodes.push({ id: link.id, link: link });
      if (showTypes) links.push({ source: link.id, target: link.type_id, color: '#000000' });
    }
    for (let l = 0; l < _links.length; l++) {
      const link = _links[l];
      links.push({ source: link.id, target: link.from_id || link.id, color: '#a83232' });
      links.push({ source: link.id, target: link.to_id || link.id, color: '#32a848' });
    }

    return { nodes, links };
  }, [s]);

  return <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
    <div style={{ zIndex: 1, position: 'absolute', top: 0, left: 0, width: '100%' }}>
      <Paper style={{ margin: 16, padding: 6 }}>
        <ButtonGroup variant="outlined">
          <Button color={showTypes ? 'primary' : 'default'} onClick={() => setShowTypes(!showTypes)}>types</Button>
        </ButtonGroup>
      </Paper>
    </div>
    <ReactResizeDetector
      handleWidth handleHeight
      onResize={(width, height) => setDrawerSize({ width, height })}
    />
    <ForceGraph
      Component={ForceGraph2D}
      graphData={data}
      backgroundColor={'#fff'}
      // linkColor={'#000000'}
      linkAutoColorBy={(l) => l.color || '#000000'}
      linkOpacity={1}
      linkWidth={0.5}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      linkCurvature={0.25}
      width={drawerSize.width}
      height={drawerSize.height}
      nodeCanvasObject={(node, ctx, globalScale) => {
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
        ctx.fillStyle = '#000';

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
        console.log(node);
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
    <LocalStoreProvider>
      <TokenProvider>
        <ApolloClientTokenizedProvider options={{ client: 'deepgraph-app', path: `${process.env.NEXT_PUBLIC_HASURA_PATH}/v1/graphql`, ssl: !!+process.env.NEXT_PUBLIC_HASURA_SSL, ws: !!process?.browser }}>
          <PageConnected/>
        </ApolloClientTokenizedProvider>
      </TokenProvider>
    </LocalStoreProvider>
  );
}
