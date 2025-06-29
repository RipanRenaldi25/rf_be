"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
exports.typeDefs = `#graphql
    scalar DateTime
    type User {
        id: ID!
        name: String!
        phone_number: String!
        email: String!
        password: String!
        company_name: String!
        created_at: DateTime
        updated_at: DateTime
    }


    input RegisterPayload {
        name: String!
        phone_number: String!
        email: String!
        password: String!
        company_name: String!
    }

    input LoginPayload {
        email: String!
        password: String!
    }

    type LoginResponse {
        accessToken: String!
        refreshToken: String
    }

    enum MATERIAL_TYPE {
        WASTE
        REUSE
        REUTILIZATION
    }

    enum MOVEMENT_TYPE {
        IN
        OUT
    }

    type Shelf {
        id: ID!
        rack: String!
        number: Int!
        user: User
    }

    type Material {
        id: ID!
        name: String!
        detail: String!
        color: String
        stock: Float
        type: MATERIAL_TYPE!
        created_at: DateTime
        updated_at: DateTime
        user_id: Int

        user: User
        inventory_transactions: [InventoryTransaction!]!
        filtered_inventory_transactions: [InventoryTransaction!]!
        shelf: Shelf
    }

    type InventoryTransaction {
        id: ID!
        material_id: Int
        movement: MOVEMENT_TYPE
        stock: Float
        shelf_id: Int!
        created_at: DateTime
        updated_at: DateTime

        material: Material
        shelf: Shelf
    }

    input AddMaterialPayload {
        name: String!
        detail: String!
        color: String
        stock: Float
        type: MATERIAL_TYPE!
        shelf_id: Int!
    }

    input AddShelfPayload {
        rack: String!
        number: Int!
    }

    type MaterialCategorySummary {
        type: String!
        total: Float!
    }

    type RemnantSummary {
        used: Float!
        not_used: Float!
    }

    input UpdateInventoryPayload {
        movement: MOVEMENT_TYPE!
        stock: Float!
        shelf_id: Int!
    }

    type UsageStatisticResponse {
        used_percentage: Float!
        unused_percentage: Float!
    }

    type WeekUsageStatisticResponse {
        week: Int!
        used_percentage: Float!
        unused_percentage: Float!
    }
    type PerformanceSummary {
        week: Int!
        input: Float!
        output: Float!
    }

    input SearchMaterialPayload {
        name: String!
        detail: String
        color: String
        type: String!
    }

    enum InventoryOrderField {
        created_at
        stock
        movement
    }

    input SearchFilter {
        skip: Int
        take: Int
        orderBy: InventoryOrderField
    }

    type InventoryTransactionsResponse {
        take: Int
        skip: Int
        currentPage: Int
        total: Int
        data: [InventoryTransaction!]
    }


    input calculatePCSInKg {
        pcs: Int!
        requirementInPcs: Float
    }

    type CalculatedMaterialResponse {
        totalNeededMaterialInKg: Float!
        neededMaterialInKg: Float!
        filtered_inventory_transactions: [InventoryTransaction!]
        stockInInventory: Float!
    }

    type Product {
        id: ID!
        name: String!
        weight_required: Float!
        user_id: Int!

        user: User
    }

    input AddProduct {
        name: String!
        weight_required: Float!
    }

    input SearchProduct {
        id: Int
        name: String
        page: Int
        size: Int
    }

    type SearchProductPayload {
        products: [Product]
        totalData: Int!
    }

    type Query {
        hello: String!
        getUserById(id: Int!): User
        getUserLogin: User
        getMaterialById(id: Int!): Material
        getMaterialByProperty(name: String!, detail: String!, color: String): Material
        getInventoryTransactions(filter: SearchFilter): InventoryTransactionsResponse!
        getMaterialCategorySummary: [MaterialCategorySummary!]
        getLastWeekMaterialSummary: [MaterialCategorySummary!]
        getUsageStatistic: UsageStatisticResponse
        getWeekUsageStatistic: [WeekUsageStatisticResponse!]
        getPerformanceSummary: [PerformanceSummary!]
        getInventoryBelongToMaterial(payload: SearchMaterialPayload): Material
        searchInventory(keyword: String!, filter: SearchFilter): [InventoryTransaction!]
        getShelfsBelongsToUser: [Shelf!]!
        calculateMaterialNeededInKg(payload: calculatePCSInKg, material: SearchMaterialPayload): CalculatedMaterialResponse
        searchProduct(payload: SearchProduct): SearchProductPayload

    }

    type Mutation {
        register(payload: RegisterPayload): User
        login(payload: LoginPayload): LoginResponse
        addMaterial(payload: AddMaterialPayload): Material
        addShelf(payload: AddShelfPayload): Shelf
        releaseMaterial(inventory_transaction_id: Int!, payload: UpdateInventoryPayload): InventoryTransaction!
        deleteManyTransactions(ids: [Int!]!): [Int!]
        seedMaterialCalculator: [Product!]
        addProduct(payload: AddProduct): Product
        deleteProduct(id: Int!): Product
    }
`;
