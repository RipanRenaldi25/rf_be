
import {
  IcalculateWeightInPcs,
  ICreateShelf,
  IMaterial,
  InventoryTransaction,
  ISearchFilter,
  ISearchMaterialPayload,
  IUpdateInventory,
  IUser,
} from "./lib/types";
import { prismaClient } from "./prismaClient";
import { AuthService } from "./services/AuthService";
import { MaterialService } from "./services/MaterialService";
import { StatisticService } from "./services/StatisticService";
import { AuthorizationError } from "./utils/error/AuthorizationError";
import { ClientError } from "./utils/error/ClientError";
import { handleError } from "./utils/error/HandleError";

export const resolver = {
  Query: {
    hello: () => {
      return "test2";
    },
    getMaterialById: async (_: any, { id }: { id: any }, context: any) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authenticated");
        }
        const material = await MaterialService.getMaterialById(id);

        return material;
      } catch (err: any) {
        handleError(err);
      }
    },

    getMaterialByProperty: async (
      _: any,
      { name, detail, color }: { name: string; detail: string; color?: string },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authenticated");
        }
        const material = await MaterialService.getMaterialByProperty({
          name,
          detail,
          color,
          user_id: context.user.id,
        });
        return material;
      } catch (err: any) {
        handleError(err);
      }
    },

    getInventoryTransactions: async (
      _: any,
      { filter }: { filter: any },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authenticated");
        }
        const returnedInventoryTransaction =
          await MaterialService.getInventoryTransactions(
            context.user.id,
            filter
          );

        return returnedInventoryTransaction;
      } catch (err: any) {
        handleError(err);
      }
    },

    getMaterialCategorySummary: async (_: any, {}, context: any) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authenticated");
        }
        const summary = await StatisticService.getMaterialCategorySummary(
          context.user.id
        );
        return summary;
      } catch (err: any) {
        handleError(err);
      }
    },

    getLastWeekMaterialSummary: async (_: any, {}, context: any) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authenticated");
        }
        return StatisticService.getLastWeekMaterialSummary(context.user.id);
      } catch (err: any) {
        handleError(err);
      }
    },

    getUsageStatistic: async (_: any, {}, context: any) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authenticated");
        }
        return await StatisticService.getUsageStatistic(context.user.id);
      } catch (err: any) {
        handleError(err);
      }
    },

    getWeekUsageStatistic: async (_: any, {}, context: any) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authenticated");
        }

        return StatisticService.getWeekUsageStatistic(context.user.id);
      } catch (err: any) {
        handleError(err);
      }
    },

    getPerformanceSummary: async (_: any, {}, context: any) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authenticated");
        }

        return StatisticService.getPerformanceSummary(context.user.id);
      } catch (err: any) {
        handleError(err);
      }
    },

    getInventoryBelongToMaterial: async (
      _: any,
      { payload }: { material_id: number; payload: any },
      context: any
    ) => {
      if (!context.user) {
        throw new AuthorizationError("User not authenticated");
      }
      const { name, detail, color, type } = payload;
      return await MaterialService.getInventoryBelongsToMaterial(
        {
          name,
          detail,
          color,
          type,
        },
        context.user.id
      );
    },

    searchInventory: async (
      _: any,
      {
        keyword,
        filter,
      }: { keyword: any; filter: ISearchFilter<InventoryTransaction> },
      context: any
    ) => {
      if (!context) {
        throw new AuthorizationError("User not authenticated");
      }
      const mappedFilter: any = {
        take: filter.take ?? 10,
        skip: filter.skip ?? 0,
      };
      Object.entries(filter ?? {}).map(([key, value]) => {
        mappedFilter[key] = value;
      });

      return await MaterialService.searchInventory(
        keyword,
        context.user.id,
        mappedFilter
      );
    },

    getUserLogin: async (_: any, {}, context: any) => {
      if (!context.user) {
        throw new AuthorizationError("User not authenticated");
      }

      return context.user;
    },

    getShelfsBelongsToUser: async (_: any, {}, context: any) => {
      if (!context.user) {
        throw new AuthorizationError("User not authenticated");
      }
      return MaterialService.getShelfsBelongsToUser(context.user.id);
    },

    calculateMaterialNeededInKg: async (
      _: any,
      {
        payload,
        material,
      }: { payload: IcalculateWeightInPcs; material: ISearchMaterialPayload },
      context: any
    ) => {
      if (!context.user) {
        throw new AuthorizationError("User not authenticated");
      }

      const data = await MaterialService.calculateMaterialNeededInKg(
        context.user.id,
        payload,
        material
      );
      console.log({ data });

      return data;
    },
    searchProduct: async (
      _: any,
      {
        payload,
      }: {
        payload: { id?: number; name?: string; page?: number; size?: number };
      },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authorized");
        }

        return MaterialService.searchProduct(payload, context.user.id);
      } catch (err: any) {
        return handleError(err);
      }
    },
  },

  Mutation: {
    register: async (_: any, { payload }: { payload: IUser }) => {
      try {
        const { newUser } = await AuthService.register(payload);
        return newUser;
      } catch (err: any) {
        console.log(err.message);
        handleError(err);
      }
    },

    login: async (
      _: any,
      { payload }: { payload: Pick<IUser, "email" | "password"> }
    ) => {
      try {
        const { email, password } = payload;
        const { accessToken, refreshToken } = await AuthService.login({
          email,
          password,
        });

        return {
          accessToken,
          refreshToken,
        };
      } catch (err: any) {
        handleError(err);
      }
    },

    addMaterial: async (
      _: any,
      { payload }: { payload: IMaterial },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authenticated");
        }
        const material = await MaterialService.addMaterial(
          payload,
          context.user.id
        );
        return material;
      } catch (err: any) {
        handleError(err);
      }
    },

    addShelf: async (
      _: any,
      { payload }: { payload: ICreateShelf },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authenticated");
        }
        return await MaterialService.addShelf(payload, context.user);
      } catch (err: any) {
        handleError(err);
      }
    },

    releaseMaterial: async (
      _: any,
      {
        inventory_transaction_id,
        payload,
      }: { inventory_transaction_id: number; payload: IUpdateInventory },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authorized");
        }
        return await MaterialService.releaseMaterial(
          inventory_transaction_id,
          payload
        );
      } catch (err: any) {
        handleError(err);
      }
    },

    deleteManyTransactions: async (
      _: any,
      { ids }: { ids: number[] },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authenticated");
        }
        return await MaterialService.deleteManyTransactions(
          ids,
          context.user.id
        );
      } catch (err: any) {
        handleError(err);
      }
    },

    seedMaterialCalculator: async (_: any, {}, context: any) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authenticated");
        }
        return await MaterialService.seedMaterialCalculator(context.user.id);
      } catch (err: any) {
        handleError(err);
      }
    },

    addProduct: async (
      _: any,
      { payload }: { payload: { name: string; weight_required: number } },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authenticated");
        }
        return await MaterialService.addProduct(payload, context.user.id);
      } catch (err: any) {
        handleError(err);
      }
    },

    deleteProduct: async (_: any, { id }: { id: number }, context: any) => {
      try {
        if (!context.user) {
          throw new AuthorizationError("User not authorized");
        }

        return MaterialService.deleteProduct(id, context.user.id);
      } catch (err: any) {
        return handleError(err);
      }
    },
  },

  Material: {
    inventory_transactions: async (parent: any) => {
      try {
        const inventoryTransactions =
          await prismaClient.inventoryTransaction.findMany({
            where: {
              material_id: parent.id,
            },
          });
        return inventoryTransactions;
      } catch (err: any) {
        handleError(err);
      }
    },
    user: async (parent: any) => {
      try {
        const user = await prismaClient.material.findUnique({
          where: {
            id: parent.id,
          },
          include: {
            user: true,
          },
        });
        return user?.user;
      } catch (err: any) {
        handleError(err);
      }
    },
    filtered_inventory_transactions: async (parent: any) => {
      console.log({ parent });
      return parent?.inventory_transactions ?? [];
    },
  },

  InventoryTransaction: {
    shelf: async (parent: any) => {
      try {
        const shelf = await prismaClient.shelf.findUnique({
          where: {
            id: parent.shelf_id,
          },
        });

        return shelf;
      } catch (err: any) {
        handleError(err);
      }
    },
    material: async (parent: any) => {
      try {
        const material = await prismaClient.material.findUnique({
          where: {
            id: parent.material_id,
          },
        });

        return material;
      } catch (err: any) {
        handleError(err);
      }
    },
  },

  Product: {
    user: async (parent: any) => {
      return await prismaClient.user.findUnique({
        where: {
          id: parent.user_id,
        },
      });
    },
  },
};
