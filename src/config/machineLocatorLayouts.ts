import factoryAF1 from '../data/machineLocator/factoryA-f1.json'
import factoryBF1 from '../data/machineLocator/factoryB-f1.json'
import factoryCF1 from '../data/machineLocator/factoryC-f1.json'
import type {
  LayoutData,
  MachineLayoutConfig,
} from '../types/machineLocator'
import { machineLayoutFiles } from './machineLocatorFiles'

// =========================================================
// LAYOUTS (thứ tự = thứ tự tab)
// Thêm tầng / nhà máy mới: chạy scripts/machine-locator/prepare_layout.py để tạo
// ảnh + JSON, khai báo đường dẫn JSON trong machineLocatorFiles.ts rồi thêm 1 phần tử ở đây.
// =========================================================

export const machineLayouts: MachineLayoutConfig[] = [
  {
    id: 'factory-a-f1',
    name: 'Fac A',
    drawingTitle: 'Factory A, tầng 1',
    image: `${import.meta.env.BASE_URL}assets/machine-locator/factory-a-f1.png`,
    imageAlt: 'Layout Factory A, tầng 1',
    data: factoryAF1 as unknown as LayoutData,
    dataFile: machineLayoutFiles['factory-a-f1'],
    exportMeta: {
      factory: 'Factory A',
      floor: '1st floor',
      sourcePdf: 'factoryA-f1.pdf',
      imageFile: 'factory-a-layout.png',
      filePrefix: 'factory-a',
    },
  },
  {
    id: 'factory-b-f1',
    name: 'Fac B',
    drawingTitle: 'Factory B, tầng 1 (bản vẽ 30/09/2026)',
    image: `${import.meta.env.BASE_URL}assets/machine-locator/factory-b-f1.png`,
    imageAlt: 'Layout Factory B, tầng 1',
    data: factoryBF1 as unknown as LayoutData,
    dataFile: machineLayoutFiles['factory-b-f1'],
    exportMeta: {
      factory: 'Factory B',
      floor: '1st floor',
      sourcePdf: 'LT2-1st_Floor_FAC_B_T_VINH_20260930.pdf',
      imageFile: 'factory-b-layout.png',
      filePrefix: 'factory-b',
    },
  },
  {
    id: 'factory-c-f1',
    name: 'Fac C',
    drawingTitle: 'Factory C, tầng 1',
    image: `${import.meta.env.BASE_URL}assets/machine-locator/factory-c-f1.png`,
    imageAlt: 'Layout Factory C, tầng 1',
    data: factoryCF1 as unknown as LayoutData,
    dataFile: machineLayoutFiles['factory-c-f1'],
    exportMeta: {
      factory: 'Factory C',
      floor: '1st floor',
      sourcePdf: 'factoryC-f1.pdf',
      imageFile: 'factory-c-layout.png',
      filePrefix: 'factory-c',
    },
  },
]

export const DEFAULT_MACHINE_LAYOUT_ID = 'factory-b-f1'
