const { catchAsync } = require("../../lib/errors");
const libraryService = require("./library.service");

const getBooks = catchAsync(async (req, res) => {
  const data = await libraryService.getBooks(req.user, req.query);
  res.json({ success: true, books: data });
});

const getBookById = catchAsync(async (req, res) => {
  const data = await libraryService.getBookById(req.params.id, req.user);
  res.json({ success: true, book: data });
});

const createBook = catchAsync(async (req, res) => {
  const data = await libraryService.createBook({ user: req.user, data: req.body });
  res.status(201).json({ success: true, book: data });
});

const issueBook = catchAsync(async (req, res) => {
  const data = await libraryService.issueBook({ user: req.user, data: req.body });
  res.status(201).json({ success: true, issue: data });
});

const returnBook = catchAsync(async (req, res) => {
  const data = await libraryService.returnBook({
    id: req.params.id,
    user: req.user,
    fineAmount: req.body.fineAmount ?? 0,
  });
  res.json({ success: true, issue: data });
});

const getIssues = catchAsync(async (req, res) => {
  const data = await libraryService.getIssues(req.user, req.query);
  res.json({ success: true, issues: data });
});

const deleteBook = catchAsync(async (req, res) => {
  const data = await libraryService.deleteBook({ id: req.params.id, user: req.user });
  res.json({ success: true, deleted: data });
});

module.exports = {
  getBooks,
  getBookById,
  createBook,
  issueBook,
  returnBook,
  getIssues,
  deleteBook,
};
