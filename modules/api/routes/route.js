const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const koleksiBukuController = require('../controllers/koleksiBukuController');
const kategoriController = require('../controllers/kategori');

router.post('/login', authController.login);
router.post('/Pulihkan-Akun', authController.PulihkanAkun);
router.post('/Hapus-Akun', authController.HapusAkun);
router.post('/regis', authController.register);

router.get('/buku', koleksiBukuController.getDataBuku);
router.post('/peminjaman', koleksiBukuController.TransaksiPeminjaman);

router.get('/kategori', kategoriController.getDataKategori);
router.post('/kategori/tambah', kategoriController.tambahKategori);

module.exports = router;