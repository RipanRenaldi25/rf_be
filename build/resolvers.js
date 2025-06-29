"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolver = void 0;
const prismaClient_1 = require("./prismaClient");
const AuthService_1 = require("./services/AuthService");
const MaterialService_1 = require("./services/MaterialService");
const StatisticService_1 = require("./services/StatisticService");
const AuthorizationError_1 = require("./utils/error/AuthorizationError");
const HandleError_1 = require("./utils/error/HandleError");
exports.resolver = {
    Query: {
        hello: () => {
            return "test2";
        },
        getMaterialById: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { id }, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authenticated");
                }
                const material = yield MaterialService_1.MaterialService.getMaterialById(id);
                return material;
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        getMaterialByProperty: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { name, detail, color }, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authenticated");
                }
                const material = yield MaterialService_1.MaterialService.getMaterialByProperty({
                    name,
                    detail,
                    color,
                    user_id: context.user.id,
                });
                return material;
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        getInventoryTransactions: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { filter }, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authenticated");
                }
                const returnedInventoryTransaction = yield MaterialService_1.MaterialService.getInventoryTransactions(context.user.id, filter);
                return returnedInventoryTransaction;
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        getMaterialCategorySummary: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, {}, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authenticated");
                }
                const summary = yield StatisticService_1.StatisticService.getMaterialCategorySummary(context.user.id);
                return summary;
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        getLastWeekMaterialSummary: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, {}, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authenticated");
                }
                return StatisticService_1.StatisticService.getLastWeekMaterialSummary(context.user.id);
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        getUsageStatistic: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, {}, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authenticated");
                }
                return yield StatisticService_1.StatisticService.getUsageStatistic(context.user.id);
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        getWeekUsageStatistic: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, {}, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authenticated");
                }
                return StatisticService_1.StatisticService.getWeekUsageStatistic(context.user.id);
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        getPerformanceSummary: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, {}, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authenticated");
                }
                return StatisticService_1.StatisticService.getPerformanceSummary(context.user.id);
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        getInventoryBelongToMaterial: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { payload }, context) {
            if (!context.user) {
                throw new AuthorizationError_1.AuthorizationError("User not authenticated");
            }
            const { name, detail, color, type } = payload;
            return yield MaterialService_1.MaterialService.getInventoryBelongsToMaterial({
                name,
                detail,
                color,
                type,
            }, context.user.id);
        }),
        searchInventory: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { keyword, filter, }, context) {
            var _b, _c;
            if (!context) {
                throw new AuthorizationError_1.AuthorizationError("User not authenticated");
            }
            const mappedFilter = {
                take: (_b = filter.take) !== null && _b !== void 0 ? _b : 10,
                skip: (_c = filter.skip) !== null && _c !== void 0 ? _c : 0,
            };
            Object.entries(filter !== null && filter !== void 0 ? filter : {}).map(([key, value]) => {
                mappedFilter[key] = value;
            });
            return yield MaterialService_1.MaterialService.searchInventory(keyword, context.user.id, mappedFilter);
        }),
        getUserLogin: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, {}, context) {
            if (!context.user) {
                throw new AuthorizationError_1.AuthorizationError("User not authenticated");
            }
            return context.user;
        }),
        getShelfsBelongsToUser: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, {}, context) {
            if (!context.user) {
                throw new AuthorizationError_1.AuthorizationError("User not authenticated");
            }
            return MaterialService_1.MaterialService.getShelfsBelongsToUser(context.user.id);
        }),
        calculateMaterialNeededInKg: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { payload, material, }, context) {
            if (!context.user) {
                throw new AuthorizationError_1.AuthorizationError("User not authenticated");
            }
            const data = yield MaterialService_1.MaterialService.calculateMaterialNeededInKg(context.user.id, payload, material);
            console.log({ data });
            return data;
        }),
        searchProduct: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { payload, }, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authorized");
                }
                return MaterialService_1.MaterialService.searchProduct(payload, context.user.id);
            }
            catch (err) {
                return (0, HandleError_1.handleError)(err);
            }
        }),
    },
    Mutation: {
        register: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { payload }) {
            try {
                const { newUser } = yield AuthService_1.AuthService.register(payload);
                return newUser;
            }
            catch (err) {
                console.log(err.message);
                (0, HandleError_1.handleError)(err);
            }
        }),
        login: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { payload }) {
            try {
                const { email, password } = payload;
                const { accessToken, refreshToken } = yield AuthService_1.AuthService.login({
                    email,
                    password,
                });
                return {
                    accessToken,
                    refreshToken,
                };
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        addMaterial: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { payload }, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authenticated");
                }
                const material = yield MaterialService_1.MaterialService.addMaterial(payload, context.user.id);
                return material;
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        addShelf: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { payload }, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authenticated");
                }
                return yield MaterialService_1.MaterialService.addShelf(payload, context.user);
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        releaseMaterial: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { inventory_transaction_id, payload, }, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authorized");
                }
                return yield MaterialService_1.MaterialService.releaseMaterial(inventory_transaction_id, payload);
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        deleteManyTransactions: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { ids }, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authenticated");
                }
                return yield MaterialService_1.MaterialService.deleteManyTransactions(ids, context.user.id);
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        seedMaterialCalculator: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, {}, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authenticated");
                }
                return yield MaterialService_1.MaterialService.seedMaterialCalculator(context.user.id);
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        addProduct: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { payload }, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authenticated");
                }
                return yield MaterialService_1.MaterialService.addProduct(payload, context.user.id);
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        deleteProduct: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { id }, context) {
            try {
                if (!context.user) {
                    throw new AuthorizationError_1.AuthorizationError("User not authorized");
                }
                return MaterialService_1.MaterialService.deleteProduct(id, context.user.id);
            }
            catch (err) {
                return (0, HandleError_1.handleError)(err);
            }
        }),
    },
    Material: {
        inventory_transactions: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const inventoryTransactions = yield prismaClient_1.prismaClient.inventoryTransaction.findMany({
                    where: {
                        material_id: parent.id,
                    },
                });
                return inventoryTransactions;
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        user: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const user = yield prismaClient_1.prismaClient.material.findUnique({
                    where: {
                        id: parent.id,
                    },
                    include: {
                        user: true,
                    },
                });
                return user === null || user === void 0 ? void 0 : user.user;
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        filtered_inventory_transactions: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            console.log({ parent });
            return (_a = parent === null || parent === void 0 ? void 0 : parent.inventory_transactions) !== null && _a !== void 0 ? _a : [];
        }),
    },
    InventoryTransaction: {
        shelf: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const shelf = yield prismaClient_1.prismaClient.shelf.findUnique({
                    where: {
                        id: parent.shelf_id,
                    },
                });
                return shelf;
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
        material: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const material = yield prismaClient_1.prismaClient.material.findUnique({
                    where: {
                        id: parent.material_id,
                    },
                });
                return material;
            }
            catch (err) {
                (0, HandleError_1.handleError)(err);
            }
        }),
    },
    Product: {
        user: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield prismaClient_1.prismaClient.user.findUnique({
                where: {
                    id: parent.user_id,
                },
            });
        }),
    },
};
