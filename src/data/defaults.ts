import type { Company, FinancialRow } from '../types'

interface Defaults {
  companies: Company[]
  financials: FinancialRow[]
}

// Static seed data – market multiples are overlaid at runtime by /api/quotes
// Financials: FY2024/2025 actuals (USD equiv at ~1.08 EUR/USD, ~0.83 GBP/USD, ~145 JPY/USD)
// Sources: company press releases, CNBC, Gurufocus, StockAnalysis, Morningstar (Apr 2026)
const DEFAULTS: Defaults = {
  companies: [
    {id:1,ticker:'IFF',name:'IFF',segment:'Diversified',currency:'USD',mcap:18100,ev_revenue:2.8,ev_ebitda:14.4,ev_ebit:27.3,pe:null,ps:1.7,ev_nopat:null,ebitda_margin:19.2,year:2024},
    {id:2,ticker:'GIVN',name:'Givaudan',segment:'Diversified',currency:'CHF',mcap:28500,ev_revenue:4.0,ev_ebitda:21.0,ev_ebit:27.0,pe:26.1,ps:3.5,ev_nopat:null,ebitda_margin:23.8,year:2024},
    {id:3,ticker:'SY1',name:'Symrise',segment:'Diversified',currency:'EUR',mcap:11000,ev_revenue:2.4,ev_ebitda:11.6,ev_ebit:18.1,pe:23.0,ps:2.1,ev_nopat:null,ebitda_margin:20.7,year:2024},
    {id:4,ticker:'DSFIR',name:'dsm-firmenich',segment:'Diversified',currency:'EUR',mcap:null,ev_revenue:2.8,ev_ebitda:18.0,ev_ebit:null,pe:null,ps:null,ev_nopat:null,ebitda_margin:19.0,year:2024},
    {id:5,ticker:'KRY',name:'Kerry Group',segment:'Flavor',currency:'EUR',mcap:10300,ev_revenue:1.4,ev_ebitda:9.2,ev_ebit:13.8,pe:14.8,ps:1.2,ev_nopat:null,ebitda_margin:15.7,year:2024},
    {id:6,ticker:'SXT',name:'Sensient Technologies',segment:'Flavor',currency:'USD',mcap:2400,ev_revenue:1.9,ev_ebitda:12.0,ev_ebit:15.7,pe:17.1,ps:1.5,ev_nopat:null,ebitda_margin:16.1,year:2024},
    {id:7,ticker:'RBT',name:'Robertet',segment:'Fragrance',currency:'EUR',mcap:760,ev_revenue:1.0,ev_ebitda:5.0,ev_ebit:6.4,pe:17.4,ps:0.9,ev_nopat:null,ebitda_margin:19.4,year:2024},
    {id:8,ticker:'4958',name:'T. Hasegawa',segment:'Flavor',currency:'JPY',mcap:830,ev_revenue:1.5,ev_ebitda:10.0,ev_ebit:13.2,pe:18.0,ps:1.4,ev_nopat:null,ebitda_margin:15.0,year:2024},
    { id: 9, ticker: '4914', name: 'Takasago', segment: 'Fragrance', currency: 'JPY', mcap: 1380, ev_revenue: 1.1, ev_ebitda: 9.1, ev_ebit: 12.0, pe: 14.2, ps: 1.0, ev_nopat: null, ebitda_margin: 12.2, year: 2024 },
    { id: 10, ticker: 'TRPZ', name: 'Turpaz', segment:'Diversified',currency:'ILA',mcap:1380,ev_revenue:1.1,ev_ebitda:9.1,ev_ebit:12.0,pe:14.2,ps:1.0,ev_nopat:null,ebitda_margin:12.2,year:2024},
  ],
  financials: [
    // IFF FY2024
    {id:1,cid:1,ticker:'IFF',name:'IFF',scope:'Consolidated',year:2024,sales:11484,gp:4157,ebitda:2210,ebit:1100,net:243},
    {id:2,cid:1,ticker:'IFF',name:'IFF',scope:'Nourish',year:2024,sales:5870,gp:2000,ebitda:824,ebit:590,net:null},
    {id:3,cid:1,ticker:'IFF',name:'IFF',scope:'Scent',year:2024,sales:2385,gp:1010,ebitda:461,ebit:340,net:null},
    {id:4,cid:1,ticker:'IFF',name:'IFF',scope:'Health & Biosciences',year:2024,sales:1882,gp:730,ebitda:377,ebit:270,net:null},
    // Givaudan FY2024
    {id:5,cid:2,ticker:'GIVN',name:'Givaudan',scope:'Consolidated',year:2024,sales:8079,gp:3563,ebitda:1924,ebit:1517,net:1188},
    {id:6,cid:2,ticker:'GIVN',name:'Givaudan',scope:'Fragrance & Beauty',year:2024,sales:3995,gp:1850,ebitda:1074,ebit:903,net:null},
    {id:7,cid:2,ticker:'GIVN',name:'Givaudan',scope:'Taste & Wellbeing',year:2024,sales:4084,gp:1713,ebitda:850,ebit:617,net:null},
    // Symrise FY2024
    {id:8,cid:3,ticker:'SY1',name:'Symrise',scope:'Consolidated',year:2024,sales:5399,gp:2122,ebitda:1116,ebit:775,net:516},
    {id:9,cid:3,ticker:'SY1',name:'Symrise',scope:'Taste, Nutrition & Health',year:2024,sales:3338,gp:1312,ebitda:741,ebit:518,net:null},
    {id:10,cid:3,ticker:'SY1',name:'Symrise',scope:'Scent & Care',year:2024,sales:2061,gp:810,ebitda:375,ebit:257,net:null},
    // Kerry FY2024
    {id:11,cid:5,ticker:'KRY',name:'Kerry Group',scope:'Consolidated',year:2024,sales:7501,gp:2625,ebitda:1351,ebit:972,net:756},
    {id:12,cid:5,ticker:'KRY',name:'Kerry Group',scope:'Taste & Nutrition',year:2024,sales:7501,gp:2625,ebitda:1188,ebit:890,net:null},
    // Sensient FY2024
    {id:13,cid:6,ticker:'SXT',name:'Sensient Technologies',scope:'Consolidated',year:2024,sales:1557,gp:507,ebitda:250,ebit:192,net:140},
    {id:14,cid:6,ticker:'SXT',name:'Sensient Technologies',scope:'Flavors & Extracts',year:2024,sales:794,gp:270,ebitda:null,ebit:97,net:null},
    {id:15,cid:6,ticker:'SXT',name:'Sensient Technologies',scope:'Color',year:2024,sales:648,gp:215,ebitda:null,ebit:120,net:null},
    // Robertet FY2024
    {id:16,cid:7,ticker:'RBT',name:'Robertet',scope:'Consolidated',year:2024,sales:872,gp:366,ebitda:170,ebit:138,net:97},
    // T. Hasegawa FY2024
    {id:17,cid:8,ticker:'4958',name:'T. Hasegawa',scope:'Consolidated',year:2024,sales:600,gp:210,ebitda:90,ebit:69,net:48},
    // Takasago FY Mar2024
    {id:18,cid:9,ticker:'4914',name:'Takasago',scope:'Consolidated',year:2024,sales:1351,gp:432,ebitda:165,ebit:117,net:90},

    // ── IFF Quarterly ──
    {id:101,cid:1,ticker:'IFF',name:'IFF',scope:'Consolidated',year:2024,quarter:'Q1',sales:2840,gp:1028,ebitda:543,ebit:270,net:55},
    {id:102,cid:1,ticker:'IFF',name:'IFF',scope:'Consolidated',year:2024,quarter:'Q2',sales:2948,gp:1074,ebitda:571,ebit:290,net:74},
    {id:103,cid:1,ticker:'IFF',name:'IFF',scope:'Consolidated',year:2024,quarter:'Q3',sales:2934,gp:1076,ebitda:562,ebit:282,net:68},
    {id:104,cid:1,ticker:'IFF',name:'IFF',scope:'Consolidated',year:2024,quarter:'Q4',sales:2762,gp:979,ebitda:534,ebit:258,net:46},
    {id:105,cid:1,ticker:'IFF',name:'IFF',scope:'Consolidated',year:2025,quarter:'Q1',sales:2780,gp:1005,ebitda:530,ebit:192,net:-42},
    {id:106,cid:1,ticker:'IFF',name:'IFF',scope:'Consolidated',year:2025,quarter:'Q2',sales:2765,gp:999,ebitda:528,ebit:185,net:-86},
    {id:107,cid:1,ticker:'IFF',name:'IFF',scope:'Consolidated',year:2025,quarter:'Q3',sales:2750,gp:994,ebitda:521,ebit:178,net:-112},
    {id:108,cid:1,ticker:'IFF',name:'IFF',scope:'Consolidated',year:2025,quarter:'Q4',sales:2595,gp:940,ebitda:507,ebit:145,net:-135},

    // ── Givaudan Semi-annual ⚠️ H1/H2 only ──
    {id:109,cid:2,ticker:'GIVN',name:'Givaudan',scope:'Consolidated ⚠️ H1/H2 only',year:2024,quarter:'H1',sales:3907,gp:1724,ebitda:930,ebit:737,net:576},
    {id:110,cid:2,ticker:'GIVN',name:'Givaudan',scope:'Consolidated ⚠️ H1/H2 only',year:2024,quarter:'H2',sales:4172,gp:1839,ebitda:994,ebit:780,net:612},
    {id:111,cid:2,ticker:'GIVN',name:'Givaudan',scope:'Consolidated ⚠️ H1/H2 only',year:2025,quarter:'H1',sales:3908,gp:1702,ebitda:915,ebit:724,net:563},
    {id:112,cid:2,ticker:'GIVN',name:'Givaudan',scope:'Consolidated ⚠️ H1/H2 only',year:2025,quarter:'H2',sales:4162,gp:1808,ebitda:976,ebit:767,net:594},

    // ── Symrise Semi-annual ⚠️ H1/H2 only ──
    {id:113,cid:3,ticker:'SY1',name:'Symrise',scope:'Consolidated ⚠️ H1/H2 only',year:2024,quarter:'H1',sales:2642,gp:1040,ebitda:549,ebit:381,net:251},
    {id:114,cid:3,ticker:'SY1',name:'Symrise',scope:'Consolidated ⚠️ H1/H2 only',year:2024,quarter:'H2',sales:2757,gp:1082,ebitda:567,ebit:394,net:265},
    {id:115,cid:3,ticker:'SY1',name:'Symrise',scope:'Consolidated ⚠️ H1/H2 only',year:2025,quarter:'H1',sales:2608,gp:1040,ebitda:570,ebit:381,net:102},
    {id:116,cid:3,ticker:'SY1',name:'Symrise',scope:'Consolidated ⚠️ H1/H2 only',year:2025,quarter:'H2',sales:2715,gp:1082,ebitda:595,ebit:395,net:146},

    // ── Kerry Semi-annual ⚠️ H1/H2 only ──
    {id:117,cid:5,ticker:'KRY',name:'Kerry Group',scope:'Consolidated ⚠️ H1/H2 only',year:2024,quarter:'H1',sales:3661,gp:1283,ebitda:644,ebit:465,net:361},
    {id:118,cid:5,ticker:'KRY',name:'Kerry Group',scope:'Consolidated ⚠️ H1/H2 only',year:2024,quarter:'H2',sales:3840,gp:1342,ebitda:707,ebit:507,net:395},
    {id:119,cid:5,ticker:'KRY',name:'Kerry Group',scope:'Consolidated ⚠️ H1/H2 only',year:2025,quarter:'H1',sales:3522,gp:1303,ebitda:628,ebit:453,net:334},
    {id:120,cid:5,ticker:'KRY',name:'Kerry Group',scope:'Consolidated ⚠️ H1/H2 only',year:2025,quarter:'H2',sales:3777,gp:1397,ebitda:677,ebit:487,net:368},

    // ── Sensient Quarterly ──
    {id:121,cid:6,ticker:'SXT',name:'Sensient Technologies',scope:'Consolidated',year:2024,quarter:'Q1',sales:376,gp:121,ebitda:59,ebit:45,net:33},
    {id:122,cid:6,ticker:'SXT',name:'Sensient Technologies',scope:'Consolidated',year:2024,quarter:'Q2',sales:393,gp:128,ebitda:63,ebit:48,net:36},
    {id:123,cid:6,ticker:'SXT',name:'Sensient Technologies',scope:'Consolidated',year:2024,quarter:'Q3',sales:399,gp:130,ebitda:65,ebit:51,net:37},
    {id:124,cid:6,ticker:'SXT',name:'Sensient Technologies',scope:'Consolidated',year:2024,quarter:'Q4',sales:389,gp:128,ebitda:63,ebit:48,net:34},
    {id:125,cid:6,ticker:'SXT',name:'Sensient Technologies',scope:'Consolidated',year:2025,quarter:'Q1',sales:394,gp:132,ebitda:76,ebit:54,net:39},
    {id:126,cid:6,ticker:'SXT',name:'Sensient Technologies',scope:'Consolidated',year:2025,quarter:'Q2',sales:409,gp:137,ebitda:81,ebit:57,net:41},
    {id:127,cid:6,ticker:'SXT',name:'Sensient Technologies',scope:'Consolidated',year:2025,quarter:'Q3',sales:411,gp:138,ebitda:81,ebit:57,net:42},
    {id:128,cid:6,ticker:'SXT',name:'Sensient Technologies',scope:'Consolidated',year:2025,quarter:'Q4',sales:398,gp:133,ebitda:77,ebit:54,net:38},

    // ── Robertet Semi-annual ⚠️ H1/H2 only ──
    {id:129,cid:7,ticker:'RBT',name:'Robertet',scope:'Consolidated ⚠️ H1/H2 only',year:2024,quarter:'H1',sales:423,gp:178,ebitda:82,ebit:67,net:48},
    {id:130,cid:7,ticker:'RBT',name:'Robertet',scope:'Consolidated ⚠️ H1/H2 only',year:2024,quarter:'H2',sales:449,gp:188,ebitda:88,ebit:71,net:49},
    {id:131,cid:7,ticker:'RBT',name:'Robertet',scope:'Consolidated ⚠️ H1/H2 only',year:2025,quarter:'H1',sales:443,gp:186,ebitda:91,ebit:74,net:53},
    {id:132,cid:7,ticker:'RBT',name:'Robertet',scope:'Consolidated ⚠️ H1/H2 only',year:2025,quarter:'H2',sales:468,gp:196,ebitda:97,ebit:79,net:59},

    // ── T. Hasegawa Quarterly ⚠️ FY ends September ──
    {id:133,cid:8,ticker:'4958',name:'T. Hasegawa',scope:'Consolidated ⚠️ FY ends Sep',year:2024,quarter:'Q1',sales:138,gp:49,ebitda:20,ebit:16,net:11},
    {id:134,cid:8,ticker:'4958',name:'T. Hasegawa',scope:'Consolidated ⚠️ FY ends Sep',year:2024,quarter:'Q2',sales:154,gp:54,ebitda:23,ebit:18,net:12},
    {id:135,cid:8,ticker:'4958',name:'T. Hasegawa',scope:'Consolidated ⚠️ FY ends Sep',year:2024,quarter:'Q3',sales:162,gp:57,ebitda:24,ebit:19,net:13},
    {id:136,cid:8,ticker:'4958',name:'T. Hasegawa',scope:'Consolidated ⚠️ FY ends Sep',year:2024,quarter:'Q4',sales:146,gp:50,ebitda:23,ebit:16,net:12},
    {id:137,cid:8,ticker:'4958',name:'T. Hasegawa',scope:'Consolidated ⚠️ FY ends Sep',year:2025,quarter:'Q1',sales:120,gp:42,ebitda:18,ebit:14,net:10},
    {id:138,cid:8,ticker:'4958',name:'T. Hasegawa',scope:'Consolidated ⚠️ FY ends Sep',year:2025,quarter:'Q2',sales:133,gp:47,ebitda:20,ebit:16,net:11},
    {id:139,cid:8,ticker:'4958',name:'T. Hasegawa',scope:'Consolidated ⚠️ FY ends Sep',year:2025,quarter:'Q3',sales:140,gp:49,ebitda:21,ebit:17,net:11},
    {id:140,cid:8,ticker:'4958',name:'T. Hasegawa',scope:'Consolidated ⚠️ FY ends Sep',year:2025,quarter:'Q4',sales:114,gp:40,ebitda:17,ebit:12,net:9},

    // ── Takasago Quarterly ⚠️ FY ends March ──
    {id:141,cid:9,ticker:'4914',name:'Takasago',scope:'Consolidated ⚠️ FY ends Mar',year:2024,quarter:'Q1',sales:316,gp:101,ebitda:37,ebit:26,net:20},
    {id:142,cid:9,ticker:'4914',name:'Takasago',scope:'Consolidated ⚠️ FY ends Mar',year:2024,quarter:'Q2',sales:341,gp:109,ebitda:42,ebit:30,net:23},
    {id:143,cid:9,ticker:'4914',name:'Takasago',scope:'Consolidated ⚠️ FY ends Mar',year:2024,quarter:'Q3',sales:358,gp:115,ebitda:45,ebit:32,net:25},
    {id:144,cid:9,ticker:'4914',name:'Takasago',scope:'Consolidated ⚠️ FY ends Mar',year:2024,quarter:'Q4',sales:336,gp:107,ebitda:41,ebit:29,net:22},
    {id:145,cid:9,ticker:'4914',name:'Takasago',scope:'Consolidated ⚠️ FY ends Mar',year:2025,quarter:'Q1',sales:378,gp:121,ebitda:49,ebit:35,net:27},
    {id:146,cid:9,ticker:'4914',name:'Takasago',scope:'Consolidated ⚠️ FY ends Mar',year:2025,quarter:'Q2',sales:405,gp:130,ebitda:53,ebit:38,net:29},
    {id:147,cid:9,ticker:'4914',name:'Takasago',scope:'Consolidated ⚠️ FY ends Mar',year:2025,quarter:'Q3',sales:421,gp:135,ebitda:55,ebit:40,net:30},
    {id:148,cid:9,ticker:'4914',name:'Takasago',scope:'Consolidated ⚠️ FY ends Mar',year:2025,quarter:'Q4',sales:382,gp:122,ebitda:50,ebit:32,net:24},

    // ── FY2025 actuals ──
    {id:19,cid:1,ticker:'IFF',name:'IFF',scope:'Consolidated',year:2025,sales:10890,gp:3938,ebitda:2086,ebit:700,net:-375},
    {id:20,cid:1,ticker:'IFF',name:'IFF',scope:'Taste',year:2025,sales:2480,gp:900,ebitda:478,ebit:340,net:null},
    {id:21,cid:1,ticker:'IFF',name:'IFF',scope:'Health & Biosciences',year:2025,sales:2280,gp:960,ebitda:594,ebit:450,net:null},
    {id:22,cid:1,ticker:'IFF',name:'IFF',scope:'Scent',year:2025,sales:2480,gp:990,ebitda:515,ebit:380,net:null},
    {id:23,cid:1,ticker:'IFF',name:'IFF',scope:'Food Ingredients',year:2025,sales:3280,gp:1050,ebitda:423,ebit:280,net:null},
    {id:24,cid:2,ticker:'GIVN',name:'Givaudan',scope:'Consolidated',year:2025,sales:8070,gp:3510,ebitda:1891,ebit:1491,net:1157},
    {id:25,cid:2,ticker:'GIVN',name:'Givaudan',scope:'Fragrance & Beauty',year:2025,sales:4136,gp:1790,ebitda:1063,ebit:885,net:null},
    {id:26,cid:2,ticker:'GIVN',name:'Givaudan',scope:'Taste & Wellbeing',year:2025,sales:3934,gp:1720,ebitda:827,ebit:605,net:null},
    {id:27,cid:3,ticker:'SY1',name:'Symrise',scope:'Consolidated',year:2025,sales:5323,gp:2122,ebitda:1165,ebit:776,net:248},
    {id:28,cid:3,ticker:'SY1',name:'Symrise',scope:'Taste, Nutrition & Health',year:2025,sales:3270,gp:1307,ebitda:779,ebit:540,net:null},
    {id:29,cid:3,ticker:'SY1',name:'Symrise',scope:'Scent & Care',year:2025,sales:2053,gp:815,ebitda:386,ebit:236,net:null},
    {id:30,cid:5,ticker:'KRY',name:'Kerry Group',scope:'Consolidated',year:2025,sales:7299,gp:2700,ebitda:1305,ebit:940,net:702},
    {id:31,cid:6,ticker:'SXT',name:'Sensient Technologies',scope:'Consolidated',year:2025,sales:1612,gp:540,ebitda:315,ebit:222,net:160},
    {id:32,cid:7,ticker:'RBT',name:'Robertet',scope:'Consolidated',year:2025,sales:911,gp:382,ebitda:188,ebit:153,net:112},
    {id:33,cid:8,ticker:'4958',name:'T. Hasegawa',scope:'Consolidated ⚠️ FY ends Sep',year:2025,sales:507,gp:178,ebitda:76,ebit:59,net:41},
    {id:34,cid:9,ticker:'4914',name:'Takasago',scope:'Consolidated ⚠️ FY ends Mar',year:2025,sales:1586,gp:508,ebitda:207,ebit:145,net:110},
  ],
}

export default DEFAULTS
