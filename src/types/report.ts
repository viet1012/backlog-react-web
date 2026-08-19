export interface ProductionOrder {
  VBELN: string
  ZGLOBAL_CODE: string
  PIER_AUFNR: string
  AUFNR: string

  IssueD: string | null
  ProductionD: string | null
  PromiseD: string | null
  ExportD: string | null
  ORG_Date: string | null
  MSM_Ship: string | null

  PNAME: string | null
  RRONYU1: string | null
  ShipBy: string | null

  GAMNG: number | null
  NETPR: number | null
  PHCD: string | null
  KWMENG: number | null

  RODENK: string | null
  LOEKZ: string | null
  MTO_ID: string | null

  PRT_ADDCMT1: string | null
  PRT_ADDCMT2: string | null
  PRT_STS: string | null

  Div: string | null
  FERTH: string | null

  PO_SRG_Convert: string | null

  ToDrill: string | null
  ToHeat: string | null
  ToPK: string | null

  Status: string | null
  CurrentProcess: string | null

  HeatCharge: string | null

  ProcessQty: number | null
  Z300Qty: number | null
  PkQty: number | null
  FinalQty: number | null

  TimeSQuenching: string | null
  TimeFHeat: string | null

  C_PRODH: string | null
  C_KEYCONTROL1: string | null
  C_KEYCONTROL3: string | null

  Updater: string | null
  UpdatedAt: string | null
}