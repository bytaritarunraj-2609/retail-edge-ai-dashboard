export const RETAIL_PRODUCT_CLASSES = [
  'bottle',
  'cup',
  'vase',
  'cell phone',
  'book',
  'backpack',
  'handbag'
];

export interface ShelfConfig {
  cameraId: number;
  shelfId: string;
  registeredObjects: string[];
}

export const SHELF_CONFIGS: Record<number, ShelfConfig> = {
  3: {
    cameraId: 3,
    shelfId: 'SHELF-03',
    registeredObjects: ['bottle']
  },
  4: {
    cameraId: 4,
    shelfId: 'SHELF-04',
    registeredObjects: ['cup', 'cell phone']
  }
};
