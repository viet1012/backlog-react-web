import type {
    FacConfirmEditableField,
    FacConfirmProcessGroup,
    FacConfirmRow,
} from '../types/facConfirm'

import {
    validateFacConfirmDateTimeNotBefore,
} from '../utils/facConfirmDateTime'

import {
    FAC_CONFIRM_PROCESS_CONFIG,
} from './facConfirmProcessConfig'


// =========================================================
// QUY TẮC SỬA Ô ĐẶC BIỆT
//
// Mặc định: công đoạn nào sửa cột của công đoạn đó
// (FAC_CONFIRM_PROCESS_CONFIG[process].columns).
//
// Quy tắc dưới đây ghi đè danh sách ô sửa được
// cho những dòng khớp điều kiện. Quy tắc ĐẦU TIÊN khớp được dùng.
// =========================================================

export interface FacConfirmEditRule {
    id: string

    // Mô tả tiếng Việt cho người đọc code
    description: string

    process: FacConfirmProcessGroup

    matches: (row: FacConfirmRow) => boolean

    editableFields: FacConfirmEditableField[]

    // Validate thêm sau khi giá trị đã chuẩn hóa.
    // Thay cho validate mặc định của field (vd Heat Finish theo Heat Start).
    // Throw Error nếu không hợp lệ.
    validate?: (
        row: FacConfirmRow,
        field: FacConfirmEditableField,
        value: string,
    ) => void
}


// =========================================================
// KHÔNG CÓ HEAT
//
// Heat Note "Không có Heat" <=> hasHeatProcess === false
// =========================================================

export function isNoHeatRow(
    row: FacConfirmRow,
): boolean {
    return row.hasHeatProcess === false
}


// =========================================================
// RULES
// =========================================================

export const FAC_CONFIRM_EDIT_RULES: readonly FacConfirmEditRule[] = [
    {
        id: 'rough-no-heat',
        description:
            'Rough + dòng Không có Heat: nhập To Drill và To CLG, khóa To Heat.',
        process: 'Rough',
        matches: isNoHeatRow,
        editableFields: ['toDrill', 'heatFinish'],

        // Không có Heat Start => To CLG so với To Drill
        validate: (row, field, value) => {
            if (field === 'heatFinish') {
                validateFacConfirmDateTimeNotBefore(
                    value,
                    row.toDrill,
                    'To CLG',
                )
            }
        },
    },
]


// =========================================================
// LOOKUP
// =========================================================

export function getMatchedEditRule(
    row: FacConfirmRow,
    process: FacConfirmProcessGroup,
): FacConfirmEditRule | null {
    return FAC_CONFIRM_EDIT_RULES.find(
        (rule) =>
            rule.process === process
            && rule.matches(row),
    ) ?? null
}

export function getEditableFields(
    row: FacConfirmRow,
    process: FacConfirmProcessGroup,
): readonly FacConfirmEditableField[] {
    return (
        getMatchedEditRule(row, process)?.editableFields
        ?? FAC_CONFIRM_PROCESS_CONFIG[process].columns
    )
}

export function isFieldEditableForRow(
    row: FacConfirmRow,
    process: FacConfirmProcessGroup | null,
    field: string,
): field is FacConfirmEditableField {
    return process != null
        && getEditableFields(row, process).some(
            (editableField) => editableField === field,
        )
}

// Mọi cột có thể sửa ở công đoạn (mặc định + các quy tắc).
// Dùng cho cờ editable của cột DataGrid; quyền từng ô vẫn theo getEditableFields.
export function getProcessEditableFields(
    process: FacConfirmProcessGroup,
): FacConfirmEditableField[] {
    return [
        ...new Set([
            ...FAC_CONFIRM_PROCESS_CONFIG[process].columns,

            ...FAC_CONFIRM_EDIT_RULES
                .filter((rule) => rule.process === process)
                .flatMap((rule) => rule.editableFields),
        ]),
    ]
}

// Ô bị khóa riêng do quy tắc (mặc định sửa được nhưng quy tắc không cho).
export function getRuleLockedFields(
    row: FacConfirmRow,
    process: FacConfirmProcessGroup,
): FacConfirmEditableField[] {
    const rule = getMatchedEditRule(row, process)

    if (!rule) {
        return []
    }

    return FAC_CONFIRM_PROCESS_CONFIG[process].columns.filter(
        (field) => !rule.editableFields.includes(field),
    )
}
