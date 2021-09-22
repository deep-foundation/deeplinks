import GraphiQL from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { useApolloClient } from '@apollo/client';
import { GRAPHQL_PATH, GRAPHQL_SSL } from './provider';
import 'graphiql/graphiql.css';
import { useMemo, useState } from 'react';
import { generateHeaders } from '@deepcase/hasura/client';
import { TokenContext, useToken } from '@deepcase/react-hasura/token-context';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(() => ({
  root: {
    width: '100%', height: '100%',
    '& .topBar, & .docExplorerShow': {
      background: 'transparent !important',
      '& .title': {
        display: 'none !important',
      },
      '& .execute-button-wrap': {
        margin: 0,
        '& svg': {
          fill: '#fff !important',
        },
      },
      '& .execute-button': {
        background: 'transparent !important',
        color: '#fff !important',
        border: 0,
        boxShadow: 'none !important',
      },
      '& .toolbar-button': {
        background: 'transparent !important',
        color: '#fff !important',
        border: 0,
        boxShadow: 'none !important',
      },
    },
  },
}));

export function Graphiql({
  defaultQuery,
  onVisualize,
}: {
  defaultQuery: string;
  onVisualize: (query: string, variables: any) => any;
}) {
  const classes = useStyles();
  const token: string = useToken() || '';
  const fetcher = useMemo(() => {
    return createGraphiQLFetcher({
      url: `http${GRAPHQL_SSL ? 's' : ''}://${GRAPHQL_PATH}`,
    });
  }, []);
  const [query, setQuery] = useState('');
  const [variables, setVariables] = useState({});
  return <>
    {!!fetcher && <div className={classes.root}>
      <GraphiQL
        query={defaultQuery}
        fetcher={fetcher}
        defaultVariableEditorOpen={false}
        editorTheme={'material-darker'}
        headers={JSON.stringify(generateHeaders({
          token: token,
          client: 'deeplinks-graphiql',
        }))}
        toolbar={{
          additionalContent: <>
            <GraphiQL.Button title="Draw" label="Draw" onClick={() => onVisualize(query, variables)}></GraphiQL.Button>
          </>
        }}
        onEditQuery={(query) => setQuery(query)}
        onEditVariables={(variables) => {
          try {
            setVariables(JSON.parse(variables));
          } catch(error) {}
        }}
      />
    </div>}
  </>;
}
