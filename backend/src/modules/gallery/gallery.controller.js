const { catchAsync } = require("../../lib/errors");
const galleryService = require("./gallery.service");

const getAlbums = catchAsync(async (req, res) => {
  const data = await galleryService.getAlbums(req.user, req.query);
  res.json({ success: true, ...data });
});

const getAlbumById = catchAsync(async (req, res) => {
  const album = await galleryService.getAlbumById(req.params.id, req.user);
  res.json({ success: true, album });
});

const createAlbum = catchAsync(async (req, res) => {
  const album = await galleryService.createAlbum({ user: req.user, data: req.body });
  res.status(201).json({ success: true, album });
});

const addPhoto = catchAsync(async (req, res) => {
  const photo = await galleryService.addPhoto({
    albumId: req.params.id,
    data: req.body,
    user: req.user,
  });
  res.status(201).json({ success: true, photo });
});

const deleteAlbum = catchAsync(async (req, res) => {
  const album = await galleryService.deleteAlbum({ id: req.params.id, user: req.user });
  res.json({ success: true, deleted: album });
});

const deletePhoto = catchAsync(async (req, res) => {
  const photo = await galleryService.deletePhoto({ id: req.params.id, user: req.user });
  res.json({ success: true, deleted: photo });
});

module.exports = {
  getAlbums,
  getAlbumById,
  createAlbum,
  addPhoto,
  deleteAlbum,
  deletePhoto,
};
