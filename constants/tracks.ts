// AudioSource discriminated union — no nullable fields, TypeScript exhaustive-checks each branch.
// To swap in a real file: { type: 'local', asset: require('@/assets/audio/file.mp3') }
// To stream remotely:     { type: 'remote', uri: 'https://cdn.example.com/file.mp3' }
export type AudioSource =
  | { type: 'local'; asset: number }
  | { type: 'remote'; uri: string };

export interface ScriptLine {
  text: string;     // language-agnostic; add a second array for multi-language support
  startMs: number;  // milliseconds from audio start
}

export interface Track {
  id: string;
  title: string;
  subtitle: string;
  audio: AudioSource;
  script: ScriptLine[];
  isPremium?: boolean;
  sessionCount?: number;
  durationLabel?: string;  // display string e.g. "18 phút"; computed from audio at runtime
}

// Seed data — replace with a useTracks() Supabase hook when ready.
// PlayerScreen and HomeScreen will not need to change.
export const TRACKS: Track[] = [
  {
    id: 'chu-dai-bi',
    title: 'Chú Đại Bi',
    subtitle: 'Great Compassion Mantra · 84 câu',
    // Swap to local once the file is in assets/audio/:
    audio: { type: 'local', asset: require('@/assets/audio/chu-dai-bi.mp3') },
    // audio: { type: 'remote', uri: '' },
    sessionCount: 247,
    durationLabel: '18 phút',
    script: [
      { text: 'Nam mô Đại bi Hội Thượng Phật Bồ tát', startMs: 0 },
      { text: 'Nam mô Đại bi Hội Thượng Phật Bồ tát', startMs: 9000 },
      { text: 'Nam mô Đại bi Hội Thượng Phật Bồ tát', startMs: 16000 },
      { text: 'Thiên thủ thiên nhãn vô ngại Đại Bi Tâm Đà La Ni', startMs: 29000 },
      { text: 'Nam mô hắc ra đát na đa ra dạ da', startMs: 35000 },
      { text: 'Nam mô a rị da bà lô Yết đế thước bát ra da', startMs: 41000 },
      { text: 'Bồ đề tát đỏa bà da', startMs: 47000 },
      { text: 'Ma ha tát đỏa bà da', startMs: 52000 },
      { text: 'Ma ha ca lô ni ca da', startMs: 55000 },
      { text: 'Án tát bàn ra phạt duệ số đát na đát tỏa', startMs: 58000 },
      { text: 'Nam mô tất kiết lật đỏa y mông a rị da', startMs: 64000 },
      { text: 'Bà lô Yết đế thất Phật ra lăng đà bà', startMs: 69000 },
      { text: 'Nam mô na ra cẩn trì hê rị', startMs: 76000 },
      { text: 'ma ha bàn đa sa mế, tát bà a tha đậu du bằng', startMs:  81000},
      { text: 'a thệ dựng, tát bà tát đa na ma bà già,', startMs:  86000},
      { text: 'ma phạt đạt đậu, đát điệt tha', startMs:  92000},
      { text: 'Án, a bà lô hê, lô ca đế, ca ra đế', startMs:  95000},
      { text: 'di hê rị, ma ha bồ đề tát đỏa, tát bà tát bà', startMs:  102000},
      { text: 'ma ra ma ra, ma hê ma hê, rị đà dựng', startMs:  108000},
      { text: 'cầu lô cầu lô, kiết mông độ lô độ lô', startMs:  113000},
      { text: 'phạt xà da đế, ma ha phạt xà da đế.', startMs:  119000},
      { text: 'đà ra đà ra, địa rị ni, thất Phật ra da, dá ra dá ra', startMs:  125000},
      { text: 'Mạ mạ phạt ma ra, mục đế lệ,', startMs:  132000},
      { text: 'y hê di hê, thất na thất na', startMs:  136000},
      { text: 'a ra sâm Phật ra xá lợi,', startMs:  140000},
      { text: 'phạt sa phạt sâm, Phật ra xá da', startMs:  146000},
      { text: 'hô lô hô lô, ma ra', startMs:  150000},
      { text: 'hô lô hô lô hê rị, ta ra ta ra,', startMs:  154000},
      { text: 'tất rị tất rị, tô rô tô rô,', startMs:  157000},
      { text: 'bồ đề dạ, bồ đề dạ, bồ đà dạ, bồ đà dạ,', startMs:  161000},
      { text: 'di đế rị dạ na ra cẩn trì', startMs:  166000},
      { text: 'địa rị sắc ni na', startMs:  170000},
      { text: 'ba dạ ma na, ta bà ha', startMs:  175000},
      { text: 'Tất đà dạ, ta bà ha. Ma ha tất đà dạ, ta bà ha', startMs:  178000},
      { text: 'Tất đà du nghệ, thất bàn ra dạ, ta bà ha.', startMs:  185000},
      { text: 'Na ra cẩn trì, ta bà ha.', startMs:  190000},
      { text: 'Ma ra na ra, ta bà ha.', startMs:  193000},
      { text: 'Tất ra tăng a mục khê da, ta bà ha.', startMs:  199000},
      { text: 'Ta bà ma ha, a tất đà dạ, ta bà ha.', startMs:  203000},
      { text: 'Giả kiết ra a tất đà dạ, ta bà ha.', startMs:  209000},
      { text: 'Ba đà ma yết tất đà dạ, ta bà ha.', startMs:  213000},
      { text: 'Na ra cẩn trì bàn đà ra dạ, ta bà ha.', startMs:  220000},
      { text: 'Ma bà lị thắng yết ra dạ, ta bà ha.', startMs:  225000},
      { text: 'Nam mô hắc ra đát na, đa ra dạ da.', startMs:  230000},
      { text: 'Nam mô a rị da, bà lô yết đế, ', startMs:  235000},
      { text: 'thước bàng ra dạ, ta bà ha.', startMs:  238000},
      { text: 'Án, tất điện đô, mạn đa ra,bạt đà dạ ta bà ha.', startMs:  244000},
      //{ text: '', startMs:  0},
    ],
  },
  {
    id: 'nam-mo-a-di-da-phat',
    title: 'Nam Mô A Di Đà Phật',
    subtitle: 'Amitabha Recitation',
    audio: { type: 'remote', uri: '' },
    sessionCount: 183,
    durationLabel: '10 phút',
    script: [],
  },
  {
    id: 'kinh-bat-nha',
    title: 'Kinh Bát Nhã',
    subtitle: 'Heart Sutra',
    audio: { type: 'remote', uri: '' },
    sessionCount: 95,
    durationLabel: '8 phút',
    isPremium: true,
    script: [],
  },
  {
    id: 'than-chu-cau-an',
    title: 'Thần Chú Cầu An',
    subtitle: 'Protection Mantra',
    audio: { type: 'remote', uri: '' },
    sessionCount: 61,
    durationLabel: '22 phút',
    isPremium: true,
    script: [],
  },
];
