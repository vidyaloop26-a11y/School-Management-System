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

async function getBooks(user, filters = {}) {
  const schoolId = await resolveSchoolScope(user, filters);
  if (!schoolId) return [];

  const where = { schoolId };
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { author: { contains: filters.search, mode: "insensitive" } },
      { isbn: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.status === "available") {
    where.availableCopies = { gt: 0 };
  } else if (filters.status === "issued") {
    where.availableCopies = 0;
  }

  return prisma.book.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

async function getBookById(id, user) {
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      issues: {
        orderBy: { createdAt: "desc" },
        include: {
          student: { select: { id: true, name: true, admNo: true } },
        },
      },
    },
  });
  if (!book) throw new ApiError(404, "Book not found");

  if (user.schoolId && book.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  return book;
}

async function createBook({ user, data }) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) throw new ApiError(400, "School ID required");

  return prisma.book.create({
    data: {
      schoolId,
      title: data.title,
      isbn: data.isbn || null,
      author: data.author || null,
      category: data.category || null,
      totalCopies: data.totalCopies ?? 1,
      availableCopies: data.totalCopies ?? 1,
      location: data.location || null,
    },
  });
}

async function issueBook({ user, data }) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) throw new ApiError(400, "School ID required");

  const book = await prisma.book.findUnique({ where: { id: data.bookId } });
  if (!book) throw new ApiError(404, "Book not found");
  if (book.schoolId !== schoolId) throw new ApiError(403, "Access denied");
  if (book.availableCopies < 1) throw new ApiError(400, "No copies available");

  if (!data.studentId && !data.staffId) {
    throw new ApiError(400, "Either studentId or staffId is required");
  }

  const issue = await prisma.$transaction(async (tx) => {
    const bookIssue = await tx.bookIssue.create({
      data: {
        schoolId,
        bookId: data.bookId,
        studentId: data.studentId || null,
        staffId: data.staffId || null,
        dueDate: new Date(data.dueDate),
        status: "ISSUED",
      },
    });

    await tx.book.update({
      where: { id: data.bookId },
      data: { availableCopies: { decrement: 1 } },
    });

    return bookIssue;
  });

  return issue;
}

async function returnBook({ id, user, fineAmount = 0 }) {
  const issue = await prisma.bookIssue.findUnique({ where: { id } });
  if (!issue) throw new ApiError(404, "Book issue not found");
  if (user.schoolId && issue.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  if (issue.status === "RETURNED") {
    throw new ApiError(400, "Book already returned");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const returned = await tx.bookIssue.update({
      where: { id },
      data: {
        returnDate: new Date(),
        fineAmount,
        finePaid: fineAmount > 0 ? false : true,
        status: "RETURNED",
      },
    });

    await tx.book.update({
      where: { id: issue.bookId },
      data: { availableCopies: { increment: 1 } },
    });

    return returned;
  });

  return updated;
}

async function getIssues(user, filters = {}) {
  const schoolId = await resolveSchoolScope(user, filters);
  if (!schoolId) return [];

  const where = { schoolId };
  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = { in: ["ISSUED", "OVERDUE"] };
  }

  return prisma.bookIssue.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      book: { select: { id: true, title: true, author: true } },
      student: { select: { id: true, name: true, admNo: true } },
    },
  });
}

async function deleteBook({ id, user }) {
  const book = await prisma.book.findUnique({
    where: { id },
    include: { issues: { where: { status: { in: ["ISSUED", "OVERDUE"] } } } },
  });
  if (!book) throw new ApiError(404, "Book not found");
  if (user.schoolId && book.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  if (book.issues.length > 0) {
    throw new ApiError(400, "Cannot delete book with active issues");
  }

  return prisma.book.delete({ where: { id } });
}

module.exports = {
  resolveSchoolScope,
  getBooks,
  getBookById,
  createBook,
  issueBook,
  returnBook,
  getIssues,
  deleteBook,
};
