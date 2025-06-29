import { Prisma } from "@prisma/client";
import {
  IcalculateWeightInPcs as calculateWeightInPcs,
  ICreateShelf,
  IMaterial,
  ISearchMaterialPayload,
  IUpdateInventory,
} from "../lib/types";
import { prismaClient } from "../prismaClient";
import { ClientError } from "../utils/error/ClientError";
import { NotFoundError } from "../utils/error/NotFoundError";

export const MaterialService = {
  addMaterial: async (payload: IMaterial, userId: number) => {
    const { name, detail, type, color, stock, shelf_id } = payload;

    const materialOnDatabase = await prismaClient.material.findFirst({
      where: {
        name: name.toLowerCase(),
        detail: detail?.toLowerCase(),
        color: color?.toLowerCase(),
        type,
        user_id: userId,
      },
    });

    let shelf = await prismaClient.shelf.findFirst({
      where: {
        id: shelf_id,
        user_id: userId,
      },
    });

    if (!shelf) {
      throw new NotFoundError("Shelf not found");
    }

    if (!materialOnDatabase) {
      const material = await prismaClient.material.create({
        data: {
          name: name.toLowerCase(),
          detail: detail.toLowerCase(),
          type,
          color: color?.toLowerCase(),

          user_id: userId,
          stock,
          inventory_transactions: {
            create: {
              stock: stock ?? 0,
              movement: "IN",
              shelf_id: shelf.id,
            },
          },
          histories: {
            create: {
              stock: stock ?? 0,
              movement: "IN",
              shelf_id: shelf.id,
            },
          },
        },
      });
      return material;
    }

    const material = await prismaClient.material.update({
      where: {
        id: materialOnDatabase.id,
      },
      data: {
        stock: {
          increment: payload.stock ?? 0,
        },
        inventory_transactions: {
          create: {
            movement: "IN",
            stock: payload.stock ?? 0,
            shelf_id: payload.shelf_id,
          },
        },
        histories: {
          create: {
            movement: "IN",
            stock: payload.stock ?? 0,
            shelf_id: payload.shelf_id,
          },
        },
      },
    });

    return material;
  },

  addShelf: async (payload: ICreateShelf, user: any) => {
    const shelf = await prismaClient.shelf.findFirst({
      where: {
        number: payload.number,
        rack: payload.rack,
        user_id: user.id,
      },
    });
    if (!!shelf) {
      throw new ClientError("Shelf already exists", 400);
    }
    const newShelf = await prismaClient.shelf.create({
      data: {
        rack: payload.rack.toUpperCase(),
        number: payload.number,
        user_id: user.id,
      },
    });
    return newShelf;
  },

  getMaterialById: async (id: number) => {
    const material = await prismaClient.material.findUnique({
      where: {
        id,
      },
    });
    if (!material) {
      throw new NotFoundError("Material tidak ditemukan");
    }
    return material;
  },

  getMaterialByProperty: async ({
    name,
    detail,
    color,
    user_id,
  }: {
    name: string;
    detail: string;
    color?: string;
    user_id: number;
  }) => {
    const material = await prismaClient.material.findMany({
      where: {
        name,
        detail,
        color,
        user_id,
      },
    });
    if (!material) {
      throw new NotFoundError(
        `Material with name ${name}, detail ${detail} and color ${color} not found`
      );
    }

    return material;
  },

  getInventoryTransactions: async (user_id: number, filter?: any) => {
    const inventoryTransactions =
      await prismaClient.inventoryTransaction.findMany({
        where: {
          material: {
            user_id,
          },
        },
      });
    const totalTransaction = await prismaClient.inventoryTransaction.count({
      where: {
        material: {
          user_id,
        },
      },
    });
    const total = +totalTransaction.toString();
    const take = filter?.take ?? 10;
    const skip = filter?.skip ?? 0;
    const currentPage = skip / take + 1;

    const sortedData = inventoryTransactions.sort((a: any, b: any) => {
      const aIsInWithStock = a.movement === "IN" && a.stock > 0;
      const bIsInWithStock = b.movement === "IN" && b.stock > 0;

      if (aIsInWithStock && !bIsInWithStock) return -1;
      if (!aIsInWithStock && bIsInWithStock) return 1;
      return 0;
    });

    return {
      take,
      skip,
      currentPage,
      total,
      data: sortedData,
    };
  },

  releaseMaterial: async (
    inventory_transaction_id: number,
    payload: IUpdateInventory
  ) => {
    const inventoryTransaction =
      await prismaClient.inventoryTransaction.findUnique({
        where: {
          id: inventory_transaction_id,
          movement: "IN",
        },
        include: {
          material: {
            select: {
              stock: true,
              id: true,
            },
          },
        },
      });
    if (!inventoryTransaction) {
      throw new NotFoundError("Inventory transaction not found");
    }
    if (inventoryTransaction.material.stock.toNumber() < payload.stock) {
      throw new ClientError("Stock is not sufficient", 400);
    }

    if (inventoryTransaction.stock.toNumber() < payload.stock) {
      throw new ClientError(
        "Stock from inventory transaction (shelf) is not sufficient"
      );
    }

    return await prismaClient.$transaction(
      async (trx: Prisma.TransactionClient) => {
        const releasedStock = await trx.inventoryTransaction.create({
          data: {
            material_id: inventoryTransaction.material_id,
            movement: payload.movement,
            stock: payload.stock ?? 0,
            shelf_id: payload.shelf_id,
          },
        });

        const addedHistory = await trx.history.create({
          data: {
            material_id: inventoryTransaction.material_id,
            movement: payload.movement,
            stock: payload.stock ?? 0,
            shelf_id: payload.shelf_id,
          },
        });

        await trx.material.update({
          where: {
            id: releasedStock.material_id,
          },
          data: {
            stock: {
              decrement: payload.stock,
            },
          },
        });

        await prismaClient.inventoryTransaction.update({
          where: {
            id: inventory_transaction_id,
          },
          data: {
            stock: {
              decrement: payload.stock,
            },
          },
        });
        return releasedStock;
      }
    );
  },

  deleteManyTransactions: async (ids: number[], userId: number) => {
    await prismaClient.$transaction(async (trx: Prisma.TransactionClient) => {
      const transactions = await trx.inventoryTransaction.findMany({
        where: {
          id: {
            in: ids,
          },
        },
        select: {
          id: true,
          stock: true,
          material_id: true,
        },
      });

      const mappedMaterialToReduceStock = new Map();

      for (const transaction of transactions) {
        mappedMaterialToReduceStock.set(
          transaction.material_id,
          (mappedMaterialToReduceStock.get(transaction.material_id) ?? 0) +
            transaction.stock
        );
      }

      await Promise.all(
        Array.from(mappedMaterialToReduceStock.entries()).map(
          async ([materialId, stockToReduce]) => {
            await trx.material.update({
              where: {
                id: materialId,
              },
              data: {
                stock: {
                  decrement: stockToReduce,
                },
              },
            });
          }
        )
      );

      const deletedTransactions = await trx.inventoryTransaction.deleteMany({
        where: {
          id: {
            in: ids,
          },
          material: {
            user_id: userId,
          },
        },
      });
    });

    return ids;
  },
  getInventoryBelongsToMaterial: async (
    payload: ISearchMaterialPayload,
    userId: number
  ) => {
    const materialWithInventoryTransactions =
      await prismaClient.material.findFirst({
        where: {
          name: {
            contains: payload.name,
          },
          detail: {
            contains: payload.detail,
          },
          color: {
            contains: payload.color,
          },
          type: payload.type,

          user_id: userId,
        },

        include: {
          inventory_transactions: {
            where: {
              movement: "IN",
              stock: {
                gt: 0,
              },
            },
            include: { shelf: true },
          },
        },
      });

    return materialWithInventoryTransactions;
  },

  searchInventory: async (keyword: string, userId: number, filter?: {}) => {
    const inventoryTransaction =
      await prismaClient.inventoryTransaction.findMany({
        where: {
          material: {
            OR: [
              {
                name: {
                  contains: keyword,
                },
              },
              {
                detail: {
                  contains: keyword,
                },
              },
              {
                color: {
                  contains: keyword,
                },
              },
            ],
            user_id: userId,
          },
        },
        ...filter,
      });

    return inventoryTransaction;
  },

  getShelfsBelongsToUser: async (userId: number) => {
    const shelfs = await prismaClient.shelf.findMany({
      where: {
        user_id: userId,
      },
    });

    return shelfs;
  },

  calculateMaterialNeededInKg: async (
    userId: number,
    payload: calculateWeightInPcs,
    material: ISearchMaterialPayload
  ) => {
    const neededMaterial = payload.pcs * payload.requirementInPcs;
    const materialHolded = await prismaClient.material.findFirst({
      where: {
        name: {
          contains: material.name,
        },
        detail: {
          contains: material.detail,
        },
        color: {
          contains: material.color,
        },
        type: material.type,
        user_id: userId,
      },
      include: {
        inventory_transactions: {
          include: {
            shelf: true,
          },
          where: {
            movement: "IN",
          },
        },
      },
    });

    if (!materialHolded) {
      throw new NotFoundError("Material tidak ditemukan");
    }
    console.log({ materialHolded });

    const calculatedNeededMaterial = neededMaterial - +materialHolded.stock;
    return {
      totalNeededMaterialInKg: neededMaterial,
      neededMaterialInKg:
        calculatedNeededMaterial <= 0 ? 0 : calculatedNeededMaterial,
      stockInInventory: Number(materialHolded.stock) ?? 0,
      filtered_inventory_transactions:
        materialHolded.inventory_transactions.length > 0
          ? materialHolded.inventory_transactions
          : [],
    };
  },

  seedMaterialCalculator: async (userId: number) => {
    const materialCalculators = await prismaClient.materialCalculator.findMany({
      where: {
        user_id: userId,
      },
    });

    const materialSeeded = [
      { name: "Blazer Wool Semi Formal", weight_required: 1 },
      { name: "Celana Denim PJG", weight_required: 0.75 },
      { name: "Celana Tactical Ripstock", weight_required: 0.65 },
      { name: "Celana Pdh American Ori", weight_required: 0.65 },
      { name: "Celana Pdh American", weight_required: 0.6 },
      { name: "Celana pdl Tropical pasada", weight_required: 0.6 },
      { name: "Celana Teslan pjg", weight_required: 0.55 },
      { name: "Celana wp Import - Gtex", weight_required: 0.75 },
      { name: "Jaket Kanvas, Bomber", weight_required: 0.8 },
      { name: "Jaket kanvas, Duck Hooded", weight_required: 0.85 },
      { name: "Jaket kanvas, Modern Blazer", weight_required: 0.9 },
      { name: "Jaket Denim, Classic 301", weight_required: 0.85 },
      { name: "Jaket Denim, Varsity Denim", weight_required: 0.9 },
      { name: "Jaket Fleece, Classic Fleece", weight_required: 0.7 },
      { name: "Jaket Fleece, Classic Jumper", weight_required: 0.7 },
      { name: "Jaket Fleece, College", weight_required: 0.7 },
      { name: "Jaket Fleece, College With Hoodie", weight_required: 0.75 },
      { name: "Jaket Fleece, Double Panel", weight_required: 0.75 },
      { name: "Jaket Fleece, Fullover Hoodie", weight_required: 0.7 },
      { name: "Jaket Kulit, Classic 301", weight_required: 1.3 },
      { name: "Jaket Kulit, Base Ball Collar", weight_required: 1.2 },
      { name: "Jaket Kulit, Double Zip", weight_required: 1.4 },
      { name: "Jaket Kulit, Hoodie AL", weight_required: 1.35 },
      { name: "Jaket Kulit, Modern Biker", weight_required: 1.3 },
      { name: "Jaket Kulit, Varsity Hoodie", weight_required: 1.35 },
      { name: "Jaket Paracute, Base Ball", weight_required: 0.65 },
      { name: "Jaket Paracute, Riversible", weight_required: 0.7 },
      { name: "Jaket Paracute, Raincoat", weight_required: 0.6 },
      { name: "Jaket Tessa, Double Neck F Blazer", weight_required: 0.9 },
      { name: "Jaket Tessa, ARP Blazer", weight_required: 0.9 },
      { name: "Jaket Taslan", weight_required: 0.75 },
      { name: "Jaket Taslan BB", weight_required: 0.8 },
      { name: "Jaket Tessa", weight_required: 0.8 },
      { name: "Jaket Tessa + Twist (BB)", weight_required: 0.85 },
      { name: "Jaket Twist", weight_required: 0.75 },
      { name: "Jaket Twill", weight_required: 0.8 },
      { name: "Jaket Waterproof, Hiking", weight_required: 0.85 },
      { name: "Jaket Almamater", weight_required: 0.8 },
      { name: "Jaket Almamater Var + Puring", weight_required: 0.85 },
      { name: "Jaket Base Ball CDR", weight_required: 0.7 },
      { name: "Jaket Base Ball Cotton 100%", weight_required: 0.65 },
      { name: "Jaket Base Ball CVC", weight_required: 0.7 },
      { name: "Jaker Base Ball Diadora", weight_required: 0.7 },
      { name: "Jaket Bomber Taslan", weight_required: 0.75 },
      { name: "Jaket Corduroy", weight_required: 0.8 },
      { name: "Jaket Despo Mayor Polar", weight_required: 0.7 },
      { name: "Jaket Drill", weight_required: 0.75 },
      { name: "Jaket Hoodie Fleece Cotton 100%", weight_required: 0.65 },
      { name: "Jaket Kanvas American Twill", weight_required: 0.85 },
      { name: "Jaket Kanvas", weight_required: 0.8 },
      { name: "Jaket Sport Lotto", weight_required: 0.65 },
      { name: "Jaket Taslan Gion", weight_required: 0.75 },
      { name: "Jaket Taslan WP", weight_required: 0.8 },
      { name: "Jaket WP Import - GTEX", weight_required: 0.9 },
      { name: "Jaket WP Import - GTEX + Hoodie", weight_required: 0.95 },
      { name: "Jaket Wool Semi Formal", weight_required: 1 },
      { name: "Jaket Americano Sanforized Drill Pdk", weight_required: 0.75 },
      { name: "Jaket Americano Sanforized Drill Pjg", weight_required: 0.8 },
      { name: "Jaket Americano Sanforized Tropical Pdk", weight_required: 0.7 },
      {
        name: "Jaket Americano Sanforized Tropical Pjg",
        weight_required: 0.75,
      },
      { name: "Kemeja Baby Kanvas Pjg", weight_required: 0.32 },
      { name: "Kemeja Baby Kanvas Pdk", weight_required: 0.3 },
      { name: "Kemeja Drill Pjg", weight_required: 0.35 },
      { name: "Kemeja Drill Pdk", weight_required: 0.32 },
      { name: "Kemeja Denim/Cembre Pdk", weight_required: 0.35 },
      { name: "Kemeja Denim/Cembre Pjg", weight_required: 0.38 },
      { name: "Kemeja Drill Japan Pdk", weight_required: 0.34 },
      { name: "Kemeja Drill Japan Pjg", weight_required: 0.37 },
      { name: "Kemeja PDL Rifslock Pdk", weight_required: 0.35 },
      { name: "Kemeja PDL Rifslock Pjg", weight_required: 0.37 },
      { name: "Kemeja Tropical Pjg", weight_required: 0.32 },
      { name: "Kemeja Tropical Pdk", weight_required: 0.3 },
      { name: "Kemeja Toyobo Pdk", weight_required: 0.28 },
      { name: "Kemeja Toyobo Pjg", weight_required: 0.3 },
      { name: "Polo Shirt, Lacoste Cotton", weight_required: 0.25 },
      { name: "Polo Shirt, Lacoste CVC", weight_required: 0.25 },
      { name: "Polo Shirt, Lacoste TC", weight_required: 0.25 },
      { name: "Polo Shirt Cotton Pdk", weight_required: 0.24 },
      { name: "Polo Shirt Cotton Pjg", weight_required: 0.26 },
      { name: "Poloshirt CVC Pdk", weight_required: 0.24 },
      { name: "Poloshirt CVC Pjg", weight_required: 0.26 },
      { name: "Poloshirt PE Pdk", weight_required: 0.22 },
      { name: "Poloshirt PE Pjg", weight_required: 0.24 },
      { name: "Poloshirt PE Soft Pdk", weight_required: 0.22 },
      { name: "Poloshirt PE Soft Pjg", weight_required: 0.24 },
      { name: "Vest Fleece, Vest Hoodie", weight_required: 0.55 },
      { name: "Vest Fleece, Vest Modern College", weight_required: 0.5 },
      { name: "Vest Kulit, L-Vest Hoodie", weight_required: 0.7 },
      { name: "Rompi Cordura", weight_required: 0.6 },
      { name: "Rompi Dinir300", weight_required: 0.6 },
      { name: "Rompi Double Mess", weight_required: 0.55 },
      { name: "Rompi Drill", weight_required: 0.6 },
      { name: "Rompi Kanvas", weight_required: 0.65 },
      { name: "Rompi Kanvas American Twill", weight_required: 0.65 },
      { name: "Rompi Kanvas American Twill + Hoodie", weight_required: 0.7 },
      { name: "Rompi Taslan WP", weight_required: 0.7 },
      { name: "Rompi WP Import  - Glex + Hoodie", weight_required: 0.75 },
      { name: "Rompi WP Import  - Glex 1", weight_required: 0.65 },
      { name: "Sweater Hoodie Fleece Cotton 100%", weight_required: 0.65 },
      { name: "Sweater Hoodie Fleece CDR", weight_required: 0.65 },
      { name: "Sweater Hoodie Fleece CVC", weight_required: 0.65 },
      { name: "Sweater Hoodie Fleece PE", weight_required: 0.6 },
      { name: "Sweater Hoodie Terry", weight_required: 0.55 },
      { name: "Sweater Hoodie Terry Baby", weight_required: 0.5 },
      { name: "Sweater Terry Baby", weight_required: 0.5 },
      { name: "Topi Double Mess", weight_required: 0.1 },
      { name: "Topi Rimba Drill", weight_required: 0.1 },
      { name: "Topi Drill", weight_required: 0.1 },
      { name: "Topi Jala", weight_required: 0.08 },
      { name: "Topi Kanvas", weight_required: 0.12 },
      { name: "Topi Laken", weight_required: 0.1 },
      { name: "Topi Raffel", weight_required: 0.1 },
      { name: "Topi Rimba Drill", weight_required: 0.1 },
      { name: "Topi Rimba Kanvas", weight_required: 0.12 },
      { name: "Topi Twil", weight_required: 0.1 },
      { name: "Topi WP", weight_required: 0.08 },
      { name: "Training Diadora + TS Combad Pdk", weight_required: 0.95 },
      { name: "Training Diadora + TS Combad Pjg", weight_required: 1 },
      { name: "Training + Oblong Combad Pdk", weight_required: 0.9 },
      { name: "Training + Oblong Combad Pjg", weight_required: 0.95 },
      { name: "Training + T-Shirt Pjg", weight_required: 0.95 },
      { name: "Training + T-Shirt Pdk", weight_required: 0.9 },
      { name: "Training + Wangki Cottong SMA Pjg", weight_required: 1 },
      { name: "Training + Wangki Cottong SMA Pdk", weight_required: 0.95 },
      { name: "Training + Wangki PE SMA Pjg", weight_required: 1 },
      { name: "Training + Wangki PE SMA Pdk", weight_required: 0.95 },
      { name: "T-Shirt Jersey Pdk", weight_required: 0.2 },
      { name: "T-Shirt Jersey Pjg", weight_required: 0.22 },
      { name: "T-Shirt Jersey Kerah Pdk", weight_required: 0.23 },
      { name: "T-Shirt Jersey Kerah Pjg", weight_required: 0.25 },
      { name: "T-Shirt O-Neck Lengan Pjg", weight_required: 0.22 },
      { name: "T-Shirt O-Neck Lengan Pdk", weight_required: 0.2 },
      { name: "T-Shirt O-Neck Lengan 3/4", weight_required: 0.21 },
      { name: "T-Shirt Laglan Pdk", weight_required: 0.2 },
      { name: "T-Shirt Laglan Pjg", weight_required: 0.22 },
      { name: "T-Shirt Laglan 3/4", weight_required: 0.21 },
      { name: "T-Shirt Laglan Tactical", weight_required: 0.25 },
      { name: "T-Shirt Tactical C20s Pdk", weight_required: 0.24 },
      { name: "T-Shirt Tactical C20s Pjg", weight_required: 0.26 },
      { name: "T-Shirt V-Neck Pjg", weight_required: 0.24 },
      { name: "T-Shirt V-Neck Pdk", weight_required: 0.22 },
    ];

    const materialSeededWithUser = materialSeeded.map((material) => ({
      ...material,
      user_id: userId,
    }));

    console.log({ materialCalculators });

    if (!materialCalculators.length) {
      const materials = await prismaClient.materialCalculator.createMany({
        data: materialSeededWithUser,
      });
      return materials;
    }
    return materialCalculators;
  },

  addProduct: async (
    payload: { name: string; weight_required: number },
    userId: number
  ) => {
    const productExists = await prismaClient.materialCalculator.findFirst({
      where: {
        name: payload.name.toLowerCase(),
        weight_required: payload.weight_required,
      },
    });

    if (productExists) {
      throw new ClientError("Produk sudah ada");
    }

    const productAdded = await prismaClient.materialCalculator.create({
      data: {
        name: payload.name,
        weight_required: payload.weight_required,
        user_id: userId,
      },
    });

    return productAdded;
  },
  deleteProduct: async (id: number, userId: number) => {
    const productExists = await prismaClient.materialCalculator.findUnique({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!productExists) {
      throw new NotFoundError("Produk tidak ditemukan");
    }

    const deletedProduct = await prismaClient.materialCalculator.delete({
      where: {
        id,
      },
    });

    return deletedProduct;
  },

  searchProduct: async (
    payload: { id?: number; name?: string; page?: number; size?: number },
    userId: number
  ) => {
    const take = payload.size ?? 10;
    const skip = ((payload.page ?? 1) - 1) * take;
    const totalData = await prismaClient.materialCalculator.count();
    if (payload.id) {
      console.log({ id: payload.id });
      return {
        totalData,
        products: [
          await prismaClient.materialCalculator.findUnique({
            where: {
              id: payload.id,
              user_id: userId,
            },
          }),
        ],
      };
    }

    if (payload.name) {
      return {
        totalData,
        products: prismaClient.materialCalculator.findMany({
          where: {
            name: {
              contains: payload.name,
            },
            user_id: userId,
          },
        }),
      };
    }

    return {
      totalData,
      products: await prismaClient.materialCalculator.findMany({
        where: {
          user_id: userId,
        },
        take,
        skip,
      }),
    };
  },
};
