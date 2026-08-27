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

async function getAlbums(user, filters = {}) {
  const schoolId = await resolveSchoolScope(user, filters);
  if (!schoolId) return { albums: [], total: 0 };

  const where = { schoolId };

  if (filters.visibility) {
    where.visibility = filters.visibility;
  }
  if (filters.search) {
    where.title = { contains: filters.search, mode: "insensitive" };
  }

  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const [albums, total] = await Promise.all([
    prisma.album.findMany({
      where,
      orderBy: { eventDate: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { photos: true } },
      },
    }),
    prisma.album.count({ where }),
  ]);

  return { albums, total, page, limit };
}

async function getAlbumById(id, user) {
  const album = await prisma.album.findUnique({
    where: { id },
    include: { photos: { orderBy: { createdAt: "asc" } } },
  });
  if (!album) throw new ApiError(404, "Album not found");
  if (user.schoolId && album.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return album;
}

async function createAlbum({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  return prisma.album.create({
    data: {
      schoolId,
      title: data.title,
      description: data.description || null,
      eventDate: data.eventDate ? new Date(data.eventDate) : null,
      visibility: data.visibility || "PUBLIC",
      createdById: user.id || null,
    },
  });
}

async function addPhoto({ albumId, data, user }) {
  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album) throw new ApiError(404, "Album not found");
  if (user.schoolId && album.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  return prisma.photo.create({
    data: {
      albumId,
      url: data.url,
      caption: data.caption || null,
      uploadedBy: user.id || null,
    },
  });
}

async function deleteAlbum({ id, user }) {
  const album = await prisma.album.findUnique({ where: { id } });
  if (!album) throw new ApiError(404, "Album not found");
  if (user.schoolId && album.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return prisma.album.delete({ where: { id } });
}

async function deletePhoto({ id, user }) {
  const photo = await prisma.photo.findUnique({
    where: { id },
    include: { album: true },
  });
  if (!photo) throw new ApiError(404, "Photo not found");
  if (user.schoolId && photo.album.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return prisma.photo.delete({ where: { id } });
}

module.exports = {
  resolveSchoolScope,
  getAlbums,
  getAlbumById,
  createAlbum,
  addPhoto,
  deleteAlbum,
  deletePhoto,
};
