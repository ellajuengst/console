/* Copyright Contributors to the Open Cluster Management project */
import { ClusterIcon } from '@patternfly/react-icons'

export const icon = { default: ClusterIcon }

export const getLandingPageURL = () => '/acm/home/welcome'

export const getImportRedirectURL = (namespace: string) => `/k8s/cluster/projects/${namespace}/workloads`
