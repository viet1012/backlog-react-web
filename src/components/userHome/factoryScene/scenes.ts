import { devScene } from './devScene'
import { inspectionScene } from './inspectionScene'
import { lineScene } from './lineScene'
import { packingScene } from './packingScene'
import type { FactoryScene } from './primitives'

export const SCENES: FactoryScene[] = [lineScene, devScene, inspectionScene, packingScene]
