import React, { Fragment, useContext, useState } from 'react'
import {
    AcmIcon,
    AcmIconVariant,
    AcmButton,
    AcmInlineStatus,
    AcmInlineCopy,
    StatusType,
} from '@stolostron/ui-components'
import { ButtonVariant, Tooltip } from '@patternfly/react-core'
import { useTranslation } from 'react-i18next'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { getSecret, unpackSecret } from '../../../../resources/secret'
import { makeStyles } from '@material-ui/styles'

export type LoginCredential = {
    username: string
    password: string
}

export type LoginCredentialStyle = {
    disabled: boolean
}

const useStyles = makeStyles({
    toggleButton: {
        paddingLeft: '0 !important',
        '& svg': {
            width: '24px',
            fill: (props: LoginCredentialStyle) => (props.disabled ? 'var(--pf-c-button--disabled--Color)' : '#06C'),
        },
        '& span': {
            color: (props: LoginCredentialStyle) =>
                props.disabled ? 'var(--pf-c-button--disabled--Color)' : undefined,
        },
        '& .credentials-toggle': {
            display: 'flex',
            '& svg': {
                marginRight: '0.4rem',
            },
        },
        '&:hover': {
            '& .credentials-toggle svg': {
                fill: (props: LoginCredentialStyle) =>
                    props.disabled ? 'var(--pf-c-button--disabled--Color)' : 'var(--pf-c-button--m-link--hover--Color)',
            },
        },
    },
    credentialsContainer: {
        '& button': {
            paddingRight: 0,
        },
    },
})

export function LoginCredentials(props: { accessRestriction?: boolean }) {
    const { cluster } = useContext(ClusterContext)
    const { t } = useTranslation(['cluster', 'common'])
    const [isVisible, setVisible] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<boolean>(false)
    const [credentials, setCredentials] = useState<LoginCredential | undefined>(undefined)
    const disableButton = loading || error || props.accessRestriction
    const classes = useStyles({ disabled: disableButton } as LoginCredentialStyle)

    const onClick = async () => {
        /* istanbul ignore next */
        const namespace = cluster?.namespace ?? ''
        /* istanbul ignore next */
        const name = cluster?.hiveSecrets?.kubeadmin ?? ''
        if (!credentials && !isVisible && cluster?.hiveSecrets?.kubeadmin) {
            setLoading(true)
            try {
                const secret = await getSecret({ name, namespace }).promise
                const { stringData } = unpackSecret(secret)
                setCredentials(stringData as LoginCredential)
                setVisible(!isVisible)
            } catch (err) {
                setError(true)
            } finally {
                setLoading(false)
            }
        } else {
            setVisible(!isVisible)
        }
    }

    if (cluster?.hiveSecrets?.kubeadmin) {
        return (
            <Fragment>
                {!isVisible && <div>&#8226;&#8226;&#8226;&#8226;&#8226; / &#8226;&#8226;&#8226;&#8226;&#8226;</div>}
                {isVisible && (
                    <div className={classes.credentialsContainer}>
                        <AcmInlineCopy
                            text={/* istanbul ignore next */ credentials?.username ?? ''}
                            id="username-credentials"
                        />
                        {'  /  '}
                        <AcmInlineCopy
                            text={/* istanbul ignore next */ credentials?.password ?? ''}
                            id="password-credentials"
                        />
                    </div>
                )}
                <AcmButton
                    variant={ButtonVariant.link}
                    className={classes.toggleButton}
                    onClick={onClick}
                    isDisabled={disableButton || props.accessRestriction}
                    id="login-credentials"
                >
                    <Fragment>
                        {(() => {
                            if (error) {
                                return <AcmInlineStatus type={StatusType.danger} status={t('credentials.failed')} />
                            } else if (loading) {
                                return <AcmInlineStatus type={StatusType.progress} status={t('credentials.loading')} />
                            } else if (props.accessRestriction) {
                                return (
                                    <Tooltip content={t('common:rbac.unauthorized')}>
                                        <div className="credentials-toggle">
                                            <AcmIcon
                                                icon={
                                                    isVisible
                                                        ? AcmIconVariant.visibilityoff
                                                        : AcmIconVariant.visibilityon
                                                }
                                            />
                                            {isVisible ? t('credentials.hide') : t('credentials.show')}
                                        </div>
                                    </Tooltip>
                                )
                            } else {
                                return (
                                    <div className="credentials-toggle">
                                        <AcmIcon
                                            icon={
                                                isVisible ? AcmIconVariant.visibilityoff : AcmIconVariant.visibilityon
                                            }
                                        />
                                        {isVisible ? t('credentials.hide') : t('credentials.show')}
                                    </div>
                                )
                            }
                        })()}
                    </Fragment>
                </AcmButton>
            </Fragment>
        )
    } else {
        return <>-</>
    }
}
