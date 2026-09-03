// All website copy in one place so wording can be edited without touching layout code.
// Voice: plain, warm, honest. Educational, never diagnostic.

export const org = {
  name: 'Don’t Fret the Gut',
  shortName: 'dftg',
  legalName: 'Don’t Fret the Gut Foundation',
  tagline: 'Digestive health, spoken plainly',
  mission:
    'We’re making life with IBD and IBS feel less isolating, through trustworthy education, honest community, and a little more ease.',
  email: 'hello@dontfretthegut.org',
  instagram: 'https://www.instagram.com/dontfretthegutfoundation/',
  instagramHandle: '@dontfretthegutfoundation',
  established: '2024',
  reviewNote:
    'Educational content is reviewed against established health sources, including NIDDK, the Crohn’s & Colitis Foundation, and the Rome Foundation.',
  disclaimer:
    'Everything on this site is general education. It is not medical advice, it does not diagnose any condition, and it does not replace care from a qualified clinician. If you have new, severe, or persistent symptoms, please talk with a healthcare professional. In an emergency, call 911.',
};

export const nav = [
  { label: 'Home', to: '/' },
  { label: 'Learn', to: '/learn' },
  { label: 'Community', to: '/community' },
  { label: 'Get Involved', to: '/get-involved' },
  { label: 'Shop', to: '/shop' },
];

export const hero = {
  eyebrow: 'Digestive health, spoken plainly',
  titleLead: 'Your gut story deserves to be',
  titleAccent: 'heard.',
  body: org.mission,
  primary: { label: 'Start learning', to: '/learn' },
  secondary: { label: 'Find your people', to: '/community' },
  pull: 'You are not difficult. Your symptoms are real.',
  madeWith: 'Made with lived experience.',
  madeWithSub: 'For every body, every question, every day.',
  arch: {
    eyebrow: 'Live 3D',
    title: 'A healthy gut, in motion',
    body: 'Gentle waves move food along a calm pink lining. This is what the rest of the site helps you understand.',
    cta: { label: 'See what changes in IBD', to: '/learn/ibd' },
  },
};

export const ticker = ['Real stories', 'Better days', 'Less stigma', 'More answers', 'Plain language', 'You are not alone'];

export const learn = {
  index: '01',
  label: 'Learn',
  eyebrow: 'Start with understanding',
  titleLead: 'Different conditions.',
  titleAccent: 'Shared need for care.',
  body:
    'Digestive symptoms can affect how we eat, work, travel, and connect. Clear information is a powerful first step toward advocating for yourself.',
  link: { label: 'Explore the resource library', to: '/learn' },
  conditions: [
    {
      slug: 'ibd',
      code: 'IBD',
      name: 'Inflammatory Bowel Disease',
      tone: 'forest' as const,
      summary:
        'IBD includes Crohn’s disease and ulcerative colitis: chronic conditions involving inflammation and damage in the digestive tract.',
      tags: ['Visible inflammation', 'Immune-mediated', 'Requires medical care'],
      cta: 'Understand IBD',
      to: '/learn/ibd',
    },
    {
      slug: 'ibs',
      code: 'IBS',
      name: 'Irritable Bowel Syndrome',
      tone: 'peach' as const,
      summary:
        'IBS is a disorder of gut–brain interaction that can cause recurring pain and bowel changes without visible digestive-tract damage.',
      tags: ['No visible damage', 'Gut–brain interaction', 'Symptoms are real'],
      cta: 'Understand IBS',
      to: '/learn/ibs',
    },
  ],
};

export const comparison = {
  eyebrow: 'IBD vs. IBS',
  title: ['Similar names.', 'Meaningfully different.'],
  columns: ['At a glance', 'IBD', 'IBS'],
  rows: [
    ['Inflammation', 'Present', 'Not visible'],
    ['Tissue damage', 'Can occur', 'Does not occur'],
    ['How it is found', 'Blood and stool tests, scopes, imaging', 'Symptom pattern, after other causes are ruled out'],
    ['Common overlap', 'Pain, bowel changes, fatigue', 'Pain, bowel changes, bloating'],
    ['Both are real', 'Yes', 'Yes'],
  ],
  note:
    'This is a simplified educational comparison, not a diagnostic tool. Similar symptoms can have many causes. Please speak with a qualified healthcare professional about new, severe, or persistent symptoms.',
};

export interface Guide {
  slug: string;
  tag: string;
  title: string;
  blurb: string;
  minutes: number;
  tone: 'forest' | 'peach' | 'sage';
  badge?: string;
  sections: { heading: string; body: string }[];
}

export const guides: Guide[] = [
  {
    slug: 'newly-diagnosed-crohns',
    tag: 'Newly diagnosed',
    badge: 'Start here',
    title: 'What I wish I knew when I first heard “Crohn’s disease”',
    blurb: 'A grounded starting point for the questions, feelings, and next steps that may follow a diagnosis.',
    minutes: 6,
    tone: 'forest',
    sections: [
      {
        heading: 'It is not something you caused',
        body: 'Crohn’s is an immune condition. Stress, food choices, and personality do not cause it. Some things can make symptoms louder, and you will learn what those are for you over time.',
      },
      {
        heading: 'Your first weeks are for questions, not decisions',
        body: 'Write down every question, even the ones that feel small. Where is my inflammation? What does my medicine do? What should make me call you? Bring the list to every visit.',
      },
      {
        heading: 'Remission is the goal, and it is realistic',
        body: 'Treatment aims to calm inflammation and heal the lining, not only to quiet symptoms. Many people have long stretches with few or no symptoms.',
      },
      {
        heading: 'Find one person who gets it',
        body: 'A friend with IBD, a support group, or an online community can make the difference between coping alone and coping together.',
      },
    ],
  },
  {
    slug: 'prepare-for-gi-appointment',
    tag: 'Self-advocacy',
    title: 'How to prepare for a GI appointment',
    blurb: 'A simple symptom log and question list can help you use limited appointment time well.',
    minutes: 4,
    tone: 'peach',
    sections: [
      {
        heading: 'Keep a two-week log',
        body: 'Note bowel movements, pain (where and how strong), blood, urgency, fever, weight, sleep, and anything that clearly made things better or worse.',
      },
      {
        heading: 'Bring your top three questions',
        body: 'Lead with the one that worries you most. If you run out of time, ask how to send the rest through the patient portal.',
      },
      {
        heading: 'Ask what the plan is waiting on',
        body: 'Every plan has a next checkpoint: a lab result, a scope, a medicine reaching full effect. Knowing the checkpoint makes waiting easier.',
      },
    ],
  },
  {
    slug: 'fatigue-is-more-than-tired',
    tag: 'Everyday life',
    title: 'When fatigue is more than feeling tired',
    blurb: 'Why digestive conditions can drain energy, and ways to talk about it with your care team.',
    minutes: 5,
    tone: 'sage',
    sections: [
      {
        heading: 'Fatigue is a symptom, not a character flaw',
        body: 'Inflammation, anemia, poor sleep, low iron or B12, and the sheer work of managing a condition all cost energy.',
      },
      {
        heading: 'Name it in numbers',
        body: 'Tell your clinician how many good hours you get in a day, and what you had to skip this week. Numbers are easier to act on than “I’m tired”.',
      },
      {
        heading: 'Small, kind adjustments count',
        body: 'Shorter blocks of activity, protected rest, and asking for accommodations at work or school are strategies, not surrender.',
      },
    ],
  },
];

export const resources = {
  index: '02',
  label: 'Resources',
  titleLead: 'Information for',
  titleAccent: 'real life.',
  link: { label: 'Get new guides by email', to: '/#newsletter' },
  note: org.reviewNote,
};

export const explainerSection = {
  eyebrow: 'Inside the gut',
  titleLead: 'See IBD, not just',
  titleAccent: 'read about it.',
  body:
    'A guided 3D tour of the digestive tract: what a healthy gut looks like, where Crohn’s disease and ulcerative colitis show up, and what a flare and remission actually mean.',
  cta: { label: 'Open the full 3D explainer', to: '/learn/ibd' },
  chapters: ['A healthy gut', 'What is IBD?', 'Crohn’s disease', 'Ulcerative colitis', 'Flares & remission', 'Next steps'],
};

export const community = {
  index: '03',
  label: 'Community',
  titleLead: 'There is strength in being',
  titleAccent: 'seen.',
  body:
    'Patient stories make room for the things a brochure cannot: the complicated, funny, frustrating, hopeful reality of living with digestive illness.',
  cta: { label: 'Share your story', to: '/community#share' },
  note: 'Stories shown are representative editorial examples and will be replaced with community submissions shared with consent.',
  stories: [
    {
      quote: 'I stopped planning my life around hiding. Community helped me name what I needed.',
      name: 'Maya, 26',
      living: 'Living with ulcerative colitis',
      tone: 'ivory' as const,
    },
    {
      quote: 'IBS is invisible, but the way it changed my routine wasn’t. Being believed mattered.',
      name: 'Jordan, 31',
      living: 'Living with IBS',
      tone: 'sage' as const,
    },
    {
      quote: 'I learned that asking for accommodations was not giving up. It was making room to keep going.',
      name: 'Sam, 22',
      living: 'Living with Crohn’s disease',
      tone: 'peach' as const,
    },
  ],
  share: {
    title: 'Share your story',
    body:
      'Your words might be the ones someone needs this week. Tell us as much or as little as you like. We only publish with your written consent, and you can use a first name or stay anonymous.',
    prompts: ['What do you wish people understood?', 'What helped on a hard day?', 'What would you tell yourself at diagnosis?'],
    cta: 'Send your story by email',
  },
};

export const getInvolved = {
  index: '04',
  label: 'Get involved',
  titleLead: 'Turn care into',
  titleAccent: 'collective action.',
  body: 'Whether you have ten minutes, a new idea, or a whole team, we can make the conversation bigger together.',
  ways: [
    { title: 'Donate', body: 'Help fund education, community programming, and awareness.', to: '/get-involved#donate' },
    { title: 'Volunteer', body: 'Give time, expertise, or a helping hand at future events.', to: 'mailto' },
    { title: 'Partner', body: 'Build a thoughtful collaboration with your clinic or brand.', to: 'mailto' },
    { title: 'Fundraise', body: 'Start a birthday, campus, or community campaign.', to: 'mailto' },
  ],
  donate: {
    eyebrow: 'Small gifts. Real momentum.',
    title: 'Help someone feel less alone in their diagnosis.',
    body: 'Your support helps us create plain-language education, amplify patient voices, and build digestive-health programs rooted in dignity.',
    label: 'Choose a gift',
    tiers: [25, 50, 100, 250],
    defaultTier: 50,
    note:
      'Secure donation processing will be connected before launch. Donation deductibility depends on the organization’s finalized tax-exempt status; receipts and required disclosures will be provided.',
  },
};

export interface Product {
  slug: string;
  name: string;
  price: number;
  meta: string;
  color: 'onyx' | 'ivory' | 'forest' | 'midnight';
  category: 'Tees' | 'Fleece' | 'Outerwear' | 'Bottoms';
  badge?: string;
}

export const shop = {
  index: '05',
  label: 'The core collection',
  titleLines: ['Wear what', 'you stand for.'],
  body:
    'A restrained streetwear uniform in washed black, soft ivory, deep forest, and midnight navy. Minimal from the front, expressive where it counts.',
  categories: ['All', 'Tees', 'Fleece', 'Outerwear', 'Bottoms'] as const,
  products: [
    { slug: 'washed-script-tee', name: 'Washed Script Tee', price: 48, meta: 'Washed black · Oversized fit · XS–3XL', color: 'onyx', category: 'Tees', badge: 'Signature' },
    { slug: 'ivory-core-tee', name: 'Ivory Core Tee', price: 42, meta: 'Soft ivory · Relaxed fit · XS–3XL', color: 'ivory', category: 'Tees' },
    { slug: 'forest-signature-hoodie', name: 'Forest Signature Hoodie', price: 88, meta: 'Deep forest · Heavyweight fleece · XS–3XL', color: 'forest', category: 'Fleece', badge: 'Bestseller' },
    { slug: 'midnight-track-jacket', name: 'Midnight Track Jacket', price: 118, meta: 'Midnight navy · Water-resistant · XS–3XL', color: 'midnight', category: 'Outerwear', badge: 'New' },
    { slug: 'onyx-wide-leg-sweatpant', name: 'Onyx Wide-Leg Sweatpant', price: 78, meta: 'Washed black · Relaxed leg · XS–3XL', color: 'onyx', category: 'Bottoms' },
    { slug: 'midnight-everyday-short', name: 'Midnight Everyday Short', price: 58, meta: 'Midnight navy · 7" inseam · XS–3XL', color: 'midnight', category: 'Bottoms' },
  ] as Product[],
  proceeds: {
    stat: 100,
    statLabel: 'of net shop proceeds support the mission.',
    pillars: [
      { label: 'Education', body: 'Evidence-informed guides and accessible resources.' },
      { label: 'Community', body: 'Patient stories, support programming, and outreach.' },
      { label: 'Awareness', body: 'Campaigns that reduce stigma and invite conversation.' },
    ],
    note: 'Net proceeds means what remains after production, fulfillment, and payment costs. A yearly summary will be published on this site.',
  },
  faq: [
    { q: 'How will fulfillment work?', a: 'Orders will be printed and shipped by a print-on-demand partner so we never hold inventory. Checkout will be connected before launch.' },
    { q: 'Shipping & tracking', a: 'US orders ship in 3–7 business days with tracking sent by email. International shipping will follow once launch volume is clear.' },
    { q: 'Returns & exchanges', a: 'Unworn items can be exchanged for size within 30 days. Misprints and defects are replaced at no cost.' },
    { q: 'Responsible production', a: 'Garments are made to order to avoid waste, on blanks from suppliers with published labor and materials standards.' },
  ],
  note: 'Product photos are placeholders until the first samples are shot. Prices are targets and may change before launch.',
};

export const newsletter = {
  badge: 'Gut check',
  eyebrow: 'A thoughtful note, not a sales pitch',
  titleLead: 'Good information.',
  titleAccent: 'Gentler delivery.',
  body: 'Monthly education, honest stories, and small ways to care for yourself and the community. Unsubscribe any time.',
  cta: 'Join the newsletter',
  privacy: 'We never share your email. Signup will be connected to a newsletter provider before launch.',
};

export const footer = {
  columns: [
    { title: 'Learn', links: [{ label: 'Understand IBD', to: '/learn/ibd' }, { label: 'Understand IBS', to: '/learn/ibs' }, { label: 'Guides', to: '/learn#guides' }, { label: '3D explainer', to: '/learn/ibd#explainer' }] },
    { title: 'Community', links: [{ label: 'Stories', to: '/community' }, { label: 'Share your story', to: '/community#share' }] },
    { title: 'Support', links: [{ label: 'Donate', to: '/get-involved#donate' }, { label: 'Volunteer', to: '/get-involved' }, { label: 'Shop', to: '/shop' }] },
  ],
  fine: 'Don’t Fret the Gut is an education and community project. Content is not medical advice.',
};

// ---------------------------------------------------------------------------
// Understand IBD page: written companion to the 3D explainer.
// ---------------------------------------------------------------------------
export const ibdPage = {
  eyebrow: 'Understand IBD',
  titleLead: 'Inflammation you can',
  titleAccent: 'finally picture.',
  intro:
    'Inflammatory bowel disease is a group of long-term conditions in which the immune system keeps the lining of the digestive tract inflamed. The two main types are Crohn’s disease and ulcerative colitis. Press play below to see where each one happens, then read on for the plain-language version.',
  explainerNote: 'Six chapters, about 70 seconds. Pause any time and drag to look around. The bowel-wall inset shows which layers are involved.',
  sections: [
    {
      heading: 'What IBD is, and is not',
      body: 'IBD is an immune condition, not an infection and not a reaction to stress or diet. It is different from irritable bowel syndrome (IBS), which causes real symptoms without visible inflammation. IBD looks different in every person; the patterns below are the most common ones.',
    },
    {
      heading: 'Crohn’s disease',
      body: 'Crohn’s can affect any part of the digestive tract, from mouth to anus, but most often involves the end of the small intestine (terminal ileum) and the start of the colon. Inflamed patches sit next to healthy stretches, called skip lesions, and inflammation can go through the full thickness of the bowel wall. Over time that can cause narrow spots (strictures) or small tunnels (fistulas), and problems around the anus.',
    },
    {
      heading: 'Ulcerative colitis',
      body: 'Ulcerative colitis affects only the colon and rectum. It starts in the rectum and spreads upward in one continuous stretch, staying in the inner lining. The irritated lining develops small ulcers, which is why bleeding, urgency, and diarrhea are so common. Doctors describe how far it reaches: proctitis (rectum only), left-sided colitis, or extensive colitis.',
    },
    {
      heading: 'Flares and remission',
      body: 'IBD comes in waves. A flare is when inflammation and symptoms are active; remission is when the lining calms and heals. Modern treatment aims for remission you can see on a scope, not only fewer symptoms, and many people have long stretches with few or none.',
    },
    {
      heading: 'How IBD is diagnosed',
      body: 'Usually with a combination of blood tests, a stool test for inflammation (calprotectin), a colonoscopy with small tissue samples, and sometimes imaging of the small bowel. No single test does it alone, and the process can take a few visits.',
    },
    {
      heading: 'When to seek care right away',
      body: 'Heavy bleeding from the rectum, severe belly pain, a high fever, or not being able to keep fluids down need urgent care. Call your clinician or go to an emergency room.',
    },
  ],
  faq: [
    { q: 'Is IBD contagious or inherited?', a: 'It is not contagious. Genes play a part, and having a close relative with IBD raises the chance somewhat, but most people with IBD have no family history.' },
    { q: 'Did something I ate cause this?', a: 'No. Food does not cause IBD. Some foods can make symptoms louder during a flare, and a dietitian who knows IBD can help you find your own pattern without unnecessary restriction.' },
    { q: 'Will I need surgery?', a: 'Some people do, especially with Crohn’s, and outcomes are far better than they were a generation ago. Many people never need it. This is a conversation for your gastroenterologist.' },
    { q: 'Can I still travel, work, and have a family?', a: 'Yes. Planning helps: knowing where bathrooms are, carrying medicine, and having a flare plan. Pregnancy is possible and usually goes well when IBD is in remission; talk with your care team early.' },
  ],
  sources: [
    { name: 'Crohn’s & Colitis Foundation', url: 'https://www.crohnscolitisfoundation.org/what-is-ibd' },
    { name: 'NIDDK: Crohn’s disease', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/crohns-disease' },
    { name: 'NIDDK: Ulcerative colitis', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/ulcerative-colitis' },
    { name: 'American College of Gastroenterology', url: 'https://gi.org/topics/inflammatory-bowel-disease/' },
  ],
};

export const ibsPage = {
  eyebrow: 'Understand IBS',
  titleLead: 'Invisible on a scan.',
  titleAccent: 'Very real in a life.',
  intro:
    'Irritable bowel syndrome is a disorder of gut–brain interaction. The gut and the nervous system talk constantly; in IBS that conversation becomes oversensitive, so normal digestion can feel painful and bowel habits change. Tests come back normal, and the symptoms are still real.',
  sections: [
    {
      heading: 'What IBS is',
      body: 'IBS causes recurring belly pain linked to bowel movements, along with changes in how often you go or what stool looks like. It is grouped by the main pattern: constipation (IBS-C), diarrhea (IBS-D), or mixed (IBS-M). It does not cause inflammation or damage to the bowel.',
    },
    {
      heading: 'Why it happens',
      body: 'Several things add up: a gut that senses normal stretch as pain, movement that is too fast or too slow, changes in gut bacteria, and a nervous system on high alert. It often begins after an infection or a stressful period, which is about timing, not blame.',
    },
    {
      heading: 'How it is diagnosed',
      body: 'IBS is diagnosed from the symptom pattern using criteria doctors call Rome IV, after other causes have been considered. Simple blood and stool tests help rule out celiac disease and IBD. Red flags such as bleeding, weight loss, fever, or symptoms that wake you at night always deserve a closer look.',
    },
    {
      heading: 'What helps',
      body: 'Different things for different people: regular meals, fibre adjustments, a time-limited low-FODMAP trial with a dietitian, gut-directed therapies such as CBT or hypnotherapy, movement and sleep, and medicines aimed at the main symptom. Progress is usually gradual and real.',
    },
    {
      heading: 'You are not making this up',
      body: 'IBS is one of the most common digestive conditions in the world. A normal scope does not mean nothing is wrong; it means the problem is in how the gut and brain communicate, not in the tissue.',
    },
  ],
  faq: [
    { q: 'Can IBS turn into IBD or cancer?', a: 'No. IBS does not damage the bowel and does not become IBD or cancer. People can have both IBS and IBD, which is one reason to keep talking with your clinician if symptoms change.' },
    { q: 'Is it all in my head?', a: 'The pain is produced by real signals between the gut and the brain. Therapies that calm that pathway work because the pathway is real, not because the symptoms are imaginary.' },
    { q: 'Should I cut out gluten or dairy?', a: 'Not automatically. Restrictive diets can cause more problems than they solve. A short, structured trial guided by a dietitian tells you what actually matters for you.' },
  ],
  sources: [
    { name: 'Rome Foundation', url: 'https://theromefoundation.org/' },
    { name: 'NIDDK: Irritable bowel syndrome', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/irritable-bowel-syndrome' },
    { name: 'American College of Gastroenterology', url: 'https://gi.org/topics/irritable-bowel-syndrome/' },
  ],
};
