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

    // Tên nhóm dòng khớp quy tắc, dùng cho tooltip tiêu đề cột
    // (vd "Chỉ nhập với hàng Không có Heat")
    matchLabel: string

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
        matchLabel: 'hàng Không có Heat',
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


// =========================================================
// COVERAGE THEO DÒNG ĐANG HIỂN THỊ
//
// allFields : field sửa được ở MỌI dòng
// someFields: field sửa được ở ít nhất một dòng, không phải mọi dòng
//
// Chưa có dòng (đang tải / rỗng) => theo cột của công đoạn,
// để tiêu đề không nhấp nháy.
// =========================================================

export interface FacConfirmEditableFieldCoverage {
    allFields: FacConfirmEditableField[]
    someFields: FacConfirmEditableField[]
}

export function getEditableFieldCoverage(
    rows: readonly FacConfirmRow[],
    process: FacConfirmProcessGroup | null,
): FacConfirmEditableFieldCoverage {
    if (!process) {
        return { allFields: [], someFields: [] }
    }

    if (rows.length === 0) {
        return {
            allFields: [...FAC_CONFIRM_PROCESS_CONFIG[process].columns],
            someFields: [],
        }
    }

    const counts = new Map<FacConfirmEditableField, number>()

    rows.forEach((row) => {
        getEditableFields(row, process).forEach((field) => {
            counts.set(field, (counts.get(field) ?? 0) + 1)
        })
    })

    // Giữ thứ tự cột: cột công đoạn trước, cột quy tắc mở thêm sau
    const fields = getProcessEditableFields(process)

    return {
        allFields: fields.filter(
            (field) => counts.get(field) === rows.length,
        ),
        someFields: fields.filter((field) => {
            const count = counts.get(field) ?? 0
            return count > 0 && count < rows.length
        }),
    }
}


// =========================================================
// MÔ TẢ THEO FIELD (tooltip tiêu đề cột)
//
// Quy tắc mở thêm field   => "Chỉ nhập với <matchLabel>"
// Quy tắc khóa field      => "Không nhập với <matchLabel>"
// =========================================================

export function getFieldRuleDescription(
    process: FacConfirmProcessGroup,
    field: FacConfirmEditableField,
): string | null {
    const isProcessColumn =
        FAC_CONFIRM_PROCESS_CONFIG[process].columns.includes(field)

    const descriptions = FAC_CONFIRM_EDIT_RULES
        .filter((rule) => rule.process === process)
        .flatMap((rule) => {
            const ruleAllows = rule.editableFields.includes(field)

            if (!isProcessColumn && ruleAllows) {
                return [`Chỉ nhập với ${rule.matchLabel}`]
            }

            if (isProcessColumn && !ruleAllows) {
                return [`Không nhập với ${rule.matchLabel}`]
            }

            return []
        })

    return descriptions.length > 0
        ? descriptions.join('. ')
        : null
}
