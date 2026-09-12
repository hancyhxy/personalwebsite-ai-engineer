// The Studio — project data. 19 entries across four disciplines.
// Cover paths point to thumbs when available, else to a discipline-coloured placeholder.
(function (w) {
    w.STUDIO_PROJECTS = [
        // Product / UX (8)
        {
            id: 'claude-figma',
            cover: './assets/images/portfolio-ai-assistant/cover.png',
            title: 'Claude × Figma', subtitle: 'Building an AI-native portfolio plugin',
            discipline: 'Product', year: '2026', place: 'Sydney',
            kind: 'Case study', tag: 'AI × Tools', accent: 'ochre',
            note: 'The one that started this whole site.',
            pin: { x: 12, y: 8, rot: -3 }
        },
        {
            id: 'friendup',
            cover: './assets/images/thumbs/friendup-social-app-thumb.jpg',
            title: 'FriendUp', subtitle: 'Map-based social app for new arrivals',
            discipline: 'Product', year: '2024', place: 'Sydney',
            kind: 'Case study', tag: 'UX · Social',
            note: 'Loneliness as a design brief.',
            pin: { x: 38, y: 14, rot: 2 }
        },
        {
            id: 'rider-dispatch',
            cover: './assets/images/thumbs/Rider-Dispatch-Scheduling-Platform-thumb.jpg',
            title: 'Rider Dispatch', subtitle: 'Operations platform for food delivery fleet',
            discipline: 'Product', year: '2023', place: 'Hangzhou',
            kind: 'Case study', tag: 'Ops · B2B',
            note: '2,000 riders. 11 cities. One screen.',
            pin: { x: 64, y: 6, rot: -1 }
        },
        {
            id: 'food-delivery',
            cover: './assets/images/thumbs/Content-Driven-Food-Delivery-Experience-thumb.jpg',
            title: 'Content-Driven Food', subtitle: 'A new discovery layer inside a super-app',
            discipline: 'Product', year: '2023', place: 'Hangzhou',
            kind: 'Case study', tag: 'Content · Consumer',
            note: 'Shot with a stylist. Ate everything.',
            pin: { x: 18, y: 38, rot: 1 }
        },
        {
            id: 'alibaba-help',
            cover: './assets/images/thumbs/Re-Architecting-Alibaba-Help-Center-for-Global-Consistency-thumb.jpg',
            title: 'Alibaba Help Center', subtitle: 'Re-architected for SKUs across 12 locales',
            discipline: 'Product', year: '2022', place: 'Hangzhou',
            kind: 'Case study', tag: 'IA · Localization',
            note: 'Information architecture as empathy.',
            pin: { x: 44, y: 36, rot: -2 }
        },
        {
            id: 'kol-growth',
            cover: './assets/images/thumbs/KOL-Growth-Strategy-thumb.jpg',
            title: 'KOL Growth Strategy', subtitle: 'Creator tools, content strategy, brand',
            discipline: 'Product', year: '2022', place: 'Hangzhou',
            kind: 'Case study', tag: 'Strategy',
            note: '',
            pin: { x: 70, y: 40, rot: 3 }
        },
        {
            id: 'cs-chatbot',
            cover: './assets/images/thumbs/customer-service-workspace-chatbot-thumb.jpg',
            title: 'Customer Service AI', subtitle: 'Workspace + chatbot for human agents',
            discipline: 'Product', year: '2021', place: 'Hangzhou',
            kind: 'Case study', tag: 'AI · B2B',
            note: 'Before it was cool.',
            pin: { x: 12, y: 62, rot: -1 }
        },
        {
            id: 'million-audition',
            cover: './assets/images/thumbs/musically-1m-audition-thumb.jpg',
            title: 'Million Audition', subtitle: 'Live-streaming discovery for Musical.ly',
            discipline: 'Product', year: '2019', place: 'Shanghai',
            kind: 'Case study', tag: 'Consumer · Live',
            note: 'First job. Still proud.',
            pin: { x: 84, y: 66, rot: 2 }
        },

        // Experiential (4)
        {
            id: 'power-station',
            cover: './assets/images/thumbs/my-friends-are-my-power-station-thumb.jpg',
            title: 'My Friends Are My Power Station', subtitle: 'Projection mapping, urban culture',
            discipline: 'Experiential', year: '2025', place: 'Sydney',
            kind: 'Installation', tag: 'Install · Projection',
            note: 'A living, breathing love letter.',
            pin: { x: 40, y: 62, rot: 0 }
        },
        {
            id: 'museum-game',
            cover: './assets/images/thumbs/gamify-museum-experience-thumb.jpg',
            title: 'Design Museum as a Game', subtitle: 'Speculative museum tour',
            discipline: 'Experiential', year: '2025', place: 'Sydney',
            kind: 'Speculative', tag: 'Museum · Play',
            note: '',
            pin: { x: 66, y: 64, rot: -3 }
        },
        {
            id: 'drum-kit',
            cover: './assets/images/thumbs/interactive-virtual-drum-kit-thumb.jpg',
            title: 'Interactive Virtual Drum Kit', subtitle: 'Mediapipe, HTML5, Pose, interactive',
            discipline: 'Experiential', year: '2025', place: 'Sydney',
            kind: 'Prototype', tag: 'Code · Play',
            note: 'Bang bang.',
            pin: { x: 28, y: 86, rot: 4 }
        },
        {
            id: 'field-memory',
            cover: './assets/images/thumbs/food-memory-thumb.jpg',
            title: 'Food Memory', subtitle: 'Spatial video, food design, soft tech',
            discipline: 'Experiential', year: '2024', place: 'Sydney',
            kind: 'Installation', tag: 'Spatial · Food',
            note: 'My grandmother\u2019s kitchen, rebuilt.',
            pin: { x: 54, y: 88, rot: -2 }
        },

        // Content / Strategy (3)
        {
            id: 'oscars-biased',
            cover: './assets/images/thumbs/how-are-oscars-biased-thumb.jpg',
            title: 'How Are Oscars Biased?', subtitle: 'Data vis, scrollytelling',
            discipline: 'Content', year: '2024', place: 'Sydney',
            kind: 'Article', tag: 'Data · Narrative',
            note: '',
            pin: { x: 78, y: 86, rot: 1 }
        },
        {
            id: 'diasporic-kitchen',
            cover: '',
            title: 'Diasporic Kitchen', subtitle: 'Essay + illustration series',
            discipline: 'Content', year: '2024', place: 'Sydney',
            kind: 'Writing', tag: 'Essay',
            note: 'On cooking alone in a new country.',
            pin: { x: 6, y: 106, rot: -1 }
        },
        {
            id: 'sub-thoughts',
            cover: '',
            title: 'Sub-thoughts', subtitle: 'An occasional newsletter',
            discipline: 'Content', year: '—', place: 'Always',
            kind: 'Writing', tag: 'Newsletter',
            note: '',
            pin: { x: 32, y: 108, rot: 2 }
        },

        // Visual / Brand (4)
        {
            id: 'guide-digital',
            cover: '',
            title: "A Junior's Guide to Digital Design", subtitle: 'Self-published zine',
            discipline: 'Visual', year: '2023', place: 'Hangzhou',
            kind: 'Zine', tag: 'Editorial',
            note: '',
            pin: { x: 58, y: 108, rot: -3 }
        },
        {
            id: 'coffee-brand',
            cover: './assets/images/thumbs/Farmer-Coffee-Logo-thumb.jpg',
            title: 'Second Winter Coffee', subtitle: 'Identity for a Newtown café',
            discipline: 'Visual', year: '2025', place: 'Sydney',
            kind: 'Identity', tag: 'Brand',
            note: '',
            pin: { x: 82, y: 108, rot: 2 }
        },
        {
            id: 'wayfinding',
            cover: '',
            title: 'UTS Wayfinding', subtitle: 'Student-led signage exploration',
            discipline: 'Visual', year: '2024', place: 'Sydney',
            kind: 'Environmental', tag: 'Signage',
            note: '',
            pin: { x: 22, y: 128, rot: 1 }
        },
        {
            id: 'poster-series',
            cover: './assets/images/city-jazz-hiden/jazzpop1.png',
            title: 'Monthly Poster Series', subtitle: 'One poster, one month, for a year',
            discipline: 'Visual', year: '2023—24', place: 'Everywhere',
            kind: 'Series', tag: 'Poster',
            note: '12 months. 12 posters. All printed.',
            pin: { x: 50, y: 130, rot: -2 }
        }
    ];

    w.STUDIO_DISCIPLINES = [
        { key: 'Product',      label: 'Product / UX',   count: 8 },
        { key: 'Experiential', label: 'Experiential',   count: 4 },
        { key: 'Content',      label: 'Content',        count: 3 },
        { key: 'Visual',       label: 'Visual / Brand', count: 4 }
    ];
})(window);
