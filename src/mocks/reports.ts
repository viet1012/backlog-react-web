import type { ProductionOrder } from '../types/report'

export const mockReports: ProductionOrder[] = Array.from(
  { length: 23000 },
  (_, index) => ({
    VBELN: String(4103883798 + index),
    ZGLOBAL_CODE: `807943-${137 + index}`,
    PIER_AUFNR: String(101005630707 + index),
    AUFNR: String(520003467848 + index),

    IssueD: '2026-08-14 00:00:00.000',
    ProductionD: '2026-08-21 00:00:00.000',
    PromiseD: null,
    ExportD: '2026-08-21 00:00:00.000',
    ORG_Date: '2024-11-08 00:00:00.000',
    MSM_Ship: '2024-11-08 00:00:00.000',

    PNAME: `PS-VPB-${index + 1}`,
    RRONYU1: 'DPU',
    ShipBy: index % 2 === 0 ? 'SEA' : 'AIR',

    GAMNG: 40,
    NETPR: 3.61,
    PHCD: `P${2411131 + index}`,
    KWMENG: 40,

    RODENK: '210',
    LOEKZ: null,
    MTO_ID: null,

    PRT_ADDCMT1: null,
    PRT_ADDCMT2: null,
    PRT_STS: null,

    Div: 'PR',
    FERTH: 'Punch Blank',

    PO_SRG_Convert: `807943-${137 + index}`,

    ToDrill: null,
    ToHeat: null,
    ToPK: null,

    Status: index % 4 === 0 ? 'DONE' : 'WIP',
    CurrentProcess: 'SGDT',
    HeatCharge: 'GRINDING',

    ProcessQty: 40,
    Z300Qty: null,
    PkQty: null,
    FinalQty: index % 4 === 0 ? 40 : 0,

    TimeSQuenching: null,
    TimeFHeat: null,

    C_PRODH: 'Punch',
    C_KEYCONTROL1: 'Punch Normal [8-10]',
    C_KEYCONTROL3: 'Punch Line S',

    Updater: null,
    UpdatedAt: null,
  }),
)