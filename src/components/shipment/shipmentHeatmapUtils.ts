import type {
    ShipmentFulfillment,
    ShipmentHeatmapRow,
} from '../../types/shipment'

export function toDateKey(
    value: string,
): string {
    return value.substring(0, 10)
}
export function formatDateInput(
    date: Date,
): string {
    const year = date.getFullYear()

    const month = String(
        date.getMonth() + 1,
    ).padStart(2, '0')

    const day = String(
        date.getDate(),
    ).padStart(2, '0')

    return `${year}-${month}-${day}`
}

export function getDefaultShipmentDateRange() {
    const toDate = new Date()

    toDate.setHours(0, 0, 0, 0)

    const fromDate = new Date(toDate)

    fromDate.setDate(
        toDate.getDate() - 13,
    )

    return {
        fromD: formatDateInput(fromDate),
        toD: formatDateInput(toDate),
    }
}

export function buildDateRange(
    fromD: string,
    toD: string,
): string[] {
    const result: string[] = []

    const current = new Date(
        `${fromD}T00:00:00`,
    )

    const end = new Date(
        `${toD}T00:00:00`,
    )

    while (current <= end) {
        result.push(
            formatDateInput(current),
        )

        current.setDate(
            current.getDate() + 1,
        )
    }

    return result
}

export function buildShipmentRows(
    data: ShipmentFulfillment[],
): ShipmentHeatmapRow[] {
    const map = new Map<
        string,
        ShipmentHeatmapRow
    >()

    data.forEach((item) => {
        if (!item.exportD) {
            return
        }

        const shipBy =
            item.shipBy ?? 'N/A'

        const key =
            `${item.cusId}__${shipBy}`

        const date =
            toDateKey(item.exportD)

        let row = map.get(key)

        if (!row) {
            row = {
                key,
                cusId: item.cusId,
                shipBy,
                cells: {},
            }

            map.set(key, row)
        }

        row.cells[date] = {
            date,
            poQty: item.poQty,
            fnQty: item.fnQty,
            ratio: item.fnRatio,
        }
    })

    return Array.from(map.values()).sort(
        (a, b) =>
            a.cusId.localeCompare(b.cusId) ||
            a.shipBy.localeCompare(b.shipBy),
    )
}