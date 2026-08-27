const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

async function resolveSchoolScope(user, query = {}) {
  if (user.role === "superAdmin") {
    if (!query.schoolId || query.schoolId === "all") {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      return firstSchool ? firstSchool.id : null;
    }
    const cleanId = String(query.schoolId).replace(/^"|"$/g, "").trim();
    const school = await prisma.school.findFirst({
      where: { OR: [{ id: cleanId }, { code: cleanId }] },
      select: { id: true },
    });
    return school ? school.id : cleanId;
  }
  return user.schoolId;
}

async function getItems(user, filters = {}) {
  const schoolId = await resolveSchoolScope(user, filters);
  if (!schoolId) return [];

  const where = { schoolId };

  if (filters.category) where.category = filters.category;
  if (filters.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }
  let items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { name: "asc" },
  });

  if (filters.lowStock) {
    items = items.filter((item) => item.currentStock <= item.reorderLevel);
  }

  return items;
}

async function getItemById(id, user) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      purchases: { orderBy: { createdAt: "desc" }, take: 50 },
      issues: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!item) throw new ApiError(404, "Inventory item not found");
  if (user.schoolId && item.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return item;
}

async function createItem({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  return prisma.inventoryItem.create({
    data: {
      schoolId,
      name: data.name,
      category: data.category || null,
      currentStock: data.currentStock,
      reorderLevel: data.reorderLevel,
      unitPrice: data.unitPrice,
      unit: data.unit,
      location: data.location || null,
    },
  });
}

async function updateItem({ id, data, user }) {
  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Inventory item not found");
  if (user.schoolId && existing.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  return prisma.inventoryItem.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.reorderLevel !== undefined && { reorderLevel: data.reorderLevel }),
      ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.location !== undefined && { location: data.location }),
    },
  });
}

async function deleteItem({ id, user }) {
  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Inventory item not found");
  if (user.schoolId && existing.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  if (existing.currentStock !== 0) {
    throw new ApiError(400, "Cannot delete item with non-zero stock");
  }

  return prisma.inventoryItem.delete({ where: { id } });
}

async function recordPurchase({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const item = await prisma.inventoryItem.findUnique({ where: { id: data.itemId } });
  if (!item) throw new ApiError(404, "Inventory item not found");
  if (schoolId !== item.schoolId) {
    throw new ApiError(403, "Item belongs to a different school");
  }

  const [purchase] = await prisma.$transaction([
    prisma.purchaseRecord.create({
      data: {
        schoolId,
        itemId: data.itemId,
        quantity: data.quantity,
        vendorName: data.vendorName || null,
        invoiceNo: data.invoiceNo || null,
        totalCost: data.totalCost || null,
        recordedBy: user.id || user.name || null,
      },
    }),
    prisma.inventoryItem.update({
      where: { id: data.itemId },
      data: { currentStock: { increment: data.quantity } },
    }),
  ]);

  return purchase;
}

async function recordIssue({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const item = await prisma.inventoryItem.findUnique({ where: { id: data.itemId } });
  if (!item) throw new ApiError(404, "Inventory item not found");
  if (schoolId !== item.schoolId) {
    throw new ApiError(403, "Item belongs to a different school");
  }
  if (item.currentStock < data.quantity) {
    throw new ApiError(400, `Insufficient stock. Available: ${item.currentStock}`);
  }

  const [issue] = await prisma.$transaction([
    prisma.issueLog.create({
      data: {
        schoolId,
        itemId: data.itemId,
        quantity: data.quantity,
        department: data.department || null,
        issuedTo: data.issuedTo || null,
        recordedBy: user.id || user.name || null,
      },
    }),
    prisma.inventoryItem.update({
      where: { id: data.itemId },
      data: { currentStock: { decrement: data.quantity } },
    }),
  ]);

  return issue;
}

async function getLowStockItems(user) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) return [];

  const allItems = await prisma.inventoryItem.findMany({
    where: { schoolId },
    orderBy: { name: "asc" },
  });

  return allItems.filter((item) => item.currentStock <= item.reorderLevel);
}

module.exports = {
  resolveSchoolScope,
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  recordPurchase,
  recordIssue,
  getLowStockItems,
};
