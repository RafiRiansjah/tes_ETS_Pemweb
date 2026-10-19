const elSaldo = document.querySelector("#saldo");
const elTotalMasuk = document.querySelector("#total-masuk");
const elTotalKeluar = document.querySelector("#total-keluar");
const elForm = document.querySelector("#form-transaksi");
const elKategori = document.querySelector("#kategori");
const elTanggal = document.querySelector("#tanggal");
const elPesanError = document.querySelector("#pesan-error");
const elFilterGroup = document.querySelector("#filter-group");
const elDaftar = document.querySelector("#daftar-transaksi");

const KUNCI_STORAGE = "pmm-transaksi";

const KATEGORI = {
    pengeluaran: ["Makanan", "Transportasi", "Belanja", "Tagihan", "Hiburan", "Lainnya"],
    pemasukan: ["Gaji", "Uang saku", "Bonus", "Lainnya"]
};

function muatData() {
    try {
        const teks = localStorage.getItem(KUNCI_STORAGE);
        if (teks === null) {
            return [];
        }
        const hasil = JSON.parse(teks);
        if (!Array.isArray(hasil)) {
            return [];
        }
        return hasil.filter(function (t) {
            return t && typeof t.id === "number" && typeof t.nominal === "number";
        });
    } catch (error) {
        console.error("Gagal memuat data:", error);
        return [];
    }
}

function simpanData() {
    try {
        localStorage.setItem(KUNCI_STORAGE, JSON.stringify(transaksi));
    } catch (error) {
        console.error("Gagal menyimpan data:", error);
    }
}

let transaksi = muatData();
let filterAktif = "semua";
let idBerikutnya = transaksi.reduce(function (maks, t) {
    return Math.max(maks, t.id);
}, 0) + 1;

function formatRupiah(angka) {
    const tanda = angka < 0 ? "-" : "";
    return tanda + "Rp " + Math.abs(angka).toLocaleString("id-ID");
}

function formatTanggal(teksTanggal) {
    const tgl = new Date(teksTanggal + "T00:00:00");
    return tgl.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function isiTanggalHariIni() {
    const hariIni = new Date();
    const tahun = hariIni.getFullYear();
    const bulan = String(hariIni.getMonth() + 1).padStart(2, "0");
    const hari = String(hariIni.getDate()).padStart(2, "0");
    elTanggal.value = tahun + "-" + bulan + "-" + hari;
}

function ambilJenisTerpilih() {
    return document.querySelector('input[name="jenis"]:checked').value;
}

function isiKategori(jenis) {
    elKategori.innerHTML = "";

    for (const nama of KATEGORI[jenis]) {
        const opsi = document.createElement("option");
        opsi.value = nama;
        opsi.textContent = nama;
        elKategori.appendChild(opsi);
    }
}

function hitungRingkasan() {
    let totalMasuk = 0;
    let totalKeluar = 0;

    for (const t of transaksi) {
        if (t.jenis === "pemasukan") {
            totalMasuk += t.nominal;
        } else {
            totalKeluar += t.nominal;
        }
    }

    return {
        totalMasuk: totalMasuk,
        totalKeluar: totalKeluar,
        saldo: totalMasuk - totalKeluar
    };
}

function renderRingkasan() {
    const hasil = hitungRingkasan();
    elSaldo.textContent = formatRupiah(hasil.saldo);
    elSaldo.classList.toggle("minus", hasil.saldo < 0);
    elTotalMasuk.textContent = formatRupiah(hasil.totalMasuk);
    elTotalKeluar.textContent = formatRupiah(hasil.totalKeluar);
}

function ambilTransaksiTampil() {
    const urut = [...transaksi].sort(function (a, b) {
        if (a.tanggal !== b.tanggal) {
            return b.tanggal.localeCompare(a.tanggal);
        }
        return b.id - a.id;
    });

    if (filterAktif === "semua") {
        return urut;
    }
    return urut.filter(function (t) {
        return t.jenis === filterAktif;
    });
}

function buatItem(t) {
    const li = document.createElement("li");
    li.className = "transaksi " + t.jenis;
    li.dataset.id = t.id;

    const info = document.createElement("div");
    info.className = "info";

    const judul = document.createElement("strong");
    judul.textContent = t.catatan;

    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = t.kategori + ", " + formatTanggal(t.tanggal);

    info.append(judul, meta);

    const nominal = document.createElement("span");
    nominal.className = "nominal";
    const tanda = t.jenis === "pemasukan" ? "+ " : "- ";
    nominal.textContent = tanda + formatRupiah(t.nominal);

    const tombolHapus = document.createElement("button");
    tombolHapus.type = "button";
    tombolHapus.className = "hapus";
    tombolHapus.textContent = "Hapus";

    li.append(info, nominal, tombolHapus);
    return li;
}

function render() {
    const tampil = ambilTransaksiTampil();
    elDaftar.innerHTML = "";

    if (tampil.length === 0) {
        const kosong = document.createElement("li");
        kosong.className = "kosong";
        kosong.textContent = transaksi.length === 0
            ? "Belum ada riwayat transaksi, yuk catat!"
            : "Tidak ada transaksi pada filter ini.";
        elDaftar.appendChild(kosong);
    } else {
        for (const t of tampil) {
            elDaftar.appendChild(buatItem(t));
        }
    }

    renderRingkasan();
}

for (const radio of document.querySelectorAll('input[name="jenis"]')) {
    radio.addEventListener("change", function () {
        isiKategori(radio.value);
    });
}

elForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const data = new FormData(elForm);
    const nominal = Number(data.get("nominal"));
    const catatan = data.get("catatan").trim();
    const tanggal = data.get("tanggal");

    if (!Number.isFinite(nominal) || nominal <= 0) {
        elPesanError.textContent = "Nominal harus berupa angka lebih dari 0.";
        return;
    }
    if (catatan === "") {
        elPesanError.textContent = "Catatan tidak boleh kosong.";
        return;
    }
    if (tanggal === "") {
        elPesanError.textContent = "Tanggal harus diisi.";
        return;
    }

    elPesanError.textContent = "";

    transaksi.push({
        id: idBerikutnya,
        jenis: data.get("jenis"),
        nominal: nominal,
        kategori: data.get("kategori"),
        tanggal: tanggal,
        catatan: catatan
    });
    idBerikutnya++;

    simpanData();
    render();

    elForm.reset();
    isiKategori(ambilJenisTerpilih());
    isiTanggalHariIni();
});

elDaftar.addEventListener("click", function (event) {
    const tombol = event.target.closest(".hapus");
    if (!tombol) {
        return;
    }

    if (!confirm("Hapus transaksi ini?")) {
        return;
    }

    const id = Number(tombol.closest("li").dataset.id);
    transaksi = transaksi.filter(function (t) {
        return t.id !== id;
    });

    simpanData();
    render();
});

elFilterGroup.addEventListener("click", function (event) {
    const tombol = event.target.closest(".filter");
    if (!tombol) {
        return;
    }

    filterAktif = tombol.dataset.filter;

    for (const t of elFilterGroup.querySelectorAll(".filter")) {
        const aktif = t === tombol;
        t.classList.toggle("aktif", aktif);
        t.setAttribute("aria-pressed", aktif);
    }

    render();
});

isiKategori(ambilJenisTerpilih());
isiTanggalHariIni();
render();