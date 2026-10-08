import type { Theme } from '@mui/material/styles'
import type {
    FacConfirmBackendProcessName,
    FacConfirmEditableField,
    FacConfirmProcessGroup,
} from '../types/facConfirm'

interface ProcessGroupConfig {
    // Cột công đoạn này xác nhận (sửa được mặc định).
    columns: readonly FacConfirmEditableField[]

    // Map field <-> tên process ở backend.
    // Gồm cả field chỉ để xem (vd heatStart) để đọc dữ liệu đã xác nhận trước đây.
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
        // Heat Start chỉ để xem, Heat chỉ xác nhận To CLG
        columns: ['heatFinish'],
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
).flatMap(([processGroup, config]) => {
    config.columns.forEach((field) => {
        if (!config.backendProcessNames[field]) {
            throw new Error(`Missing backend process name for ${field}`)
        }
    })

    // Dựng từ backendProcessNames (không phải columns)
    // để field chỉ để xem vẫn map được dữ liệu cũ.
    return (
        Object.entries(config.backendProcessNames) as [
            FacConfirmEditableField,
            FacConfirmBackendProcessName,
        ][]
    ).map(([field, backendProcessName]): FacConfirmProcessIdentity => ({
        field,
        processGroup,
        backendProcessName,
    }))
})

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
