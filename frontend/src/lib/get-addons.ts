import { ClusterManagementAddOn, listClusterManagementAddOns } from '../resources/cluster-management-add-on'
import { ManagedClusterAddOn, listManagedClusterAddOns } from '../resources/managed-cluster-add-on'
import { IRequestResult } from './resource-request'

export type Addon = {
    name: string
    status: string
    message: string | undefined
    launchLink: LaunchLink | undefined
}

export enum AddonStatus {
    'Available' = 'Available',
    'Progressing' = 'Progressing',
    'Degraded' = 'Degraded',
    'Disabled' = 'Disabled',
    'Unknown' = 'Unknown',
}

export type LaunchLink = {
    displayText: string
    href: string
}

export function getAllAddons(
    cluster: string
): IRequestResult<PromiseSettledResult<ClusterManagementAddOn[] | ManagedClusterAddOn[]>[]> {
    const results = [listClusterManagementAddOns(), listManagedClusterAddOns(cluster)]
    return {
        promise: Promise.allSettled(results.map((result) => result.promise)),
        abort: () => results.forEach((result) => result.abort()),
    }
}

export function mapAddons(
    clusterManagementAddons: ClusterManagementAddOn[],
    managedClusterAddons: ManagedClusterAddOn[]
) {
    const addons: Addon[] = clusterManagementAddons.map((cma) => ({
        name: cma.metadata.name as string,
        status: getDisplayStatus(cma, managedClusterAddons),
        message: getDisplayMessage(cma, managedClusterAddons),
        launchLink: getLaunchLink(cma, managedClusterAddons),
    }))
    return addons
}

function getDisplayStatus(cma: ClusterManagementAddOn, mcas: ManagedClusterAddOn[]): string {
    const mcaStatus = mcas?.find((mca) => mca.metadata.name === cma.metadata.name)
    if (mcaStatus?.status?.conditions === undefined) {
        return AddonStatus.Disabled
    }
    const managedClusterAddOnConditionDegraded = mcaStatus?.status.conditions.find(
        (condition) => condition.type === AddonStatus.Degraded
    )
    if (managedClusterAddOnConditionDegraded?.status === 'True') {
        return AddonStatus.Degraded
    }
    const managedClusterAddOnConditionProgressing = mcaStatus?.status.conditions.find(
        (condition) => condition.type === AddonStatus.Progressing
    )
    if (managedClusterAddOnConditionProgressing?.status === 'True') {
        return AddonStatus.Progressing
    }
    const managedClusterAddOnConditionAvailable = mcaStatus?.status.conditions.find(
        (condition) => condition.type === AddonStatus.Available
    )
    if (managedClusterAddOnConditionAvailable?.status === 'True') {
        return AddonStatus.Available
    }
    if (
        managedClusterAddOnConditionAvailable?.status === 'False' ||
        managedClusterAddOnConditionProgressing?.status === 'False' ||
        managedClusterAddOnConditionDegraded?.status === 'False'
    ) {
        return AddonStatus.Progressing
    }

    return AddonStatus.Unknown
}

function getDisplayMessage(cma: ClusterManagementAddOn, mcas: ManagedClusterAddOn[]): string | undefined {
    const mcaStatus = mcas?.find((mca) => mca.metadata.name === cma.metadata.name)
    if (mcaStatus?.status?.conditions === undefined) {
        return undefined
    }
    const managedClusterAddOnConditionDegraded = mcaStatus?.status.conditions.find(
        (condition) => condition.type === AddonStatus.Degraded
    )
    if (managedClusterAddOnConditionDegraded?.status === 'True') {
        return managedClusterAddOnConditionDegraded.message
    }
    const managedClusterAddOnConditionProgressing = mcaStatus?.status.conditions.find(
        (condition) => condition.type === AddonStatus.Progressing
    )
    if (managedClusterAddOnConditionProgressing?.status === 'True') {
        return managedClusterAddOnConditionProgressing.message
    }
    const managedClusterAddOnConditionAvailable = mcaStatus?.status.conditions.find(
        (condition) => condition.type === AddonStatus.Available
    )
    if (managedClusterAddOnConditionAvailable?.status === 'True') {
        return managedClusterAddOnConditionAvailable.message
    }
    if (
        managedClusterAddOnConditionAvailable?.status === 'False' ||
        managedClusterAddOnConditionProgressing?.status === 'False' ||
        managedClusterAddOnConditionDegraded?.status === 'False'
    ) {
        return ''
    }

    return AddonStatus.Unknown
}

function getLaunchLink(cma: ClusterManagementAddOn, mcas: ManagedClusterAddOn[]): LaunchLink | undefined {
    const pathKey = 'console.open-cluster-management.io/launch-link'
    const textKey = 'console.open-cluster-management.io/launch-link-text'
    const mca = mcas.find((mca) => mca.metadata.name === cma.metadata.name)
    if (mca) {
        const mcaAnnotations = Object.keys(mca.metadata.annotations ?? {})
        const mcaHasLaunchLink = mcaAnnotations.includes(pathKey) && mcaAnnotations.includes(textKey)
        const cmaAnnotations = Object.keys(cma.metadata.annotations ?? {})
        const cmaHasLaunchLink = cmaAnnotations.includes(pathKey) && cmaAnnotations.includes(textKey)
        if (mcaHasLaunchLink || cmaHasLaunchLink) {
            return {
                displayText: mca?.metadata?.annotations?.[textKey] ?? cma?.metadata?.annotations?.[textKey] ?? '',
                href: mca?.metadata?.annotations?.[pathKey] ?? cma?.metadata?.annotations?.[pathKey] ?? '',
            }
        } else {
            return undefined
        }
    } else {
        return undefined
    }
}