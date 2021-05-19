// @flow
import _ from 'lodash';
import React, { Component, useState, useCallback, useRef } from 'react';

let ForceGraph3D, ForceGraph2D, ForceGraphAR, ForceGraphVR, ForceGraph, SpriteText;

if (_.get(process, 'browser')) {
  SpriteText = require('three-spritetext').default;

  ForceGraph3D = require('react-force-graph').ForceGraph3D;
  ForceGraph2D = require('react-force-graph').ForceGraph2D;
  ForceGraphAR = require('react-force-graph').ForceGraphAR;
  ForceGraphVR = require('react-force-graph').ForceGraphVR;

  ForceGraph = (props: any) => {
    const fgRef = useRef<any>();
    const [last, setLast] = useState(0);
    const Component = props.Component || ForceGraph3D;

    const onNodeClick = useCallback(node => {
      const now = new Date().valueOf();
      const res = now - last;
      setLast(now);
      if (res < 600) {
        const distance = 300;
        const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
        fgRef.current.cameraPosition(
          // new position
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node, // lookAt ({ x, y, z })
          1000,  // ms transition duration
        );
      }
      props.onNodeClick && props.onNodeClick(node);
    }, [fgRef, last]);

    return <Component
      ref={fgRef}
      {...props}
      // TODO arrows without slow fps
      // linkDirectionalArrowLength={10}
      // linkDirectionalArrowRelPos={0.9}
      // linkCurvature={0.25}
      onNodeClick={(node) => {
        onNodeClick(node);
        props.onNodeClick && props.onNodeClick(node);
      }}
    />
  };
} else {
  SpriteText = (...args: any): any => null;
  
  ForceGraph3D = () => null;
  ForceGraph2D = () => null;
  ForceGraphAR = () => null;
  ForceGraphVR = () => null;

  ForceGraph = () => null;
}

export { SpriteText, ForceGraph3D, ForceGraph2D, ForceGraphAR, ForceGraphVR, ForceGraph };
