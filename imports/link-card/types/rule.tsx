import React, { useCallback, useEffect, useState } from 'react';
import { Button, Typography, Chip, TextField, Card, CardContent, CardActions, InputAdornment, IconButton, Grid, Dialog } from '../../ui';
import { Delete, Insert } from '../../icons';
import { useMutation, useSubscription } from '@apollo/client';
import { updateString, insertString, deleteString, updateNumber, insertNumber, deleteNumber, insertBoolExp, updateBoolExp, deleteBoolExp, LINKS_WHERE, insertLink, deleteLink } from '../../gql';
import { useDebouncedCallback } from 'use-debounce';
import { useApolloClient } from '@deepcase/react-hasura/use-apollo-client';
import MonacoEditor from 'react-monaco-editor';
import { generateSerial, insertMutation } from '@deepcase/deeplinks/imports/gql';
import { useOperation, useSelectedLinks } from '../../../pages';
import { useClickEmitter } from '../../click-emitter';
import { useMemo } from 'react';
import { minilinks } from '../../minilinks';
import { flatten } from 'lodash';

export function LinkCardRule({
  link,
}: {
  link: any;
}) {
  const client = useApolloClient();
  const [selectedLinks, setSelectedLinks] = useSelectedLinks();
  const clickEventEmitter = useClickEmitter();
  const [operation, setOperation] = useOperation();

  const insertLinkD = useCallback(async (link) => (
    await client.mutate(insertLink(link))
  ), []);
  const deleteLinkD = useCallback(async (id) => (
    await client.mutate(deleteLink(id))
  ), []);

  const linksS = useSubscription(LINKS_WHERE, { variables: {
    where: {
      type_id: { _in: [10, 11, 12, 8, 7] },
      _or: [
        { from_id: { _eq: link.id } },
        { in: { from_id: { _eq: link.id } } },
        { from: { in: { from_id: { _eq: link.id } } } },
      ],
    },
  } });

  const links = useMemo(() => minilinks(linksS?.data?.links || []), [linksS]);
  const clearEvents = useCallback(() => {
    clickEventEmitter.removeAllListeners('rule-insert-subject');
    clickEventEmitter.removeAllListeners('rule-insert-objects');
    clickEventEmitter.removeAllListeners('rule-insert-actions');
  }, []);

  useEffect(() => {
    return () => {
      clearEvents();
    };
  }, []);

  return <>
    <Typography>
      subjects
      <IconButton color={operation === 'rule-insert-subject' ? 'primary' : 'default'} onClick={() => {
        if (operation === 'rule-insert-subject') {
          clearEvents();
          setOperation('');
        }
        else {
          clearEvents();
          clickEventEmitter.once('rule-insert-subject', (l) => {
            const rule_link = links?.types?.[10]?.[0];
            if (rule_link) insertLinkD({
              type_id: 8, from_id: rule_link.to_id, to_id: l.id,
            });
            setOperation('');
          });
          setOperation('rule-insert-subject');
        }
      }}><Insert/></IconButton>
    </Typography>
    <div>
      {flatten(links?.types?.[10]?.map(c => c.to.outByType?.[8]?.map(l => <Chip
        label={l.to_id}
        onDelete={() => {
          deleteLinkD(l.id);
        }}
      />)))}
    </div>
    <Typography>
      objects
      <IconButton color={operation === 'rule-insert-objects' ? 'primary' : 'default'} onClick={() => {
        if (operation === 'rule-insert-objects') {
          clearEvents();
          setOperation('');
        }
        else {
          clearEvents();
          clickEventEmitter.once('rule-insert-objects', (l) => {
            const rule_link = links?.types?.[11]?.[0];
            if (rule_link) insertLinkD({
              type_id: 8, from_id: rule_link.to_id, to_id: l.id,
            });
            setOperation('');
          });
          setOperation('rule-insert-objects');
        }
      }}><Insert/></IconButton>
    </Typography>
    <div>
      {flatten(links?.types?.[11]?.map(c => c.to.outByType?.[8]?.map(l => <Chip
        label={l.to_id}
        onDelete={() => {
          deleteLinkD(l.id);
        }}
      />)))}
    </div>
    <Typography>
      actions
      <IconButton color={operation === 'rule-insert-actions' ? 'primary' : 'default'} onClick={() => {
        if (operation === 'rule-insert-actions') {
          clearEvents();
          setOperation('');
        }
        else {
          clearEvents();
          clickEventEmitter.once('rule-insert-actions', (l) => {
            const rule_link = links?.types?.[12]?.[0];
            if (rule_link) insertLinkD({
              type_id: 8, from_id: rule_link.to_id, to_id: l.id,
            });
            setOperation('');
          });
          setOperation('rule-insert-actions');
        }
      }}><Insert/></IconButton>
    </Typography>
    <div>
      {flatten(links?.types?.[12]?.map(c => c.to.outByType?.[8]?.map(l => <Chip
        label={l.to_id}
        onDelete={() => {
          deleteLinkD(l.id);
        }}
      />)))}
    </div>
  </>;
}
