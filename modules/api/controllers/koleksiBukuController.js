const moment = require('moment');
const { knex } = require('../../../config/db');
// const io = req.app.get('socketio');

exports.TransaksiPeminjaman = async (req, res) => {
    const { id_user, id_admin, inv_peminjaman_alokasi, inv_peminjaman_qty, durasi_peminjaman, inv_galery_ref } = req.body;

    if (!id_user || !id_admin) {
        return res.status(400).json({
            status: 'error',
            message: 'ID user dan ID admin harus dikirim dari frontend.'
        });
    }

    const tgl_pengajuan = moment().format('YYYY-MM-DD HH:mm:ss');
    const no_bukti = moment().format('YYYYMMDDHHmmss') + id_admin + id_user;
    const status_peminjaman = '1';

    const koneksi = await knex.transaction();
    try {
        for (let i = 0; i < inv_peminjaman_qty.length; i++) {
            const alokasiID = inv_peminjaman_alokasi[i];
            const qty = parseInt(inv_peminjaman_qty[i]);
            const durasi = parseInt(durasi_peminjaman[i]);
            const ref = inv_galery_ref[i];

            if (qty < 1 || durasi < 1) {
                await koneksi.rollback();
                return res.status(200).json({
                    status: 'error',
                    message: 'Jumlah buku atau durasi peminjaman tidak valid',
                });
            }

            const dataAlokasi = await koneksi('erl_inv_alokasi').select('inv_alokasi_tersisa', 'inv_alokasi_terpakai').where('inv_alokasi_idx', alokasiID).first();

            if (!dataAlokasi || dataAlokasi.inv_alokasi_tersisa < qty) {
                await koneksi.rollback();
                return res.status(200).json({
                    status: 'error',
                    message: 'Stok buku tidak mencukupi untuk peminjaman',
                });
            }

            const inv_alokasi_terpakai = dataAlokasi.inv_alokasi_terpakai + qty;
            const inv_alokasi_tersisa = dataAlokasi.inv_alokasi_tersisa - qty;

            await koneksi('erl_inv_peminjaman').insert({
                inv_peminjaman_user: id_user,
                inv_peminjaman_admin: id_admin,
                inv_peminjaman_alokasi: alokasiID,
                inv_peminjaman_qty: qty,
                durasi_peminjaman: durasi,
                tgl_pengajuan,
                no_bukti, 
                status_peminjaman,
                inv_galery_ref: ref
            })

            await koneksi('erl_inv_alokasi').where('inv_alokasi_idx', alokasiID).update({
                inv_alokasi_terpakai,
                inv_alokasi_tersisa
            })

            await koneksi('erl_inv_galery_ref').where('ref', ref).update({
                status: 1
            })

            await koneksi.commit();
            return res.status(200).json({
                status: 'success',
                message: 'Peminjaman buku berhasil dilakukan'
            });
        }
    } catch (err) {
        console.error(err);
        await koneksi.rollback();
        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server.'
        });
    }
}

exports.getDataBuku = async (req, res) => {
    const encodeID = req.query.id_user;
    const {search, tipe, favorit, halaman } = req.query;
    const id_user = Buffer.from(encodeID, 'base64').toString('utf-8');
    if (!id_user) {
        return res.status(400).json({
            status: 'error',
            message: 'ID user harus dikirim dari frontend.'
        });
    }
    try {
        const user = await knex('erl_user')
        .join('erl_member_perpus', 'erl_member_perpus.member_id_user', 'erl_user.idx')
        .join('erl_admin', 'erl_admin.idx', 'erl_member_perpus.member_id_perpus')
        .select('erl_admin.admin_email AS Email_Perpus')
        .where('erl_user.idx', id_user)
        .first();

        if (!user || !user.Email_Perpus) {
            return res.status(200).json({
                status: 'error',
                message: 'Email perpustakaan tidak ditemukan untuk pengguna ini ini.'
            })
        }

        const emailPerpus = user.Email_Perpus;
        const per_halaman = 8;
        const offset = (halaman - 1) * per_halaman;

        const dataBuku = knex('erl_inv_galery as a')
        .join('erl_admin as b', 'b.idx', 'a.inv_galery_admin')
        .join('erl_inv_kategori as c', 'c.inv_kategori_idx', 'a.inv_galery_kategori')
        .join('erl_inv_stok as d', 'd.inv_stok_galery', 'a.inv_galery_idx')
        .join('erl_inv_jenjang as e', 'e.inv_jenjang_idx', 'a.inv_galery_jenjang')
        .join('erl_inv_penerbit as f', 'f.inv_penerbit_idx', 'a.inv_galery_penerbit')
        .join('erl_inv_alokasi as g', 'g.inv_alokasi_stok', 'd.inv_stok_idx')
        .join('erl_inv_rak as h', 'h.inv_rak_idx', 'g.inv_alokasi_rak')
        .leftJoin('erl_inv_fav as i', function() {
            this.on('i.inv_fav_galery', '=', 'a.inv_galery_idx')
                .andOn('i.inv_fav_user', '=', knex.raw('?', [id_user]))
        })
        .where('b.admin_email', emailPerpus)
        .andWhere('a.inv_galery_tipebook', '0')
        .andWhere('a.inv_galery_status', '!=', 'R')
        .andWhere('d.inv_stok_sudah_alokasi', '>', 0)
        .andWhere('g.inv_alokasi_tersisa', '>', 0)
        .andWhere('g.status_alokasi', '!=', 3)
        .modify(function(queryBuilder) {
            if (favorit === 'true') {
                queryBuilder.andWhere('i.inv_fav_user', id_user);
            }
            if (search) {
                queryBuilder.andWhere(function() {
                    this.where('a.inv_galery_title', 'like', `%${search}%`)
                        .orWhere('a.inv_galery_penulis', 'like', `%${search}%`);
                });
            }
            if (tipe === 'baru') {
                const durasi = new Date();
                durasi.setFullYear(durasi.getFullYear() - 2);
                queryBuilder.andWhere('a.inv_galery_createdate', '>=', durasi);
                queryBuilder.orderBy('a.inv_galery_createdate', 'desc');
            } else if (tipe === 'rekomendasi') {
                queryBuilder.orderByRaw('RAND()');
            } else {
                queryBuilder.orderBy('g.inv_alokasi_idx', 'asc');
            }
        });

        const data = await dataBuku
        .clone()
        .select(
            'a.inv_galery_idx AS ID',
            'a.inv_galery_url_cover AS Cover',
            'a.inv_galery_title AS Judul_Buku',
            'a.inv_galery_penulis AS Penulis',
            'c.inv_kategori_nama AS Kategori',
            'd.inv_stok_idx AS Stok_ID',
            'd.inv_stok_qty AS Jumlah_Buku',
            'd.inv_stok_sudah_alokasi AS Sudah_Dialokasikan',
            'd.inv_stok_belum_alokasi AS Belum_Dialokasikan',
            'e.inv_jenjang_nama AS Jenjang',
            'f.inv_penerbit_nama AS Penerbit',
            'g.inv_alokasi_idx AS Alokasi_ID',
            'g.inv_alokasi_stok AS Alokasi_Stok',
            'g.inv_alokasi_tersisa AS Alokasi_Tersisa',
            'h.inv_rak_nama AS Rak',
            'b.admin_sekolah AS Nama_Perpustakaan',
            knex.raw('IF(i.inv_fav_galery IS NOT NULL, 1, 0) AS Is_Favorit')
        )
        .limit(per_halaman)
        .offset(offset);

        const total_data_result = await dataBuku.clone().count('* as total');
        const total_data = total_data_result[0]?.total || 0;

        if (!data.length) {
            return res.status(200).json({
                status: 'error',
                messages: { error: 'Data tidak ditemukan' }
            });
        }
        return res.status(200).json({
            status: 'success',
            error: null,
            messages: { success: 'Data berhasil diambil' },
            data,
            pagination: {
                halaman: Number(halaman),
                per_halaman,
                total_data,
                total_halaman: Math.ceil(total_data / per_halaman)
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server.'
        });
    }
}