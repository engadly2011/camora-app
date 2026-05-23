// ─────────────────────────────────────────────────────────────────────────────
// Arabic locale dictionary
//
// Translation principles:
//   1. Technical CCTV/networking terms stay in English verbatim:
//      Bitrate, FPS, Codec, RAID, NVR, PoE, ONVIF, AI, Mbps, GB, TB
//   2. Section headers and UI chrome are translated to professional Arabic.
//   3. Engineering descriptions combine Arabic framing + English technical term.
//   4. No machine-translated filler — every string is engineering-accurate.
//   5. Numbers always render LTR even in RTL layout (CSS handles this via
//      the `font-variant-numeric` / unicode-bidi rules in globals.css).
// ─────────────────────────────────────────────────────────────────────────────

import type { Dictionary } from "./types";

export const ar: Dictionary = {

  shared: {
    appName:  "كامورا",
    tagline:  "حاسبة التخزين",
    cameras:  "كاميرا",
    groups:   "مجموعات",
    group:    "مجموعة",
  },

  header: {
    langToggle: "English",
  },

  engineOptions: {
    title:                "إعدادات المحرك",
    conservativeMode:     "الوضع التحفظي",
    conservativeModeDesc: "يضيف هامش أمان 10% ويفرض الحد الأدنى RAID6",
    storageOverhead:      "هامش التخزين",
  },

  cameraRow: {
    addGroup:       "إضافة مجموعة كاميرات",
    duplicate:      "تكرار الصف",
    remove:         "حذف الصف",
    genericFormula: "عام / بالمعادلة",

    // Technical field labels: keep English term; add Arabic context where useful
    quantity:        "العدد",
    vendor:          "الشركة المصنّعة",
    model:           "الموديل",
    resolution:      "الدقة",          // "4MP" etc. stays in English
    codec:           "Codec",          // unchanged — universal engineering term
    fps:             "FPS",            // unchanged
    sceneComplexity: "تعقيد المشهد",
    encodingMode:    "وضع التشفير",
    bitrateCeiling:  "سقف Bitrate",    // "Bitrate" stays
    recordingMode:   "وضع التسجيل",
    recordingHours:  "ساعات التسجيل / يوم",
    retention:       "مدة الاحتفاظ",
    motionPercent:   "نسبة الحركة",
    audio:           "تسجيل الصوت",
    audioDesc:       "يُضاف معدل نقل صوت RTP ثابت",
    audioCodec:      "Audio Codec",    // unchanged
    aiAnalytics:     "AI Analytics",   // unchanged — brand term
    aiAnalyticsDesc: "يُضاف معدل بيانات وصف أو إرسال AI",
    aiMode:          "وضع AI",         // "AI" stays
  },

  sceneOptions: {
    minimal:     "ثابت تماماً",
    minimalDesc: "غرفة خوادم، صراف آلي — حركة شبه معدومة",
    low:         "منخفض",
    lowDesc:     "ممر فارغ، موقف سيارات ليلاً",
    medium:      "متوسط",
    mediumDesc:  "مكتب أو متجر نموذجي — معيار الحساب",
    high:        "مرتفع",
    highDesc:    "خارجي مع نباتات أو شارع مزدحم",
    extreme:     "قصوى",
    extremeDesc: "ضوضاء IR ليلية، أمطار غزيرة، تجمعات كثيفة",
  },

  recordingMode: {
    continuous:        "مستمر",
    continuousDesc:    "24 ساعة يومياً بكامل معدل Bitrate",
    scheduled:         "مجدوَل",
    scheduledDesc:     "نافذة ساعات محددة فقط",
    motionOnly:        "عند الحركة فقط",
    motionOnlyDesc:    "يسجّل عند اكتشاف الحركة",
    alarmTriggered:    "بإشارة الإنذار",
    alarmTriggeredDesc: "يسجّل عند استقبال إشارة إنذار خارجية",
    motionAdaptive:    "تكيّفي مع الحركة",
    motionAdaptiveDesc: "تسجيل مستمر مع رفع Bitrate عند الحركة",
  },

  results: {
    engineWarnings:    "تحذيرات هندسية",
    storageSection:    "متطلبات التخزين",
    rawStorage:        "التخزين الخام",
    rawStorageSub:     "مجموع جميع مجموعات الكاميرات",
    withOverhead:      "مع الهامش",
    withOverheadSub:   "نظام الملفات + هامش أمان 20%",
    usableCapacity:    "السعة الصالحة للاستخدام",
    surplus:           "الفائض",
    surplusSub:        "هامش فوق الحد المطلوب",
    driveSection:      "توصية الأقراص",
    surveillanceRequired: "أقراص مراقبة متخصصة مطلوبة",
    standardGrade:     "درجة قياسية",
    budget:            "اقتصادي",
    mainstream:        "متوسط",
    enterprise:        "احترافي",
    gross:             "إجمالي",
    overheadRatio:     "نسبة الهامش",
    formFactor:        "شكل القرص",
    nvrSection:        "إنتاجية NVR",   // "NVR" unchanged
    avgIngress:        "متوسط البيانات الواردة",
    avgIngressSub:     "جميع الكاميرات في وقت واحد",
    recommendedNvr:    "NVR الموصى به",
    recommendedNvrSub: "هامش إضافي 25%",
    peakBurst:         "ذروة الإرسال",
    peakBurstSub:      "أسوأ سيناريو لإطارات I-frame",
    minHddWrite:       "أدنى سرعة كتابة HDD",  // "HDD" unchanged
    minHddWriteSub:    "لكل وحدة تحكم RAID",
    portUtilisation:   "استخدام المنفذ",
    portUtilisationOf: "من 1 GbE",
    bandwidthSection:  "النطاق الترددي للشبكة",
    lanIngress:        "بيانات LAN الواردة",
    lanIngressSub:     "من الكاميرات إلى NVR",
    remoteViewing:     "المشاهدة عن بُعد",
    remoteViewingSub:  "البث المباشر عبر Sub-stream",
    cloudRelay:        "Cloud Relay",      // unchanged — technical brand term
    cloudRelaySub:     "إرسال إطارات AI إلى السحابة",
    wanUplink:         "WAN Uplink",       // unchanged
    wanUplinkSub:      "الحد الأدنى الموصى به",
    breakdownSection:  "تفاصيل كل مجموعة",
    tableHash:         "#",
    tableQty:          "العدد",
    tableEffective:    "Effective Mbps",   // unchanged — engineering unit
    tablePeak:         "Peak Mbps",        // unchanged
    tableDaily:        "يومي/كاميرا",
    tableDuty:         "معامل التشغيل",
    tableTotal:        "إجمالي المجموعة",
    configurePrompt:   "أضف مجموعة كاميرات لعرض النتائج",
  },

};
