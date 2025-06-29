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
exports.MaterialService = void 0;
const prismaClient_1 = require("../prismaClient");
const ClientError_1 = require("../utils/error/ClientError");
const NotFoundError_1 = require("../utils/error/NotFoundError");
exports.MaterialService = {
    addMaterial: (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const { name, detail, type, color, stock, shelf_id } = payload;
        const materialOnDatabase = yield prismaClient_1.prismaClient.material.findFirst({
            where: {
                name: name.toLowerCase(),
                detail: detail === null || detail === void 0 ? void 0 : detail.toLowerCase(),
                color: color === null || color === void 0 ? void 0 : color.toLowerCase(),
                type,
                user_id: userId,
            },
        });
        let shelf = yield prismaClient_1.prismaClient.shelf.findFirst({
            where: {
                id: shelf_id,
                user_id: userId,
            },
        });
        if (!shelf) {
            throw new NotFoundError_1.NotFoundError("Shelf not found");
        }
        if (!materialOnDatabase) {
            const material = yield prismaClient_1.prismaClient.material.create({
                data: {
                    name: name.toLowerCase(),
                    detail: detail.toLowerCase(),
                    type,
                    color: color === null || color === void 0 ? void 0 : color.toLowerCase(),
                    user_id: userId,
                    stock,
                    inventory_transactions: {
                        create: {
                            stock: stock !== null && stock !== void 0 ? stock : 0,
                            movement: "IN",
                            shelf_id: shelf.id,
                        },
                    },
                    histories: {
                        create: {
                            stock: stock !== null && stock !== void 0 ? stock : 0,
                            movement: "IN",
                            shelf_id: shelf.id,
                        },
                    },
                },
            });
            return material;
        }
        const material = yield prismaClient_1.prismaClient.material.update({
            where: {
                id: materialOnDatabase.id,
            },
            data: {
                stock: {
                    increment: (_a = payload.stock) !== null && _a !== void 0 ? _a : 0,
                },
                inventory_transactions: {
                    create: {
                        movement: "IN",
                        stock: (_b = payload.stock) !== null && _b !== void 0 ? _b : 0,
                        shelf_id: payload.shelf_id,
                    },
                },
                histories: {
                    create: {
                        movement: "IN",
                        stock: (_c = payload.stock) !== null && _c !== void 0 ? _c : 0,
                        shelf_id: payload.shelf_id,
                    },
                },
            },
        });
        return material;
    }),
    addShelf: (payload, user) => __awaiter(void 0, void 0, void 0, function* () {
        const shelf = yield prismaClient_1.prismaClient.shelf.findFirst({
            where: {
                number: payload.number,
                rack: payload.rack,
                user_id: user.id,
            },
        });
        if (!!shelf) {
            throw new ClientError_1.ClientError("Shelf already exists", 400);
        }
        const newShelf = yield prismaClient_1.prismaClient.shelf.create({
            data: {
                rack: payload.rack.toUpperCase(),
                number: payload.number,
                user_id: user.id,
            },
        });
        return newShelf;
    }),
    getMaterialById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const material = yield prismaClient_1.prismaClient.material.findUnique({
            where: {
                id,
            },
        });
        if (!material) {
            throw new NotFoundError_1.NotFoundError("Material tidak ditemukan");
        }
        return material;
    }),
    getMaterialByProperty: (_a) => __awaiter(void 0, [_a], void 0, function* ({ name, detail, color, user_id, }) {
        const material = yield prismaClient_1.prismaClient.material.findMany({
            where: {
                name,
                detail,
                color,
                user_id,
            },
        });
        if (!material) {
            throw new NotFoundError_1.NotFoundError(`Material with name ${name}, detail ${detail} and color ${color} not found`);
        }
        return material;
    }),
    getInventoryTransactions: (user_id, filter) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const inventoryTransactions = yield prismaClient_1.prismaClient.inventoryTransaction.findMany({
            where: {
                material: {
                    user_id,
                },
            },
        });
        const totalTransaction = yield prismaClient_1.prismaClient.inventoryTransaction.count({
            where: {
                material: {
                    user_id,
                },
            },
        });
        const total = +totalTransaction.toString();
        const take = (_a = filter === null || filter === void 0 ? void 0 : filter.take) !== null && _a !== void 0 ? _a : 10;
        const skip = (_b = filter === null || filter === void 0 ? void 0 : filter.skip) !== null && _b !== void 0 ? _b : 0;
        const currentPage = skip / take + 1;
        const sortedData = inventoryTransactions.sort((a, b) => {
            const aIsInWithStock = a.movement === "IN" && a.stock > 0;
            const bIsInWithStock = b.movement === "IN" && b.stock > 0;
            if (aIsInWithStock && !bIsInWithStock)
                return -1;
            if (!aIsInWithStock && bIsInWithStock)
                return 1;
            return 0;
        });
        return {
            take,
            skip,
            currentPage,
            total,
            data: sortedData,
        };
    }),
    releaseMaterial: (inventory_transaction_id, payload) => __awaiter(void 0, void 0, void 0, function* () {
        const inventoryTransaction = yield prismaClient_1.prismaClient.inventoryTransaction.findUnique({
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
            throw new NotFoundError_1.NotFoundError("Inventory transaction not found");
        }
        if (inventoryTransaction.material.stock.toNumber() < payload.stock) {
            throw new ClientError_1.ClientError("Stock is not sufficient", 400);
        }
        if (inventoryTransaction.stock.toNumber() < payload.stock) {
            throw new ClientError_1.ClientError("Stock from inventory transaction (shelf) is not sufficient");
        }
        return yield prismaClient_1.prismaClient.$transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const releasedStock = yield trx.inventoryTransaction.create({
                data: {
                    material_id: inventoryTransaction.material_id,
                    movement: payload.movement,
                    stock: (_a = payload.stock) !== null && _a !== void 0 ? _a : 0,
                    shelf_id: payload.shelf_id,
                },
            });
            const addedHistory = yield trx.history.create({
                data: {
                    material_id: inventoryTransaction.material_id,
                    movement: payload.movement,
                    stock: (_b = payload.stock) !== null && _b !== void 0 ? _b : 0,
                    shelf_id: payload.shelf_id,
                },
            });
            yield trx.material.update({
                where: {
                    id: releasedStock.material_id,
                },
                data: {
                    stock: {
                        decrement: payload.stock,
                    },
                },
            });
            yield prismaClient_1.prismaClient.inventoryTransaction.update({
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
        }));
    }),
    deleteManyTransactions: (ids, userId) => __awaiter(void 0, void 0, void 0, function* () {
        yield prismaClient_1.prismaClient.$transaction((trx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const transactions = yield trx.inventoryTransaction.findMany({
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
                mappedMaterialToReduceStock.set(transaction.material_id, ((_a = mappedMaterialToReduceStock.get(transaction.material_id)) !== null && _a !== void 0 ? _a : 0) +
                    transaction.stock);
            }
            yield Promise.all(Array.from(mappedMaterialToReduceStock.entries()).map((_a) => __awaiter(void 0, [_a], void 0, function* ([materialId, stockToReduce]) {
                yield trx.material.update({
                    where: {
                        id: materialId,
                    },
                    data: {
                        stock: {
                            decrement: stockToReduce,
                        },
                    },
                });
            })));
            const deletedTransactions = yield trx.inventoryTransaction.deleteMany({
                where: {
                    id: {
                        in: ids,
                    },
                    material: {
                        user_id: userId,
                    },
                },
            });
        }));
        return ids;
    }),
    getInventoryBelongsToMaterial: (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
        const materialWithInventoryTransactions = yield prismaClient_1.prismaClient.material.findFirst({
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
    }),
    searchInventory: (keyword, userId, filter) => __awaiter(void 0, void 0, void 0, function* () {
        const inventoryTransaction = yield prismaClient_1.prismaClient.inventoryTransaction.findMany(Object.assign({ where: {
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
            } }, filter));
        return inventoryTransaction;
    }),
    getShelfsBelongsToUser: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        const shelfs = yield prismaClient_1.prismaClient.shelf.findMany({
            where: {
                user_id: userId,
            },
        });
        return shelfs;
    }),
    calculateMaterialNeededInKg: (userId, payload, material) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const neededMaterial = payload.pcs * payload.requirementInPcs;
        const materialHolded = yield prismaClient_1.prismaClient.material.findFirst({
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
            throw new NotFoundError_1.NotFoundError("Material tidak ditemukan");
        }
        console.log({ materialHolded });
        const calculatedNeededMaterial = neededMaterial - +materialHolded.stock;
        return {
            totalNeededMaterialInKg: neededMaterial,
            neededMaterialInKg: calculatedNeededMaterial <= 0 ? 0 : calculatedNeededMaterial,
            stockInInventory: (_a = Number(materialHolded.stock)) !== null && _a !== void 0 ? _a : 0,
            filtered_inventory_transactions: materialHolded.inventory_transactions.length > 0
                ? materialHolded.inventory_transactions
                : [],
        };
    }),
    seedMaterialCalculator: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        const materialCalculators = yield prismaClient_1.prismaClient.materialCalculator.findMany({
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
        const materialSeededWithUser = materialSeeded.map((material) => (Object.assign(Object.assign({}, material), { user_id: userId })));
        console.log({ materialCalculators });
        if (!materialCalculators.length) {
            const materials = yield prismaClient_1.prismaClient.materialCalculator.createMany({
                data: materialSeededWithUser,
            });
            return materials;
        }
        return materialCalculators;
    }),
    addProduct: (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
        const productExists = yield prismaClient_1.prismaClient.materialCalculator.findFirst({
            where: {
                name: payload.name.toLowerCase(),
                weight_required: payload.weight_required,
            },
        });
        if (productExists) {
            throw new ClientError_1.ClientError("Produk sudah ada");
        }
        const productAdded = yield prismaClient_1.prismaClient.materialCalculator.create({
            data: {
                name: payload.name,
                weight_required: payload.weight_required,
                user_id: userId,
            },
        });
        return productAdded;
    }),
    deleteProduct: (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
        const productExists = yield prismaClient_1.prismaClient.materialCalculator.findUnique({
            where: {
                id,
                user_id: userId,
            },
        });
        if (!productExists) {
            throw new NotFoundError_1.NotFoundError("Produk tidak ditemukan");
        }
        const deletedProduct = yield prismaClient_1.prismaClient.materialCalculator.delete({
            where: {
                id,
            },
        });
        return deletedProduct;
    }),
    searchProduct: (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const take = (_a = payload.size) !== null && _a !== void 0 ? _a : 10;
        const skip = (((_b = payload.page) !== null && _b !== void 0 ? _b : 1) - 1) * take;
        const totalData = yield prismaClient_1.prismaClient.materialCalculator.count();
        if (payload.id) {
            console.log({ id: payload.id });
            return {
                totalData,
                products: [
                    yield prismaClient_1.prismaClient.materialCalculator.findUnique({
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
                products: prismaClient_1.prismaClient.materialCalculator.findMany({
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
            products: yield prismaClient_1.prismaClient.materialCalculator.findMany({
                where: {
                    user_id: userId,
                },
                take,
                skip,
            }),
        };
    }),
};
