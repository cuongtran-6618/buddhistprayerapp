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
      { text: 'Thiên thủ thiên nhãn vô ngại Đại Bi Tâm Đà La Ni', startMs: 26000 },
      { text: 'Nam mô hắc ra đát na đa ra dạ da', startMs: 35000 },
      { text: 'Nam mô a rị da bà lô kiết đế thước bát ra da', startMs: 40000 },
      { text: 'Bồ đề tát đỏa bà da', startMs: 47000 },
      { text: 'Ma ha tát đỏa bà da', startMs: 51000 },
      { text: 'Ma ha ca lô ni ca da', startMs: 55000 },
      { text: 'Án tát bàn ra phạt duệ số đát na đát tỏa', startMs: 58000 },
      { text: 'Nam mô tất kiết lật đỏa y mông a rị da', startMs: 63000 },
      { text: 'Bà lô Yết đế thất Phật ra lăng đà bà', startMs: 69000 },
      { text: 'Nam mô na ra cẩn trì hê rị', startMs: 75000 },
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
