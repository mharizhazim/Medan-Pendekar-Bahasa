import {
  EquipmentItem,
  LocationId,
  MonsterSpec,
  NpcSpec,
  RankInfo,
  TabungQuestion,
} from '../types/game';

export const RANKS: RankInfo[] = [
  { level: 1, title: 'TAHAP 1: PENDEKAR MUDA', minXp: 0, attackBonus: 0 },
  { level: 2, title: 'TAHAP 2: PENDEKAR PERKASA', minXp: 60, attackBonus: 5 },
  { level: 3, title: 'TAHAP 3: PENDEKAR HEBAT', minXp: 140, attackBonus: 10 },
  { level: 4, title: 'TAHAP 4: PENDEKAR AGUNG', minXp: 240, attackBonus: 15 },
  { level: 5, title: 'TAHAP 5: PENDEKAR DIRAJA', minXp: 360, attackBonus: 22 },
];

export function getRankForXp(xp: number): RankInfo {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXp) current = r;
  }
  return current;
}

export const EQUIPMENT_CATALOG: EquipmentItem[] = [
  {
    id: 'keris_diraja',
    name: 'KERIS DIRAJA',
    powerBonus: 18,
    defenseBonus: 0,
    description:
      'Keris Melayu tradisional bersarung emas warisan Raja Mustafar sebagai artifak fantasi.',
    effectText: 'Meningkatkan kekuatan serangan Tenaga Pendekar sebanyak +18.',
    consumable: false,
  },
  {
    id: 'perisai_warisan',
    name: 'PERISAI WARISAN',
    powerBonus: 0,
    defenseBonus: 15,
    description:
      'Perisai kayu berkualiti tinggi yang dihiasi corak ukiran awan larat Melayu.',
    effectText: 'Mengurangkan kesan serangan fantasi raksasa sebanyak 55%.',
    consumable: false,
  },
  {
    id: 'ramuan_pemulih',
    name: 'RAMUAN PEMULIH TENAGA',
    powerBonus: 0,
    defenseBonus: 0,
    description:
      'Botol kaca kecil berisi ekstrak herba hutan tropika berwarna hijau bercahaya.',
    effectText: 'Memulihkan +45 mata tenaga Raja Mustafar serta-merta.',
    consumable: true,
  },
  {
    id: 'pelindung_ajaib',
    name: 'PELINDUNG AJAIB',
    powerBonus: 5,
    defenseBonus: 25,
    description:
      'Azimat kesatria Nusantara yang memancarkan cahaya keemasan pelindung.',
    effectText:
      'Memberikan perlindungan sementara yang menangkis serangan raksasa selama 2 pusingan.',
    consumable: true,
  },
];

export const LOCATION_METADATA: Record<
  LocationId,
  { name: string; difficulty: string; color: string; center: [number, number] }
> = {
  rimba_warisan: {
    name: 'RIMBA WARISAN',
    difficulty: 'MUDAH',
    color: '#16a34a',
    center: [-44, -28],
  },
  gua_seribu_misteri: {
    name: 'GUA SERIBU MISTERI',
    difficulty: 'RENDAH KE SEDERHANA',
    color: '#7c3aed',
    center: [46, -34],
  },
  perkampungan_nusantara: {
    name: 'PERKAMPUNGAN NUSANTARA',
    difficulty: 'SEDERHANA',
    color: '#d97706',
    center: [-46, 42],
  },
  lembah_pendekar: {
    name: 'LEMBAH PENDEKAR',
    difficulty: 'SEDERHANA KE TINGGI',
    color: '#0284c7',
    center: [46, 38],
  },
  istana_puncak_mustafar: {
    name: 'ISTANA PUNCAK MUSTAFAR',
    difficulty: 'PALING TINGGI',
    color: '#dc2626',
    center: [0, -78],
  },
};

export const TABUNG_QUESTIONS: TabungQuestion[] = [
  {
    id: 1,
    locationId: 'rimba_warisan',
    locationName: 'RIMBA WARISAN',
    difficulty: 'MUDAH',
    storyTitle: 'PENGEMBARAAN AWANG KENIT',
    passageBefore:
      'Pada suatu pagi, Awang Kenit memulakan pengembaraannya ke dalam sebuah hutan. Dia berjalan dengan berhati-hati sebelum memasuki sebuah gua yang sangat ',
    passageAfter:
      '. Walaupun keadaan di dalam gua itu kurang bercahaya, Awang Kenit tetap meneruskan langkahnya.',
    choices: ['TERANG', 'GELAP', 'SEMPIT'],
    answer: 'GELAP',
    adjectiveType: 'Kata Adjektif Pancaindera',
    explanation:
      'Jawapan GELAP adalah betul kerana perkataan ini menerangkan keadaan gua yang kurang mendapat cahaya. Kata adjektif ini tergolong dalam kata adjektif pancaindera, iaitu berkaitan dengan deria penglihatan.',
    wrongHint:
      'Belum tepat! Cuba fikirkan perkataan yang menerangkan keadaan sebuah gua yang kurang mendapat cahaya.',
    nearMissHints: {
      KELAM:
        'Hampir! Perkataan itu hampir sama makna, tetapi pilih kata adjektif paling tepat dan lazim untuk keadaan tiada cahaya (5 huruf, bermula huruf G).',
      MALAP:
        'Kurang tepat untuk keseluruhan ruang gua yang tiada cahaya. Cuba perkataan yang bermula dengan huruf G.',
      SURAM:
        'Suram menggambarkan cahaya pudar atau wajah murung. Ayat ini menerangkan gua yang hampir tiada cahaya.',
    },
    progressiveHints: [
      'Petunjuk 1: Kata adjektif ini berkaitan dengan deria penglihatan (lawan kepada terang).',
      'Petunjuk 2: Perkataan ini mempunyai 5 huruf dan bermula dengan huruf G _ _ _ P.',
    ],
    rewardKupang: 10,
    position: [-54, -38],
  },
  {
    id: 2,
    locationId: 'gua_seribu_misteri',
    locationName: 'GUA SERIBU MISTERI',
    difficulty: 'RENDAH KE SEDERHANA',
    storyTitle: 'BUNGA MISTERI DI DALAM GUA',
    passageBefore:
      'Ketika meneruskan perjalanan, Awang Kenit menemui sekuntum bunga berwarna putih di celah batu. Bunga itu mengeluarkan bau yang sangat ',
    passageAfter:
      '. Awang Kenit berasa kagum lalu mengambil masa untuk memerhatikan keindahan bunga tersebut.',
    choices: ['BUSUK', 'HARUM', 'MASIN'],
    answer: 'HARUM',
    adjectiveType: 'Kata Adjektif Pancaindera',
    explanation:
      'Jawapan HARUM adalah betul kerana perkataan ini menerangkan bau bunga yang menyenangkan. Kata adjektif ini berkaitan dengan deria bau.',
    wrongHint:
      'Belum tepat! Fikirkan perkataan yang sesuai untuk menerangkan bau bunga yang menyenangkan.',
    nearMissHints: {
      WANGI:
        'Maknanya hampir sama, tetapi untuk keindahan bunga dalam cerita klasik ini, pilih kata adjektif 5 huruf yang bermula dengan huruf H.',
      SEMERBAK:
        'Hampir tepat, namun perkataan yang dikehendaki terdiri daripada 5 huruf dan bermula dengan huruf H.',
    },
    progressiveHints: [
      'Petunjuk 1: Kata adjektif pancaindera ini berkaitan dengan deria bau bunga yang menyenangkan.',
      'Petunjuk 2: Perkataan ini mempunyai 5 huruf dan bermula dengan huruf H _ _ _ M.',
    ],
    rewardKupang: 15,
    position: [56, -44],
  },
  {
    id: 3,
    locationId: 'perkampungan_nusantara',
    locationName: 'PERKAMPUNGAN NUSANTARA',
    difficulty: 'SEDERHANA',
    storyTitle: 'MENYUSURI SUNGAI KAMPUNG',
    passageBefore:
      'Selepas keluar dari gua, Awang Kenit tiba di sebuah perkampungan tradisional. Dia melihat penduduk kampung sedang menyeberangi sungai menggunakan perahu. Air sungai itu mengalir dengan sangat ',
    passageAfter: ' selepas hujan lebat turun pada malam sebelumnya.',
    choices: ['PERLAHAN', 'DERAS', 'TENANG'],
    answer: 'DERAS',
    adjectiveType: 'Kata Adjektif Cara',
    explanation:
      'Jawapan DERAS adalah betul kerana perkataan ini menerangkan keadaan aliran air sungai yang bergerak dengan cepat dan kuat. Kata adjektif ini menerangkan cara atau keadaan sesuatu pergerakan.',
    wrongHint:
      'Belum tepat! Cuba fikirkan perkataan yang menerangkan aliran air sungai yang bergerak dengan kuat dan cepat.',
    nearMissHints: {
      LAJU:
        'Laju lazim digunakan untuk kenderaan atau larian. Untuk aliran air sungai atau hujan, terdapat kata adjektif cara yang lebih tepat bermula huruf D.',
      PANTAS:
        'Pantas sesuai untuk pergerakan orang atau haiwan. Untuk aliran air sungai, gunakan perkataan 5 huruf bermula huruf D.',
      CEPAT:
        'Kurang tepat dari segi kolokasi bahasa. Aliran air sungai yang kuat dan laju digelar mengalir dengan...',
    },
    progressiveHints: [
      'Petunjuk 1: Kata adjektif cara ini khusus menerangkan kelajuan aliran air sungai.',
      'Petunjuk 2: Perkataan ini mempunyai 5 huruf dan bermula dengan huruf D _ _ _ S.',
    ],
    rewardKupang: 20,
    position: [-56, 50],
  },
  {
    id: 4,
    locationId: 'lembah_pendekar',
    locationName: 'LEMBAH PENDEKAR',
    difficulty: 'SEDERHANA KE TINGGI',
    storyTitle: 'CABARAN DI LEMBAH PENDEKAR',
    passageBefore:
      'Awang Kenit tiba di sebuah gelanggang seni silat yang terletak di kaki gunung. Tiba-tiba, bunyi guruh kedengaran dari arah hutan. Awang Kenit berasa ',
    passageAfter:
      ' apabila melihat awan hitam mula menyelubungi kawasan tersebut. Namun begitu, dia tetap menguatkan semangat untuk meneruskan perjalanan.',
    choices: ['GEMBIRA', 'CEMAS', 'BANGGA'],
    answer: 'CEMAS',
    adjectiveType: 'Kata Adjektif Perasaan',
    explanation:
      'Jawapan CEMAS adalah betul kerana perkataan ini menggambarkan perasaan bimbang atau gelisah yang dialami oleh Awang Kenit apabila keadaan cuaca berubah secara tiba-tiba.',
    wrongHint:
      'Belum tepat! Fikirkan perkataan yang menggambarkan perasaan seseorang apabila menghadapi keadaan yang membimbangkan.',
    nearMissHints: {
      BIMBANG:
        'Maknanya dekat, namun pilih kata adjektif perasaan 5 huruf yang menggambarkan rasa gelisah secara tiba-tiba (bermula huruf C).',
      TAKUT:
        'Takut terlalu umum. Cuba fikirkan perkataan yang bermaksud gelisah dan bimbang yang bermula dengan huruf C.',
      GELISAH:
        'Hampir tepat, namun perkataan yang dicari mempunyai 5 huruf dan bermula dengan huruf C.',
    },
    progressiveHints: [
      'Petunjuk 1: Kata adjektif perasaan ini menggambarkan rasa bimbang atau terkejut menghadapi bahaya.',
      'Petunjuk 2: Perkataan ini mempunyai 5 huruf dan bermula dengan huruf C _ _ _ S.',
    ],
    rewardKupang: 25,
    position: [56, 48],
  },
  {
    id: 5,
    locationId: 'istana_puncak_mustafar',
    locationName: 'ISTANA PUNCAK MUSTAFAR',
    difficulty: 'PALING TINGGI',
    storyTitle: 'KEMBALI KE ISTANA WARISAN',
    passageBefore:
      'Akhirnya, Raja Mustafar berjaya tiba di istana yang terletak di puncak gunung. Di dalam balai istana, sekumpulan pemuzik sedang memainkan alat muzik tradisional. Alunan serunai yang dimainkan kedengaran sangat ',
    passageAfter:
      ' sehingga para tetamu terpegun menikmati persembahan tersebut.',
    choices: ['BISING', 'MERDU', 'GARAU'],
    answer: 'MERDU',
    adjectiveType: 'Kata Adjektif Pancaindera',
    explanation:
      'Jawapan MERDU adalah betul kerana perkataan ini menerangkan bunyi muzik yang enak didengar dan menyenangkan telinga. Kata adjektif ini berkaitan dengan deria pendengaran.',
    wrongHint:
      'Belum tepat! Cuba fikirkan perkataan yang menerangkan bunyi muzik yang enak dan menyenangkan apabila didengar.',
    nearMissHints: {
      SEDAP:
        'Sedap lebih tepat untuk deria rasa (makanan). Untuk bunyi muzik atau suara yang enak didengar, gunakan kata adjektif bermula huruf M.',
      ENAK:
        'Enak biasanya merujuk rasa makanan. Pilih kata adjektif pendengaran 5 huruf bermula huruf M.',
      LUNAK:
        'Lunak sering digunakan untuk suara nyanyian yang lembut. Untuk alunan serunai, pilih perkataan bermula huruf M _ _ _ U.',
    },
    progressiveHints: [
      'Petunjuk 1: Kata adjektif pancaindera ini khusus untuk deria pendengaran bagi muzik atau suara.',
      'Petunjuk 2: Perkataan ini mempunyai 5 huruf dan bermula dengan huruf M _ _ _ U.',
    ],
    rewardKupang: 30,
    position: [0, -90],
  },
];

export const MONSTERS: MonsterSpec[] = [
  {
    id: 'raksasa_hutan',
    locationId: 'rimba_warisan',
    name: 'RAKSASA HUTAN',
    title: 'Penjaga Rimba Warisan',
    maxHp: 60,
    attackPower: 14,
    rewardKupang: 30,
    rewardXp: 40,
    rewardItem: 'ramuan_pemulih',
    position: [-34, -18],
    variant: 'hutan',
  },
  {
    id: 'raksasa_gua',
    locationId: 'gua_seribu_misteri',
    name: 'RAKSASA GUA',
    title: 'Penunggu Kristal Gua',
    maxHp: 75,
    attackPower: 17,
    rewardKupang: 30,
    rewardXp: 50,
    rewardItem: 'perisai_warisan',
    position: [36, -24],
    variant: 'gua',
  },
  {
    id: 'raksasa_batu',
    locationId: 'perkampungan_nusantara',
    name: 'RAKSASA BATU',
    title: 'Penjaga Jambatan Batu',
    maxHp: 85,
    attackPower: 19,
    rewardKupang: 30,
    rewardXp: 60,
    rewardItem: 'ramuan_pemulih',
    position: [-30, 30],
    variant: 'batu',
  },
  {
    id: 'raksasa_lembah',
    locationId: 'lembah_pendekar',
    name: 'RAKSASA LEMBAH',
    title: 'Pahlawan Buluh Lembah',
    maxHp: 95,
    attackPower: 22,
    rewardKupang: 30,
    rewardXp: 70,
    rewardItem: 'pelindung_ajaib',
    position: [34, 28],
    variant: 'lembah',
  },
  {
    id: 'raksasa_istana',
    locationId: 'istana_puncak_mustafar',
    name: 'RAKSASA PENJAGA ISTANA',
    title: 'Panglima Besi Puncak Mustafar',
    maxHp: 110,
    attackPower: 25,
    rewardKupang: 30,
    rewardXp: 90,
    rewardItem: 'pelindung_ajaib',
    position: [0, -68],
    variant: 'istana',
  },
];

export const NPCS: NpcSpec[] = [
  {
    id: 'awang_hub',
    name: 'Awang Kenit',
    role: 'Pemandu Pengembaraan',
    locationLabel: 'Dataran Permulaan',
    position: [-4, -4],
    variant: 'awang',
    dialogues: [
      'Salam, Raja Mustafar! Lima Tabung Pitis telah disembunyikan di sekitar medan ini. Setiap tabung mengandungi cabaran bahasa yang perlu diselesaikan. Gunakan kebijaksanaan anda untuk melengkapkan cerita dengan kata adjektif yang tepat!',
      'Ikut laluan batu ke barat laut untuk ke Rimba Warisan, timur laut ke Gua Seribu Misteri, barat daya ke Perkampungan Nusantara, tenggara ke Lembah Pendekar, dan tangga utara ke Istana Puncak Mustafar!',
    ],
  },
  {
    id: 'awang_rimba',
    name: 'Awang Kenit',
    role: 'Pemandu Rimba',
    locationLabel: 'Rimba Warisan',
    position: [-44, -22],
    variant: 'awang',
    dialogues: [
      'Tahniah kerana tiba di Rimba Warisan! Cuba perhatikan berhampiran pokok besar di hujung rimba untuk mencari Tabung Pitis pertama.',
      'Ingat ya, kata adjektif menerangkan sifat atau keadaan sesuatu kata nama. Baca seluruh petikan sebelum menaip jawapan!',
    ],
  },
  {
    id: 'penduduk_kampung',
    name: 'Mak Cik Melur',
    role: 'Penduduk Kampung',
    locationLabel: 'Perkampungan Nusantara',
    position: [-42, 40],
    variant: 'penduduk',
    dialogues: [
      'Selamat datang ke Perkampungan Nusantara, Tuanku Raja Mustafar! Malam tadi hujan turun dengan lebat sehingga air sungai mengalir sangat laju dan kuat.',
      'Tabung Pitis kampung kami tersimpan elok berhampiran pasar tradisional dan rumah panggung di sebelah sana.',
    ],
  },
  {
    id: 'badang_lembah',
    name: 'Pendekar Badang',
    role: 'Guru Silat Lembah',
    locationLabel: 'Lembah Pendekar',
    position: [44, 34],
    variant: 'badang',
    dialogues: [
      'Salam Pendekar, Raja Mustafar! Seorang pendekar sejati bukan sahaja kuat tubuhnya, malah tajam akal dan indah bahasanya!',
      'Jika tenaga anda berkurangan selepas menentang raksasa, gunakan Ramuan Pemulih Tenaga atau Perisai Warisan di dalam Inventori.',
    ],
  },
];

export const BONUS_ORBS: { id: string; position: [number, number]; kupang: number; label: string }[] = [
  { id: 'orb_rimba', position: [-36, -42], kupang: 5, label: 'Kupang Tersembunyi Rimba' },
  { id: 'orb_gua', position: [38, -42], kupang: 5, label: 'Kupang Kristal Gua' },
  { id: 'orb_kampung', position: [-34, 52], kupang: 5, label: 'Kupang Pasar Nusantara' },
  { id: 'orb_lembah', position: [36, 50], kupang: 5, label: 'Kupang Air Terjun Lembah' },
  { id: 'orb_istana', position: [-10, -82], kupang: 10, label: 'Kupang Taman Diraja' },
];
