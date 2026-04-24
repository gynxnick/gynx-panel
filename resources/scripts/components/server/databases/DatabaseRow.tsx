import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faEye, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import Modal from '@/components/elements/Modal';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { object, string } from 'yup';
import FlashMessageRender from '@/components/FlashMessageRender';
import { ServerContext } from '@/state/server';
import deleteServerDatabase from '@/api/server/databases/deleteServerDatabase';
import { httpErrorToHuman } from '@/api/http';
import RotatePasswordButton from '@/components/server/databases/RotatePasswordButton';
import Can from '@/components/elements/Can';
import { ServerDatabase } from '@/api/server/databases/getServerDatabases';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import Button from '@/components/elements/Button';
import Label from '@/components/elements/Label';
import Input from '@/components/elements/Input';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Card, KeyValue } from '@/components/gynx';

interface Props {
    database: ServerDatabase;
    className?: string;
}

const DbIcon = styled.div`
    ${tw`flex items-center justify-center rounded-md`};
    width: 32px;
    height: 32px;
    background: rgba(34, 211, 238, 0.08);
    border: 1px solid rgba(34, 211, 238, 0.22);
    color: #22D3EE;
    flex: 0 0 32px;
`;

const Actions = styled.div`
    ${tw`flex items-center gap-2`};
`;

const IconButton = styled.button<{ $danger?: boolean }>`
    ${tw`inline-flex items-center justify-center rounded-md cursor-pointer`};
    width: 32px;
    height: 32px;
    background: transparent;
    border: 1px solid var(--gynx-edge-2);
    color: ${({ $danger }) => ($danger ? '#F87171' : 'var(--gynx-text-dim)')};
    transition: color .15s ease, background .15s ease, border-color .15s ease;

    &:hover {
        color: ${({ $danger }) => ($danger ? '#F87171' : 'var(--gynx-text)')};
        background: ${({ $danger }) => ($danger ? 'rgba(248, 113, 113, 0.12)' : 'rgba(255, 255, 255, 0.04)')};
        border-color: ${({ $danger }) => ($danger ? 'rgba(248, 113, 113, 0.35)' : 'rgba(124, 58, 237, 0.35)')};
    }
`;

export default ({ database, className }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { addError, clearFlashes } = useFlash();
    const [visible, setVisible] = useState(false);
    const [connectionVisible, setConnectionVisible] = useState(false);

    const appendDatabase = ServerContext.useStoreActions((actions) => actions.databases.appendDatabase);
    const removeDatabase = ServerContext.useStoreActions((actions) => actions.databases.removeDatabase);

    const jdbcConnectionString = `jdbc:mysql://${database.username}${
        database.password ? `:${encodeURIComponent(database.password)}` : ''
    }@${database.connectionString}/${database.name}`;

    const schema = object().shape({
        confirm: string()
            .required('The database name must be provided.')
            .oneOf([database.name.split('_', 2)[1], database.name], 'The database name must be provided.'),
    });

    const submit = (values: { confirm: string }, { setSubmitting }: FormikHelpers<{ confirm: string }>) => {
        clearFlashes();
        deleteServerDatabase(uuid, database.id)
            .then(() => {
                setVisible(false);
                setTimeout(() => removeDatabase(database.id), 150);
            })
            .catch((error) => {
                console.error(error);
                setSubmitting(false);
                addError({ key: 'database:delete', message: httpErrorToHuman(error) });
            });
    };

    return (
        <>
            <Formik onSubmit={submit} initialValues={{ confirm: '' }} validationSchema={schema} isInitialValid={false}>
                {({ isSubmitting, isValid, resetForm }) => (
                    <Modal
                        visible={visible}
                        dismissable={!isSubmitting}
                        showSpinnerOverlay={isSubmitting}
                        onDismissed={() => {
                            setVisible(false);
                            resetForm();
                        }}
                    >
                        <FlashMessageRender byKey={'database:delete'} css={tw`mb-6`} />
                        <h2 css={tw`text-2xl mb-6`}>Confirm database deletion</h2>
                        <p css={tw`text-sm`}>
                            Deleting a database is permanent. This will destroy the{' '}
                            <strong>{database.name}</strong> database and everything in it.
                        </p>
                        <Form css={tw`m-0 mt-6`}>
                            <Field
                                type={'text'}
                                id={'confirm_name'}
                                name={'confirm'}
                                label={'Confirm Database Name'}
                                description={'Enter the database name to confirm deletion.'}
                            />
                            <div css={tw`mt-6 text-right`}>
                                <Button type={'button'} isSecondary css={tw`mr-2`} onClick={() => setVisible(false)}>
                                    Cancel
                                </Button>
                                <Button type={'submit'} color={'red'} disabled={!isValid}>
                                    Delete Database
                                </Button>
                            </div>
                        </Form>
                    </Modal>
                )}
            </Formik>

            <Modal visible={connectionVisible} onDismissed={() => setConnectionVisible(false)}>
                <FlashMessageRender byKey={'database-connection-modal'} css={tw`mb-6`} />
                <h3 css={tw`mb-6 text-2xl`}>Connection details</h3>
                <div>
                    <Label>Endpoint</Label>
                    <CopyOnClick text={database.connectionString}>
                        <Input type={'text'} readOnly value={database.connectionString} />
                    </CopyOnClick>
                </div>
                <div css={tw`mt-6`}>
                    <Label>Connections from</Label>
                    <Input type={'text'} readOnly value={database.allowConnectionsFrom} />
                </div>
                <div css={tw`mt-6`}>
                    <Label>Username</Label>
                    <CopyOnClick text={database.username}>
                        <Input type={'text'} readOnly value={database.username} />
                    </CopyOnClick>
                </div>
                <Can action={'database.view_password'}>
                    <div css={tw`mt-6`}>
                        <Label>Password</Label>
                        <CopyOnClick text={database.password} showInNotification={false}>
                            <Input type={'text'} readOnly value={database.password} />
                        </CopyOnClick>
                    </div>
                </Can>
                <div css={tw`mt-6`}>
                    <Label>JDBC Connection String</Label>
                    <CopyOnClick text={jdbcConnectionString} showInNotification={false}>
                        <Input type={'text'} readOnly value={jdbcConnectionString} />
                    </CopyOnClick>
                </div>
                <div css={tw`mt-6 text-right`}>
                    <Can action={'database.update'}>
                        <RotatePasswordButton databaseId={database.id} onUpdate={appendDatabase} />
                    </Can>
                    <Button isSecondary onClick={() => setConnectionVisible(false)}>
                        Close
                    </Button>
                </div>
            </Modal>

            <Card
                className={className}
                title={
                    <span css={tw`inline-flex items-center gap-3`}>
                        <DbIcon><FontAwesomeIcon icon={faDatabase} /></DbIcon>
                        <CopyOnClick text={database.name}>
                            <span>{database.name}</span>
                        </CopyOnClick>
                    </span>
                }
                actions={
                    <Actions>
                        <IconButton
                            type={'button'}
                            onClick={() => setConnectionVisible(true)}
                            aria-label={'View connection details'}
                            title={'View connection details'}
                        >
                            <FontAwesomeIcon icon={faEye} />
                        </IconButton>
                        <Can action={'database.delete'}>
                            <IconButton
                                type={'button'}
                                $danger
                                onClick={() => setVisible(true)}
                                aria-label={'Delete database'}
                                title={'Delete database'}
                            >
                                <FontAwesomeIcon icon={faTrashAlt} />
                            </IconButton>
                        </Can>
                    </Actions>
                }
            >
                <KeyValue label={'Endpoint'} value={database.connectionString} copyable={database.connectionString} />
                <KeyValue label={'Username'} value={database.username} copyable={database.username} />
                <KeyValue label={'Connections from'} value={database.allowConnectionsFrom} />
            </Card>
        </>
    );
};
