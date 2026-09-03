export type TrainingWarningSeverity =
  | 'note'
  | 'warning'
  | 'critical'

export interface TrainingModule {
  id: string
  number: string
  title: string
  slideRange: string
  summary: string
  objectives: string[]
  topics: string[]
  systems: string[]
  workflowSteps: string[]
  warnings: string[]
  resourceIds: string[]
}

export interface PcTrainingFunction {
  id: string
  name: string
  purpose?: string
  whenToUse?: string[]
  inputs?: string[]
  outputs?: string[]
  warnings?: string[]
}

export interface TrainingSystem {
  id: string
  name: string
  category: string
  purpose: string
  uses: string[]
  functions: PcTrainingFunction[]
  notes?: string[]
  relatedTools?: string[]
  sourceSlides?: string
}

export interface PcTrainingTool {
  id: string
  name: string
  purpose: string
  whenToUse: string[]
  inputs: string[]
  outputs: string[]
  successState?: string
  warningState?: string
  errorState?: string
  rules: string[]
  sourceSlides?: string
}

export interface PcCheckDataField {
  name: string
  meaning: string
  note?: string
}

export interface PcCheckDataDataset {
  id: string
  name: string
  category: 'PO' | 'Master' | 'DailyRP'
  purpose: string
  inputs?: string[]
  outputs?: string[]
  fields: PcCheckDataField[]
  notes?: string[]
  sourceSlides?: string
}

export type PcOrderMode = 'mts-manual' | 'mts-auto' | 'mto-manual' | 'mto-auto'

export interface PcUploadCustomerClassification {
  customerId: string
  group: string
  modes: PcOrderMode[]
}

export interface PcUploadWorkflowStep {
  step: number
  title: string
  description: string
  system?: string
  actions: string[]
  checks?: string[]
  warnings?: string[]
}

export interface PcUploadOrderTraining {
  overview: string
  whenToUse: string[]
  customerClassification: PcUploadCustomerClassification[]
  formats: string[]
  nameConversionFormats: string[]
  prerequisites: string[]
  workflow: PcUploadWorkflowStep[]
  successStates: string[]
  warningStates: string[]
  errorStates: string[]
  importantRules: string[]
  essentialVisualContent: string[]
  todoSourceConfirmation: string[]
  sourceSlides?: string
}

export interface PcIssueWorkflowStep {
  step: number
  title: string
  purpose: string
  system?: string
  tool?: string
  worksheet?: string
  actions: string[]
  inputs?: string[]
  checks?: string[]
  expectedResult?: string
  warnings?: string[]
}

export interface PcIssueTraining {
  overview: string
  whenToUse: string[]
  prerequisites: string[]
  workflow: PcIssueWorkflowStep[]
  successStates: string[]
  warningStates: string[]
  errorStates: string[]
  importantRules: string[]
  essentialVisualContent: string[]
  todoSourceConfirmation: string[]
  sourceSlides?: string
}

export interface PcExportListConcept {
  title: string
  definition: string
  relationship?: string
}

export interface PcExportListReferenceItem {
  value: string
  meaning: string
  action?: string
  warning?: string
}

export interface PcExportListWorkflowStep {
  step: number
  title: string
  purpose: string
  system?: string
  tool?: string
  timing?: string
  actions: string[]
  inputs?: string[]
  checks?: string[]
  expectedResult?: string
  warnings?: string[]
}

export interface PcExportListTraining {
  overview: string
  whenToUse: string[]
  concepts: {
    exportList: PcExportListConcept
    packingList: PcExportListConcept
  }
  prerequisites: string[]
  deliveryTerms: PcExportListReferenceItem[]
  coRvcRules: PcExportListReferenceItem[]
  judgeDefinitions: PcExportListReferenceItem[]
  workflow: PcExportListWorkflowStep[]
  successStates: string[]
  warningStates: string[]
  errorStates: string[]
  importantRules: string[]
  essentialVisualContent: string[]
  todoSourceConfirmation: string[]
  sourceSlides?: string
}

export interface PcStockReplacementStep {
  step: number
  title: string
  system?: string
  tool?: string
  worksheet?: string
  actions: string[]
  inputs?: string[]
  checks?: string[]
  expectedResult?: string
  warnings?: string[]
}

export interface PcStockReplacementWorkflow {
  id: 'split-order' | 'compensation-order' | 'stock-out' | 'stock-in' | 'replacement-order' | 'nocom-replacement'
  title: string
  overview: string
  whenToUse: string[]
  prerequisites: string[]
  systems: string[]
  tools: string[]
  steps: PcStockReplacementStep[]
  importantRules: string[]
}

export interface PcStockReplacementTraining {
  overview: string
  workflows: PcStockReplacementWorkflow[]
  processBomRules: string[]
  warningStates: string[]
  errorStates: string[]
  essentialVisualContent: string[]
  todoSourceConfirmation: string[]
  sourceSlides?: string
}

export interface TrainingTerm {
  term: string
  name?: string
  definition: string
  category: string
}

export interface TrainingWarning {
  id: string
  severity: TrainingWarningSeverity
  title: string
  message: string
  slideSources: string
}

export interface TrainingResource {
  id: string
  category: string
  title: string
  description: string
  status: 'reference' | 'coming-soon'
  slideSources: string
}

export interface OrderFlowNode {
  id: string
  label: string
  caption: string
}
