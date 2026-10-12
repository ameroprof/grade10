import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Stars } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import * as THREE from 'three';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const STORAGE_KEY = 'edu-games-progress-v1';
const colors = ['#4cc9f0', '#7f5af0', '#5eead4', '#fbbf24', '#f97316', '#f472b6', '#22d3ee'];

const worldRegions = [
  { id: 'gate', name: 'بوابة البيانات', x: -6, z: 4, color: '#4cc9f0', concept: 'مقدمة اللعبة', objective: 'تعرف على البيانات' },
  { id: 'bigdata', name: 'مدينة البيانات الضخمة', x: -2, z: -5, color: '#7f5af0', concept: '5 Vs', objective: 'فهم خصائص البيانات الضخمة' },
  { id: 'visual', name: 'مرصد التمثيل المرئي', x: 4, z: -2, color: '#f97316', concept: 'الرسوس البيانية', objective: 'اختيار المخطط المناسب' },
  { id: 'dashboard', name: 'مدينة لوحات المعلومات', x: 8, z: 5, color: '#fbbf24', concept: 'التفاعل', objective: 'بناء لوحة معلومات' },
  { id: 'hospital', name: 'مستشفى البيانات', x: 0, z: 10, color: '#34d399', concept: 'التنظيف والتحليل', objective: 'إصلاح البيانات' },
  { id: 'analytics', name: 'مركز التحليل', x: -8, z: 11, color: '#22d3ee', concept: 'الوظائف والبحث', objective: 'استخدام الدوال' },
  { id: 'predict', name: 'برج التنبؤ', x: 10, z: 12, color: '#f472b6', concept: 'التنبؤ', objective: 'تقييم النموذج' },
  { id: 'final', name: 'المشروع الختامي', x: 0, z: 0, color: '#a78bfa', concept: 'إنقاذ المدينة', objective: 'حل المشكلة الكلية' },
];

const glossary = [
  { term: 'البيانات', ar: 'Data', meaning: 'حقائق أو أرقام أو ملاحظات تُجمع بهدف التحليل لاتخاذ القرار.' },
  { term: 'التمثيل المرئي', ar: 'Visualization', meaning: 'عرض البيانات من خلال الرسوم أو الجداول أو الخرائط لتسهيل الفهم.' },
  { term: 'التنظيف', ar: 'Data Cleaning', meaning: 'إزالة الأخطاء والفراغات والتكرار قبل التحليل.' },
  { term: 'التنبؤ', ar: 'Forecast', meaning: 'تقدير الاتجاه المستقبلي باستخدام بيانات تاريخية.' },
  { term: 'الجدول المحوري', ar: 'Pivot Table', meaning: 'أداة تلخيص للبيانات حسب أعمدة وحقول مختلفة.' },
];

const domainMeta: Record<string, { label: string; color: string }> = {
  data: { label: 'البيانات', color: '#4cc9f0' },
  bigdata: { label: 'البيانات الضخمة', color: '#8b5cf6' },
  visual: { label: 'التمثيل المرئي', color: '#f97316' },
  dashboard: { label: 'لوحات المعلومات', color: '#fbbf24' },
  cleaning: { label: 'التنظيف', color: '#34d399' },
  analytics: { label: 'التحليل', color: '#22d3ee' },
  prediction: { label: 'التنبؤ', color: '#f472b6' },
  final: { label: 'المشروع النهائي', color: '#a78bfa' },
};

type Screen = 'menu' | 'game' | 'report' | 'knowledge';

type Progress = {
  xp: number;
  badges: string[];
  openRegions: string[];
  completed: string[];
  studentName: string;
  className: string;
  reportNotes: string;
  attempts: { date: string; score: number; completed: number }[];
  teacherName: string;
  schoolName: string;
  currentAttempt: number;
  domainScores: Record<string, number>;
  finalProjectScore: number;
};

const defaultProgress: Progress = {
  xp: 120,
  badges: [],
  openRegions: ['gate'],
  completed: [],
  studentName: '',
  className: '',
  reportNotes: '',
  attempts: [],
  teacherName: 'عامر كراجه',
  schoolName: 'مدرسة ذكور بيادر وادي السير',
  currentAttempt: 1,
  domainScores: {
    data: 30,
    bigdata: 25,
    visual: 30,
    dashboard: 25,
    cleaning: 30,
    analytics: 20,
    prediction: 25,
    final: 20,
  },
  finalProjectScore: 0,
};

const pieData = [
  { name: 'المنصات', value: 30 },
  { name: 'الواجبات', value: 25 },
  { name: 'الفيديو', value: 20 },
  { name: 'المحاضرات', value: 15 },
  { name: 'النشاطات', value: 10 },
];

const barData = [
  { name: 'لغة', books: 18, science: 12, arts: 9 },
  { name: 'رياضيات', books: 24, science: 20, arts: 13 },
  { name: 'علوم', books: 17, science: 18, arts: 11 },
  { name: 'تاريخ', books: 14, science: 9, arts: 15 },
];

const lineData = [
  { month: 'يناير', value: 70 },
  { month: 'فبراير', value: 74 },
  { month: 'مارس', value: 78 },
  { month: 'أبريل', value: 82 },
  { month: 'مايو', value: 86 },
  { month: 'يونيو', value: 90 },
  { month: 'يوليو', value: 94 },
];

const scatterData = [
  { x: 1, y: 3 },
  { x: 2, y: 5 },
  { x: 3, y: 7 },
  { x: 5, y: 8 },
  { x: 6, y: 9 },
  { x: 8, y: 12 },
  { x: 9, y: 15 },
];

const dashboardData = [
  { date: '1-أب', users: 120, sales: 85, mistakes: 10 },
  { date: '5-أب', users: 146, sales: 93, mistakes: 15 },
  { date: '10-أب', users: 170, sales: 105, mistakes: 11 },
  { date: '15-أب', users: 186, sales: 120, mistakes: 18 },
  { date: '20-أب', users: 210, sales: 140, mistakes: 12 },
];

const dataTable = [
  { id: 1, name: 'سارة', city: 'عمان', score: 88, note: 'مستوى جيد', status: 'نظيف' },
  { id: 2, name: 'لؤي ', city: 'إربد', score: 95, note: 'مستوى ممتاز', status: 'مكرر' },
  { id: 3, name: ' رامي', city: 'الزرقاء', score: '', note: 'بيانات ناقصة', status: 'مفقود' },
  { id: 4, name: 'هيا', city: 'البلقاء', score: 72, note: ' متطابق', status: 'تنسيق غير موحد' },
  { id: 5, name: 'سارة', city: 'عمان', score: 88, note: 'مكرر', status: 'مكرر' },
];

const functionExamples = [
  { name: 'LEFT', input: 'AI-2024-Team', output: 'AI-2024' },
  { name: 'RIGHT', input: 'Lib-2024', output: '2024' },
  { name: 'MID', input: 'Data-55-Game', output: '55' },
  { name: 'TRIM', input: '   Data   ', output: 'Data' },
];

const forecastData = [
  { month: 'يناير', value: 10 },
  { month: 'فبراير', value: 15 },
  { month: 'مارس', value: 18 },
  { month: 'أبريل', value: 24 },
  { month: 'مايو', value: 30 },
  { month: 'يونيو', value: 36 },
  { month: 'يوليو', value: 42 },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getSavedProgress(): Progress {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultProgress;

  const parsed = JSON.parse(raw) as Partial<Progress>;
  return {
    ...defaultProgress,
    ...parsed,
    attempts: parsed.attempts ?? [],
    openRegions: parsed.openRegions ?? ['gate'],
    completed: parsed.completed ?? [],
    badges: parsed.badges ?? [],
    domainScores: { ...defaultProgress.domainScores, ...(parsed.domainScores ?? {}) },
  };
}

function WorldMap({
  playerPos,
  setPlayerPos,
  selectedRegionId,
  onSelect,
}: {
  playerPos: { x: number; z: number };
  setPlayerPos: Dispatch<SetStateAction<{ x: number; z: number }>>;
  selectedRegionId: string;
  onSelect: (id: string) => void;
}) {
  const playerRef = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        keys.current[key] = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        keys.current[key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    const speed = 2.5;
    let dx = 0;
    let dz = 0;

    if (keys.current.w || keys.current.arrowup) dz -= 1;
    if (keys.current.s || keys.current.arrowdown) dz += 1;
    if (keys.current.a || keys.current.arrowleft) dx -= 1;
    if (keys.current.d || keys.current.arrowright) dx += 1;

    if (dx !== 0 || dz !== 0) {
      const length = Math.hypot(dx, dz) || 1;
      setPlayerPos((current) => ({
        x: clamp(current.x + (dx / length) * speed * delta, -12, 12),
        z: clamp(current.z + (dz / length) * speed * delta, -12, 12),
      }));
    }

    const camera = state.camera;
    camera.position.lerp(new THREE.Vector3(playerPos.x + 11, 9, playerPos.z + 12), 0.09);
    camera.lookAt(playerPos.x, 0.5, playerPos.z);

    if (playerRef.current) {
      playerRef.current.position.set(playerPos.x, 0.6, playerPos.z);
    }
  });

  return (
    <>
      <color attach="background" args={['#07111f']} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[8, 10, 4]} intensity={1.5} color="#d7ecff" />
      <Stars radius={80} depth={20} count={3200} factor={4} saturation={0} fade speed={0.8} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0d1b2a" />
      </mesh>

      {worldRegions.map((region) => (
        <group key={region.id} position={[region.x, 0.5, region.z]}>
          <Float speed={2.4} rotationIntensity={0.6} floatIntensity={1.2}>
            <mesh onClick={() => onSelect(region.id)} castShadow>
              <cylinderGeometry args={[1.2, 1.6, 2.4, 24]} />
              <meshStandardMaterial
                color={region.id === selectedRegionId ? '#f8fafc' : region.color}
                emissive={region.color}
                emissiveIntensity={region.id === selectedRegionId ? 1.4 : 0.8}
                metalness={0.4}
                roughness={0.22}
              />
            </mesh>
          </Float>
          <mesh position={[0, 1.8, 0]}>
            <sphereGeometry args={[0.48, 18, 18]} />
            <meshStandardMaterial color="#ffffff" emissive={region.color} emissiveIntensity={0.9} />
          </mesh>
        </group>
      ))}

      <group ref={playerRef} position={[playerPos.x, 0.6, playerPos.z]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.45, 1.2, 6, 12]} />
          <meshStandardMaterial color="#fef3c7" emissive="#f59e0b" emissiveIntensity={0.7} />
        </mesh>
      </group>

      <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2.2} minPolarAngle={Math.PI / 3} />
    </>
  );
}

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedRegionId, setSelectedRegionId] = useState('gate');
  const [playerPos, setPlayerPos] = useState({ x: -6, z: 4 });
  const [progress, setProgress] = useState<Progress>(() => getSavedProgress());
  const [chartMode, setChartMode] = useState('bar');
  const [dashboardFilter, setDashboardFilter] = useState('كل الفئات');
  const [selectedDefinition, setSelectedDefinition] = useState('البيانات');
  const [profileDraft, setProfileDraft] = useState({
    studentName: progress.studentName,
    className: progress.className,
  });
  const [profileModalOpen, setProfileModalOpen] = useState(() => !progress.studentName || !progress.className);
  const [pendingScreen, setPendingScreen] = useState<Screen>('game');
  const [cleaningRows, setCleaningRows] = useState(dataTable);
  const [forecastValue, setForecastValue] = useState('48');
  const [functionAnswer, setFunctionAnswer] = useState('');
  const [notes, setNotes] = useState('');
  const [printMode, setPrintMode] = useState<'report' | 'certificate'>('report');
  const [soundOn, setSoundOn] = useState(true);
  const [projectChecklist, setProjectChecklist] = useState<Record<string, boolean>>({
    clean: false,
    chart: false,
    dashboard: false,
    forecast: false,
  });

  useEffect(() => {
    document.body.classList.toggle('certificate-mode', printMode === 'certificate');
  }, [printMode]);

  const currentRegion = worldRegions.find((region) => region.id === selectedRegionId) ?? worldRegions[0];
  const selectedDefinitionData = glossary.find((item) => item.term === selectedDefinition) ?? glossary[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'e') {
        const nearby = worldRegions.find(
          (region) => Math.hypot(region.x - playerPos.x, region.z - playerPos.z) < 2.2,
        );
        if (nearby) {
          setSelectedRegionId(nearby.id);
          setScreen('game');
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [playerPos]);

  const completedCount = progress.completed.length;
  const profileReady = Boolean(progress.studentName.trim()) && Boolean(progress.className.trim());

  useEffect(() => {
    setProfileDraft({ studentName: progress.studentName, className: progress.className });
  }, [progress.studentName, progress.className]);

  const saveProfile = () => {
    const studentName = profileDraft.studentName.trim();
    const className = profileDraft.className.trim();

    if (!studentName || !className) {
      return;
    }

    setProgress((current) => ({
      ...current,
      studentName,
      className,
    }));
    setScreen(pendingScreen);
    if (pendingScreen === 'game') {
      setSelectedRegionId('gate');
    }
    setProfileModalOpen(false);
  };

  const openAdventure = (targetScreen: Screen = 'game') => {
    if (!profileReady) {
      setPendingScreen(targetScreen);
      setProfileModalOpen(true);
      return;
    }

    setScreen(targetScreen);
    if (targetScreen === 'game') {
      setSelectedRegionId('gate');
    }
  };

  const domainAverage = useMemo(() => {
    const values = Object.values(progress.domainScores);
    if (!values.length) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [progress.domainScores]);

  const totalScore = useMemo(() => {
    const missionScore = Math.min(100, Math.round((completedCount / 8) * 100));
    return Math.max(40, Math.round((missionScore * 0.6) + (domainAverage * 0.4)));
  }, [completedCount, domainAverage]);

  const projectScore = useMemo(() => {
    const steps = Object.values(projectChecklist).filter(Boolean).length;
    return Math.round((steps / 4) * 100);
  }, [projectChecklist]);

  const studentName = progress.studentName.trim() || 'طالبنا';
  const motivationalLine = `${studentName}، ورجينا إبداعاتك! يلا يا كبير ركّز، شد حيلك وخلّي تفكيرك يلمع.`;

  const playEffect = (tone: 'success' | 'reset' = 'success') => {
    if (!soundOn || typeof window === 'undefined') return;

    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    const audioContext = new AudioCtor();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = tone === 'reset' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(tone === 'reset' ? 180 : 440, now);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (tone === 'reset' ? 0.2 : 0.24));
    oscillator.start(now);
    oscillator.stop(now + (tone === 'reset' ? 0.22 : 0.26));
    oscillator.onended = () => audioContext.close();
  };

  const missionStory = useMemo(() => {
    const stories: Record<string, string> = {
      gate: 'سجل المعلومات الأساسية واستخدمها في اتخاذ القرار الصحيح.',
      bigdata: 'حدّد خصائص البيانات الضخمة ووضح كيف تؤثر على تحليلها.',
      visual: 'اختر المخطط الأنسب لتفسير البيانات بسرعة ودقة.',
      dashboard: 'اهتم بالمؤشرات الرئيسية وراقب الاتجاهات قبل اتخاذ القرار.',
      hospital: 'نظّف البيانات قبل التحليل لتقليل الأخطاء.',
      analytics: 'استخدم الدوال والخيارات المناسبة لاسترجاع البيانات المطلوبة.',
      predict: 'قارن التوقعات مع القيم الحقيقية لتقييم جودة النموذج.',
      final: 'أعد تجميع جميع المهارات في مشروع متكامل يحل مشكلة المدينة.',
    };

    return stories[selectedRegionId] ?? 'استكشف المنطقة وحقّق المهمة الرقمية المطلوبة.';
  }, [selectedRegionId]);

  const regionMessage = `${studentName}، ${missionStory} يلا، شد حيلك وواصل!`;

  const finishMission = (missionId: string, badge: string, xpEarned = 15, domain = 'data') => {
    setProgress((current) => {
      const completed = current.completed.includes(missionId)
        ? current.completed
        : [...current.completed, missionId];

      const badges = current.badges.includes(badge) ? current.badges : [...current.badges, badge];
      const domainScores = { ...current.domainScores, [domain]: Math.min(100, (current.domainScores[domain] ?? 0) + 16) };

      const nextState = {
        ...current,
        xp: current.xp + xpEarned,
        completed,
        badges,
        domainScores,
        finalProjectScore: domain === 'final' ? Math.max(current.finalProjectScore, projectScore) : current.finalProjectScore,
      };

      playEffect('success');
      return nextState;
    });
  };

  const resetProgress = () => {
    if (window.confirm('هل تريد بدء محاولة جديدة؟ سيتم مسح تقدمك الحالي.')) {
      const next = {
        ...defaultProgress,
        studentName: progress.studentName,
        className: progress.className,
        teacherName: progress.teacherName,
        schoolName: progress.schoolName,
        currentAttempt: progress.currentAttempt + 1,
        attempts: [...progress.attempts, { date: new Date().toISOString(), score: totalScore, completed: completedCount }],
      };
      playEffect('reset');
      setProgress(next);
      setSelectedRegionId('gate');
      setPlayerPos({ x: -6, z: 4 });
      setScreen('game');
    }
  };

  const printReport = (mode: 'report' | 'certificate' = 'report') => {
    setPrintMode(mode);
    window.setTimeout(() => window.print(), 80);
  };

  const renderZoneContent = () => {
    switch (selectedRegionId) {
      case 'gate':
        return (
          <div className="zone-card">
            <h2>بوابة البيانات</h2>
          <p>{studentName}، البيانات الخام تحتاج إلى تنظيمها وتحليلها وأن تصبح معلومات قابلة للتفسير.</p>
            <div className="mission-list">
              <button className="mission-item" onClick={() => finishMission('gate-1', 'مستكشف البيانات', 18, 'data')}>
                جمع ثلاث بطاقات بيانات وشرح كل بطاقة
              </button>
              <button className="mission-item" onClick={() => finishMission('gate-2', 'محلل البيانات', 12, 'data')}>
                تحديد مصدر البيانات وسبب أهميته
              </button>
            </div>
            <div className="mini-note">الهدف: التفريق بين البيانات الخام والمعلومة المفيدة.</div>
          </div>
        );

      case 'bigdata':
        return (
          <div className="zone-card">
            <h2>مدينة البيانات الضخمة</h2>
            <p>تعرف على الخصائص الخمس للبيانات الضخمة: الحجم، السرعة، التنوع، الموثوقية، والقيمة.</p>
            <div className="bigdata-grid">
              {['Volume', 'Velocity', 'Variety', 'Veracity', 'Value'].map((key) => (
                <button
                  key={key}
                  className="option"
                  onClick={() => finishMission(`bigdata-${key}`, 'خبير الخصائص الخمس', 10, 'bigdata')}
                >
                  {key}
                </button>
              ))}
            </div>
            <div className="mini-note">المعلومة: لا يكفي وجود بيانات كثيرة، بل يجب أن تكون مفيدة وموثوقة وقابلة للتحليل.</div>
          </div>
        );

      case 'visual':
        return (
          <div className="zone-card">
            <h2>مرصد التمثيل المرئي</h2>
            <div className="chart-selector">
              {['pie', 'bar', 'line', 'scatter'].map((type) => (
                <button key={type} className={chartMode === type ? 'selected' : ''} onClick={() => setChartMode(type)}>
                  {type}
                </button>
              ))}
            </div>
            <div className="chart-box">
              {chartMode === 'pie' && (
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie dataKey="value" data={pieData} cx="50%" cy="50%" outerRadius={82} label>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {chartMode === 'bar' && (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="books" fill="#60a5fa" />
                    <Bar dataKey="science" fill="#34d399" />
                    <Bar dataKey="arts" fill="#fbbf24" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartMode === 'line' && (
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#f472b6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {chartMode === 'scatter' && (
                <ResponsiveContainer width="100%" height={230}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="x" name="الوقت" />
                    <YAxis type="number" dataKey="y" name="المستوى" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={scatterData} fill="#a78bfa" />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mission-list">
              <button className="mission-item" onClick={() => finishMission('visual-choice', 'خبير المخططات', 20, 'visual')}>
                اختيار المخطط المناسب وتفسير النتيجة
              </button>
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="zone-card">
            <h2>مدينة لوحات المعلومات</h2>
            <p>لوحة المعلومات تجمع أهم المؤشرات في مكان واحد لتسهيل اتخاذ القرار.</p>
            <div className="filter-row">
              {['كل الفئات', 'المستخدمون', 'المبيعات', 'الأخطاء'].map((filter) => (
                <button key={filter} className={dashboardFilter === filter ? 'selected' : ''} onClick={() => setDashboardFilter(filter)}>
                  {filter}
                </button>
              ))}
            </div>
            <div className="dashboard-summary">
              <div className="metric-box">
                <span>متوسط المستخدمين</span>
                <strong>166</strong>
              </div>
              <div className="metric-box">
                <span>إيرادات اليوم</span>
                <strong>١١١</strong>
              </div>
              <div className="metric-box">
                <span>أخطاء النظام</span>
                <strong>13</strong>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dashboardData}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#60a5fa" fillOpacity={1} fill="url(#salesFill)" />
              </AreaChart>
            </ResponsiveContainer>
            <button className="primary mission-item" onClick={() => finishMission('dashboard-kpi', 'مصمم لوحة المعلومات', 22, 'dashboard')}>
              تحليل المؤشرات واتخاذ قرار
            </button>
          </div>
        );

      case 'hospital':
        return (
          <div className="zone-card">
            <h2>مستشفى البيانات</h2>
            <p>قبل التحليل، يجب تنظيف البيانات وإزالة التكرار، القيم المفقودة، والتنسيق غير المتسق.</p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>المدينة</th>
                  <th>النتيجة</th>
                  <th>ملاحظة</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {cleaningRows.map((row) => (
                  <tr key={`${row.id}-${row.name}`}>
                    <td>{row.name.trim()}</td>
                    <td>{row.city}</td>
                    <td>{row.score || 'ناقص'}</td>
                    <td>{row.note.trim()}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="primary mission-item"
              onClick={() => {
                setCleaningRows((current) =>
                  current.map((row) => (row.status === 'مكرر' ? { ...row, status: 'تم التنظيف' } : row)),
                );
                finishMission('hospital', 'طبيب البيانات', 25, 'cleaning');
              }}
            >
              تنظيف القائمة
            </button>
          </div>
        );

      case 'analytics':
        return (
          <div className="zone-card">
            <h2>مركز التحليل المتقدم</h2>
            <div className="function-box">
              <label>اكتب الدالة المناسبة:</label>
              <input value={functionAnswer} onChange={(event) => setFunctionAnswer(event.target.value)} placeholder="مثال: LEFT, TRIM, SUMIF" />
              <button
                className="primary"
                onClick={() => {
                  if (['LEFT', 'TRIM', 'SUMIF', 'VLOOKUP'].includes(functionAnswer.toUpperCase())) {
                    finishMission('analytics', 'محترف الدوال', 30, 'analytics');
                  }
                }}
              >
                تأكيد الإجابة
              </button>
            </div>
            <div className="mini-list">
              {functionExamples.map((item) => (
                <div className="mini-item" key={item.name}>
                  <strong>{item.name}</strong>
                  <span>{item.input}</span>
                  <span>→ {item.output}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'predict':
        return (
          <div className="zone-card">
            <h2>برج التنبؤ</h2>
            <p>التنبؤ الخطي يقدر الاتجاه المحتمل من خلال البيانات التاريخية، لكن دقة النموذج تحتاج إلى تقييم.</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#f472b6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
            <label>التنبؤ المتوقع</label>
            <input value={forecastValue} onChange={(event) => setForecastValue(event.target.value)} />
            <div className="prediction-note">
              نسبة الخطأ % = |القيمة الفعلية − القيمة المتوقعة| ÷ |القيمة الفعلية| × 100
            </div>
            <button className="primary mission-item" onClick={() => finishMission('predict', 'مهندس التنبؤ', 30, 'prediction')}>
              حساب التنبؤ
            </button>
          </div>
        );

      case 'final':
        return (
          <div className="zone-card">
            <h2>المشروع الختامي: أنقذ المدينة الرقمية</h2>
            <ol className="final-checklist">
              <li>عالج بيانات غير منظمة.</li>
              <li>اختر المخطط المناسب لكل سؤال.</li>
              <li>أنشئ لوحة معلومات تفاعلية.</li>
              <li>قارن التنبؤ بالقيمة الفعلية.</li>
            </ol>
            <div className="project-steps">
              {[
                ['clean', 'تنظيف البيانات'],
                ['chart', 'اختيار الرسوم'],
                ['dashboard', 'لوحة المعلومات'],
                ['forecast', 'التنبؤ النهائي'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={projectChecklist[key] ? 'task-done' : ''}
                  onClick={() => {
                    setProjectChecklist((current) => ({ ...current, [key]: !current[key] }));
                    if (!projectChecklist[key]) {
                      finishMission(`final-${key}`, 'محلل البيانات المتقدم', 12, 'final');
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="primary mission-item" onClick={() => finishMission('final-project', 'مبدع التحليل', 40, 'final')}>
              إنجاز المشروع
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar glass-panel">
        <div>
          <p className="eyebrow">المهارات الرقمية</p>
          <h1>مهمة محللي البيانات: بوابة المستقبل الرقمي</h1>
        </div>
        <div className="top-actions">
          <button onClick={() => setScreen('menu')}>الرئيسية</button>
          <button onClick={() => setScreen('knowledge')}>دفتر المعرفة</button>
          <button onClick={() => setScreen('report')}>تقرير التقييم</button>
        </div>
      </header>

      {screen === 'menu' && (
        <main className="landing">
          <section className="hero glass-panel">
            <div>
              <p className="mini-label">الصف العاشر الأساسي</p>
              <div className="welcome-banner">{studentName}، {progress.studentName ? 'أهلاً وسهلاً بكم في رحلتك الرقمية' : 'أهلاً وسهلاً بك'} </div>
              <h2>استكشف المدينة الرقمية واصنع القرار من البيانات</h2>
              <p className="motivation-text">{motivationalLine}</p>
              <p>أنت محلل بيانات رقمي يحل مشكلة المدينة من خلال التحليل والتنظيف والمخططات والتنبؤ.</p>
              <div className="cta-group">
                <button className="primary" onClick={() => openAdventure('game')}>ابدأ المغامرة</button>
                <button onClick={() => openAdventure('game')}>متابعة التقدم</button>
                <button onClick={() => { if (!profileReady) { setProfileModalOpen(true); return; } setScreen('knowledge'); }}>مكتبة المعرفة</button>
              </div>
            </div>
            <div className="meta-box">
              <div><span>المعلم</span><strong>{progress.teacherName}</strong></div>
              <div><span>المدرسة</span><strong>{progress.schoolName}</strong></div>
              <div><span>التقدم</span><strong>{completedCount}/8 مهمات</strong></div>
              <div><span>نتيجة التقييم</span><strong>{Math.round(totalScore)}%</strong></div>
            </div>
          </section>
        </main>
      )}

      {profileModalOpen && (
        <div className="profile-modal-backdrop" onClick={() => setProfileModalOpen(false)}>
          <div className="profile-modal glass-panel" onClick={(event) => event.stopPropagation()}>
            <div className="profile-header">
              <p className="mini-label">تسجيل الطالب</p>
              <h3>ابدأ المهمة بالتقييم الشخصي</h3>
            </div>
            <div className="profile-fields">
              <label>
                <span>اسم الطالب</span>
                <input
                  value={profileDraft.studentName}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, studentName: event.target.value }))}
                  placeholder="اكتب اسم الطالب"
                />
              </label>
              <label>
                <span>الشعبة</span>
                <input
                  value={profileDraft.className}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, className: event.target.value }))}
                  placeholder="مثال: 10-أ"
                />
              </label>
            </div>
            <div className="profile-actions">
              <button className="primary" onClick={saveProfile}>حفظ البيانات وبدء اللعبة</button>
            </div>
          </div>
        </div>
      )}

      {screen === 'game' && (
        <main className="game-layout">
          <section className="world-panel glass-panel">
            <div className="hud">
              <span>أهلاً {studentName}</span>
              <span>المنطقة الحالية: {currentRegion.name}</span>
              <span>المهمة: {currentRegion.objective}</span>
              <span>XP: {progress.xp}</span>
            </div>
            <div className="game-callout">{regionMessage}</div>
            <div className="canvas-wrap">
              <Canvas camera={{ position: [10, 9, 10], fov: 50 }}>
                <WorldMap playerPos={playerPos} setPlayerPos={setPlayerPos} selectedRegionId={selectedRegionId} onSelect={setSelectedRegionId} />
              </Canvas>
            </div>
            <div className="controls-note">التحكم: W/A/S/D أو الأسهم • E للتفاعل</div>
          </section>

          <aside className="side-panel glass-panel">
            <div className="region-list">
              {worldRegions.map((region) => (
                <button
                  key={region.id}
                  className={region.id === selectedRegionId ? 'region-item active' : 'region-item'}
                  onClick={() => setSelectedRegionId(region.id)}
                >
                  <span className="dot" style={{ background: region.color }} />
                  <span>{region.name}</span>
                </button>
              ))}
            </div>
            <div className="region-summary">
              <h3>{currentRegion.name}</h3>
              <p>{currentRegion.concept}</p>
              <div className="badge-row">
                {progress.badges.slice(0, 4).map((badge) => (
                  <span key={badge} className="badge">{badge}</span>
                ))}
              </div>
            </div>
            {renderZoneContent()}
          </aside>
        </main>
      )}

      {screen === 'knowledge' && (
        <main className="knowledge-page glass-panel">
          <div className="knowledge-header">
            <h2>دفتر المعرفة</h2>
            <div className="selector-row">
              {glossary.map((item) => (
                <button key={item.term} className={selectedDefinition === item.term ? 'selected' : ''} onClick={() => setSelectedDefinition(item.term)}>
                  {item.term}
                </button>
              ))}
            </div>
          </div>

          <div className="knowledge-card">
            <h3>
              {selectedDefinitionData.term} <span>{selectedDefinitionData.ar}</span>
            </h3>
            <p>{selectedDefinitionData.meaning}</p>
            <div className="knowledge-steps">
              <ul>
                <li>فهم السؤال قبل البحث</li>
                <li>اختيار الرسم المناسب</li>
                <li>تنظيف البيانات قبل التحليل</li>
                <li>تفسير النتائج بدقة</li>
              </ul>
            </div>
          </div>
        </main>
      )}

      {screen === 'report' && (
        <main className="report-page glass-panel">
          <div className="print-actions">
            <button className="primary" onClick={() => printReport('report')}>طباعة التقرير</button>
            <button onClick={() => printReport('certificate')}>طباعة الشهادة</button>
            <button onClick={() => setScreen('game')}>العودة إلى اللعبة</button>
            <button onClick={resetProgress}>بدء محاولة جديدة</button>
          </div>

          <section className="report-card printable">
            <header className="report-header">
              <div>
                <strong>تقرير تقييم أداء الطالب – لعبة مهمة محللي البيانات</strong>
              </div>
              <div>
                <span>المعلم: {progress.teacherName}</span>
              </div>
            </header>

            <div className="report-meta">
              <label>
                اسم الطالب
                <input value={progress.studentName} onChange={(event) => setProgress((current) => ({ ...current, studentName: event.target.value }))} />
              </label>
              <label>
                الشعبة
                <input value={progress.className} onChange={(event) => setProgress((current) => ({ ...current, className: event.target.value }))} />
              </label>
              <label>
                المدرسة
                <input value={progress.schoolName} onChange={(event) => setProgress((current) => ({ ...current, schoolName: event.target.value }))} />
              </label>
              <label>
                رقم المحاولة
                <input value={progress.currentAttempt} readOnly />
              </label>
            </div>

            <div className="report-score-grid">
              <div className="score-box">
                <span>العلامة النهائية</span>
                <strong>{Math.round(totalScore)}/100</strong>
              </div>
              <div className="score-box">
                <span>النسبة</span>
                <strong>{Math.round(totalScore)}%</strong>
              </div>
              <div className="score-box">
                <span>المهمات المكتملة</span>
                <strong>{completedCount}</strong>
              </div>
              <div className="score-box">
                <span>المهمات التي تحتاج إلى إعادة</span>
                <strong>{Math.max(0, 8 - completedCount)}</strong>
              </div>
            </div>

            <div className="domain-breakdown">
              {Object.entries(domainMeta).map(([key, meta]) => (
                <div className="domain-bar" key={key}>
                  <div className="domain-bar-head">
                    <span>{meta.label}</span>
                    <strong>{progress.domainScores[key] ?? 0}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress.domainScores[key] ?? 0}%`, background: meta.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="report-chart">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { name: 'البيانات الضخمة', value: progress.domainScores.bigdata ?? 0 },
                  { name: 'المخططات', value: progress.domainScores.visual ?? 0 },
                  { name: 'التنظيف', value: progress.domainScores.cleaning ?? 0 },
                  { name: 'الدوال', value: progress.domainScores.analytics ?? 0 },
                  { name: 'التنبؤ', value: progress.domainScores.prediction ?? 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <textarea
              value={notes || 'ملاحظات المعلم: الطالب يملك فهمًا جيدًا ويحتاج إلى مراجعة التنبؤ وتحسين تفسير النتائج.'}
              onChange={(event) => setNotes(event.target.value)}
            />
          </section>

          <section className="certificate-card printable">
            <div className="certificate-header">شهادة إنجاز</div>
            <h3>تم منح هذه الشهادة إلى</h3>
            <div className="certificate-name">{progress.studentName || 'الطالب'}</div>
            <p>لنجاحه في إكمال مهمة محللي البيانات: بوابة المستقبل الرقمي، وتحقيق المهارات الأساسية في جمع البيانات، تنظيفها، تحليلها، تمثيلها بصريًا، والتنبؤ بها.</p>
            <div className="certificate-badges">
              {progress.badges.map((badge) => (
                <span key={badge} className="badge">{badge}</span>
              ))}
            </div>
            <div className="certificate-footer">
              <div>
                <strong>المعلم</strong>
                <p>{progress.teacherName}</p>
              </div>
              <div>
                <strong>المدرسة</strong>
                <p>{progress.schoolName}</p>
              </div>
              <div>
                <strong>التقدير النهائي</strong>
                <p>{Math.round(totalScore)}%</p>
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
