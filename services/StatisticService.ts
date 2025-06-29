import { prismaClient } from "../prismaClient";

export const StatisticService = {
  getMaterialCategorySummary: async (userId: number) => {
    const data = await prismaClient.$queryRaw`
            SELECT  type, SUM(stock) AS total FROM materials WHERE user_id = ${userId} GROUP BY type
        `;

    return data;
  },

  getLastWeekMaterialSummary: async (userId: number) => {
    return await prismaClient.$queryRaw`
        SELECT type, SUM(stock) AS total FROM materials WHERE user_id = ${userId} AND DATEDIFF(updated_at, now()) <= 7 GROUP BY type
    `;
  },

  getUsageStatistic: async (userId: number) => {
    const summary = (await prismaClient.$queryRaw`
      SELECT ROUND( SUM(CASE WHEN movement="OUT" AND materials.type != "WASTE" THEN inventory_transactions.stock ELSE 0 END) / SUM(inventory_transactions.stock) * 100  , 2) AS used_percentage,
      ROUND( SUM( CASE WHEN movement != "OUT" THEN inventory_transactions.stock ELSE 0 END ) / SUM(inventory_transactions.stock) * 100, 2 ) as unused_percentage
      FROM inventory_transactions JOIN materials ON inventory_transactions.material_id = materials.id WHERE materials.user_id = ${userId}
    `) as any;

    return summary[0];
  },

  getWeekUsageStatistic: async (userId: number) => {
    const summary = (await prismaClient.$queryRaw`
      SELECT week, ROUND(SUM( CASE WHEN movement="OUT" AND materials.type != "WASTE" THEN tx.stock ELSE 0 END ) / SUM(CASE WHEN materials.type != "WASTE" THEN tx.stock ELSE 0 END) * 100, 2) AS used_percentage, ROUND( SUM(CASE WHEN movement != "OUT" AND materials.type != "WASTE" THEN tx.stock ELSE 0 END) / sum( CASE WHEN materials.type != "WASTE" THEN tx.stock ELSE 0 END) * 100, 2 ) AS unused_percentage  FROM (
      SELECT *, CASE WHEN DAY(created_at) BETWEEN 1 AND 7 THEN 1 WHEN DAY(created_at) BETWEEN 8 AND 15 THEN 2 WHEN DAY(created_at) BETWEEN 16 AND 21 THEN 3 ELSE 4 END AS week FROM histories) AS tx JOIN materials ON materials.id = tx.material_id WHERE materials.user_id = ${userId} AND MONTH(NOW()) = MONTH(tx.created_at) GROUP BY week ORDER BY week ASC
    `) as any;

    const mappedSummary: any[] = [];
    let index = 0;

    for (let x = 0; x < 4; x++) {
      if (
        index > summary.length - 1 ||
        +summary[index].week.toString() > x + 1
      ) {
        mappedSummary.push({
          week: x + 1,
          used_percentage: 0,
          unused_percentage: 0,
        });
        continue;
      }
      mappedSummary.push({
        ...summary[index],
        week: +summary[index].week.toString(),
      });
      index++;
    }

    return mappedSummary;
  },

  getPerformanceSummary: async (userId: number) => {
    const summary = (await prismaClient.$queryRaw`
        SELECT week, SUM( CASE WHEN tx.movement = "IN" THEN tx.stock ELSE 0 END) AS input, SUM(CASE WHEN movement = "OUT" THEN tx.stock ELSE 0 END) AS output FROM ( SELECT *, CASE WHEN DAY(created_at) BETWEEN 1 AND 7 THEN 1 WHEN DAY(created_at) BETWEEN 8 AND 14 THEN 2 WHEN DAY(created_at) BETWEEN 15 AND 21 THEN 3 ELSE 4 END AS week FROM histories )  AS tx JOIN materials ON materials.id = tx.material_id WHERE materials.user_id = ${userId} AND MONTH(NOW()) = MONTH(tx.created_at) GROUP BY week ORDER BY week ASC
    `) as any;

    const mappedSummary = [];
    let index = 0;

    for (let x = 0; x < 4; x++) {
      if (
        index > summary.length - 1 ||
        +summary[index].week.toString() > x + 1
      ) {
        mappedSummary.push({
          week: x + 1,
          output: 0,
          input: 0,
        });
        continue;
      }
      mappedSummary.push({
        ...summary[index],
        week: +summary[index].week.toString(),
      });
      index++;
    }

    return mappedSummary;
  },
};
