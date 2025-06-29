export interface IUser {
  name: string;
  phone_number: string;
  email: string;
  password: string;
  company_name: string;
}

export type MATERIAL_TYPE = "WASTE" | "REUSE" | "REUTILIZATION";
export type MOVEMENT_TYPE = "IN" | "OUT";

export interface IMaterial {
  name: string;
  detail: string;
  color?: string;
  stock?: number;
  type: MATERIAL_TYPE;
  shelf_id: number;
}

export interface ICreateShelf {
  rack: string;
  number: number;
}

export interface IUpdateInventory {
  movement: MOVEMENT_TYPE;
  stock: number;
  shelf_id: number;
}

export interface ISearchMaterialPayload {
  name: string;
  detail: string;
  color?: string;
  type: "REUSE" | "REUTILIZATION" | "WASTE";
}

export interface ISearchFilter<T> {
  skip?: number;
  take?: number;
  orderBy: T;
}

export interface InventoryTransaction {
  id: number;
  material_id: number;
  movement: MOVEMENT_TYPE;
  stock: number;
  created_at: Date;
  updated_at: Date;
  shelf_id: number;
}

export interface IcalculateWeightInPcs {
  pcs: number;
  requirementInPcs: number;
}
