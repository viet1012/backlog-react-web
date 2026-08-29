import type { Theme } from '@mui/material/styles'
import type {
    FacConfirmBackendProcessName,
    FacConfirmEditableField,
    FacConfirmProcessGroup,
} from '../types/facConfirm'

interface ProcessGroupConfig {
    columns: readonly FacConfirmEditableField[]
    backendProcessNames: Readonly<
        Partial<Record<FacConfirmEditableField, FacConfirmBackendProcessName>>
    >
    getColor: (theme: Theme) => string
}

export const FAC_CONFIRM_PROCESS_CONFIG: Record<
    FacConfirmProcessGroup,
    ProcessGroupConfig
> = {
    Rough: {
        columns: ['toDrill', 'toHeat'],
        backendProcessNames: {
            toDrill: 'To Drill',
            toHeat: 'To Heat',
        },
        getColor: (theme) => theme.palette.info.main,
    },

    Heat: {
        columns: ['heatStart', 'heatFinish'],
        backendProcessNames: {
            heatStart: 'Heat Start',
            heatFinish: 'Heat Finish',
        },
        getColor: (theme) => theme.palette.warning.main,
    },

    Fine: {
        columns: ['toPk'],
        backendProcessNames: {
            toPk: 'To Packing',
        },
        getColor: (theme) => theme.palette.success.main,
    },
}

interface FacConfirmProcessIdentity {
    field: FacConfirmEditableField
    processGroup: FacConfirmProcessGroup
    backendProcessName: FacConfirmBackendProcessName
}

const processIdentities = (
    Object.entries(FAC_CONFIRM_PROCESS_CONFIG) as [
        FacConfirmProcessGroup,
        ProcessGroupConfig,
    ][]
).flatMap(([processGroup, config]) =>
    config.columns.map((field): FacConfirmProcessIdentity => {
        const backendProcessName = config.backendProcessNames[field]

        if (!backendProcessName) {
            throw new Error(`Missing backend process name for ${field}`)
        }

        return {
            field,
            processGroup,
            backendProcessName,
        }
    }),
)

const processIdentityByField = new Map(
    processIdentities.map((identity) => [identity.field, identity]),
)

const processIdentityByBackendName = new Map(
    processIdentities.map((identity) => [
        identity.backendProcessName,
        identity,
    ]),
)

export function getFacConfirmProcessIdentityByField(
    field: FacConfirmEditableField,
): FacConfirmProcessIdentity {
    const identity = processIdentityByField.get(field)

    if (!identity) {
        throw new Error(`Unknown Fac Confirm editable field: ${field}`)
    }

    return identity
}

export function getFacConfirmProcessIdentityByBackendName(
    backendProcessName: FacConfirmBackendProcessName,
): FacConfirmProcessIdentity {
    const identity = processIdentityByBackendName.get(backendProcessName)

    if (!identity) {
        throw new Error(
            `Unknown Fac Confirm backend process: ${backendProcessName}`,
        )
    }

    return identity
}
