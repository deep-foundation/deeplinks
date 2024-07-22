import { memo, useEffect, useRef, useState } from 'react';
import { DeepClient, useDeep, useDeepSubscription } from './client.js';
import { gql } from '@apollo/client/index.js';

import React from 'react';
import { Id } from './minilinks.js';

export class CatchErrors extends React.Component<{
  error?: any;
  onMounted?: (setError: (error?: any) => void) => void;
  errorRenderer?: (error: Error, reset: () => any) => React.ReactNode;
  reset?: () => any;
  children: any;
},any> {
  reset: () => any;

  constructor(props) {
    super(props);
    this.state = { error: undefined };

    this.reset = () => {
      this.setState({ error: undefined });
      this?.props?.reset && this?.props?.reset();
    };
  }

  static getDerivedStateFromError(error) {
    console.log('getDerivedStateFromError', error);
    return { error };
  }
  componentDidCatch(error, errorInfo) {
    console.log('componentDidCatch', error, errorInfo);
  }
  componentDidMounted() {
    this?.props?.onMounted && this?.props?.onMounted((error) => this.setState({ error: error }));
  }

  errorRenderer = (error, reset) => <></>;

  render() {
    const error = this.props.error || this.state.error;
    if (error) {
      return this?.props?.errorRenderer ? this?.props?.errorRenderer(error, this.reset) : this?.errorRenderer(error, this.reset);
    }

    return this.props.children; 
  }
}

/**
 * Evaluates a client handler
 * @returns A promise that resolves to an object with either an error property that contains error or data property that contains result of the handler.
 */
export async function evalClientHandler(options: {
  value: string;
  deep: DeepClient;
  input?: any;
}): Promise<{
  error?: any;
  data?: any;
}> {
  const {
    value,
    deep,
    input = {},
  } = options;
  try {
    console.log('evalClientHandler', 'value', value);
    // const evalResult = (new Function(`return ${value}`))();
    // console.log('evalClientHandler', 'evalResult', evalResult);
    const evalResult = eval(value);
    if (typeof evalResult === 'function') {
      return {
        data: await evalResult({ deep, gql, ...input }),
      };
    } else {
      return {
        error: new Error(`Client handler must return a function, got ${typeof evalResult}`),
      };
    }
  } catch(error) {
    console.log('evalClientHandler', 'error', error);
    return { error };
  }
  return {};
}

export const ClientHandler = memo(function ClientHandler(_props: ClientHandlerProps) {
  const {
    linkId,
    handlerId,
    context = [],
    ml,
    onClose,
    fillSize,
    error: outerError,
    ErrorComponent,
    ...props
  } = _props;
  const deep = useDeep();
  const _ml = ml || deep?.minilinks;
  const hid = useFindClientHandler(_props);
  const [file] = deep.useMinilinksQuery({
    id: hid?.dist_id || 0,
  });

  const [{ Component, errored } = {} as any, setState] = useState<any>({ Component: undefined, errored: undefined });

  // console.log('ClientHandler root', { linkId, handlerId, context, file, hid, files, Component });
  const lastEvalRef = useRef(0);
  useEffect(() => {
    if (!hid) return;
    const value = file?.value?.value;
    if (!value) {
      return;
    }
    const evalId = ++lastEvalRef.current;
    evalClientHandler({ value, deep }).then(({ data, error }) => {
      if (evalId === lastEvalRef.current) {
        console.log('ClientHandler evalClientHandler setState', { file, data, error });
        if (!error) {
          setState(() => ({ Component: data }));
          erroredResetRef?.current && (erroredResetRef?.current(), erroredResetRef.current = undefined);
        }
        else {
          setErrorRef.current && setErrorRef.current(error);
          setState({ Component: undefined, errored: error });
        }
      } else {
        console.log('ClientHandler evalClientHandler outdated', { file, data, error, evalId, 'lastEvalRef.current': lastEvalRef.current });
      }
    });
  }, [file?.value?.value, hid]);

  const erroredResetRef = useRef<any>();
  const setErrorRef = useRef<any>();

  return (<>
    <CatchErrors
      error={errored || outerError}
      errorRenderer={(error, reset) => {
        erroredResetRef.current = reset;
        return <ErrorComponent error={error} reset={reset}/>
      }}
      onMounted={(setError) => setErrorRef.current = setError}
    >
      {(typeof (Component) === 'function') ? <>
        {[<ClientHandlerRenderer key={Component.toString()} Component={Component} {...props} fillSize={fillSize} link={_ml.byId[linkId]} ml={_ml} onClose={onClose} />]}
      </> : <></>}
    </CatchErrors>
  </>);
});
export interface ClientHandlerRendererProps {
  Component: any;
  fillSize?: boolean;
  onClose?: () => any;
  [key: string]: any;
};

export const ClientHandlerRenderer = React.memo(function ClientHandlerRenderer({
  Component,
  fillSize = false,
  onClose,
  ...props
}: ClientHandlerRendererProps) {
  return <>{typeof (Component) === 'function' && <Component
    onClose={onClose}
    fillSize={fillSize}
    {...props}
    style={{
      ...(fillSize ? { width: '100%', height: '100%' } : {}),
      ...props?.style,
    }}
  />}</>;
});

export interface ClientHandlerProps extends Partial<ClientHandlerRendererProps> {
  linkId: Id;
  handlerId?: Id;
  context?: Id[];
  ml?: any;
  error?: any;
  onClose?: () => any;
  ErrorComponent: any;
  [key: string]: any;
}

export function useFindClientHandler({
  linkId,
  handlerId,
  context = [],
  ml,
  onClose,
  fillSize,
  ...props
}: ClientHandlerProps) {
  const deep = useDeep();
  const [hid, setHid] = useState<any>();
  useEffect(() => { (async () => {
    if (hid) return;
    const handler = await deep._findHandler({ context, handlerId });
    if (handler) setHid(handler);
  })(); }, [context, handlerId, hid]);
  return hid;
}