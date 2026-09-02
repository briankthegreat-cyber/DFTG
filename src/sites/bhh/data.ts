import type { LucideIcon } from 'lucide-react';
import {
  Stethoscope,
  ClipboardCheck,
  Scale,
  Droplets,
  Zap,
  Syringe,
  Hand,
  Footprints,
  HeartPulse,
  ShieldCheck,
  Video,
  Building2
} from 'lucide-react';

export const clinic = {
  name: 'Beverly Hills Health',
  legalName: 'Beverly Hills Health, Inc.',
  tagline: 'Personalized primary care and wellness in Beverly Hills and West Los Angeles.',
  phone: '(310) 274-9500',
  phoneHref: 'tel:+13102749500',
  fax: '(310) 274-7018',
  address: {
    line1: '9200 W. Pico Blvd.',
    line2: 'Los Angeles, CA 90035',
    mapsHref: 'https://www.google.com/maps/search/?api=1&query=9200+W+Pico+Blvd+Los+Angeles+CA+90035'
  },
  hours: [
    { day: 'Monday – Friday', time: '9:00 AM – 5:00 PM' },
    { day: 'Saturday', time: 'Closed' },
    { day: 'Sunday', time: 'Closed' }
  ],
  bookingHref: 'https://www.zocdoc.com/practice/beverly-hills-health-64574',
  social: {
    instagram: 'https://www.instagram.com/beverlyhillshealth',
    facebook: 'https://www.facebook.com/beverlyhillshealth/',
    yelp: 'https://www.yelp.com/biz/beverly-hills-health-los-angeles'
  }
};

export const doctor = {
  name: 'Dr. Michael Katiraie, DO',
  role: 'Medical Director & CEO',
  board: 'Board Certified, American Board of Family Medicine',
  school: 'Western University of Health Sciences',
  residency: 'Chino Valley Medical Center, Chief Resident',
  years: 15,
  photo: '/bhh/dr-katiraie.svg',
  intro:
    'Dr. Katiraie built Beverly Hills Health around a simple idea: patients deserve a physician who knows them, answers them, and treats the whole person. His practice blends evidence-based primary care with modern wellness medicine, so the same doctor who manages your blood pressure can also guide your weight, energy, and recovery.'
};

export type Service = {
  slug: string;
  name: string;
  short: string;
  tagline: string;
  icon: LucideIcon;
  colors: [string, string, string];
  description: string[];
  highlights: string[];
  faq: { q: string; a: string }[];
  featured?: boolean;
};

export const services: Service[] = [
  {
    slug: 'primary-care',
    name: 'Primary Care',
    short: 'Your physician for everyday health, chronic conditions, and the moments in between.',
    tagline: 'One doctor. The whole picture.',
    icon: Stethoscope,
    colors: ['#d8b46a', '#5ee7d3', '#d8b46a'],
    featured: true,
    description: [
      'Primary care at Beverly Hills Health means an ongoing relationship with a board-certified family physician who manages your health over time, not a different provider at every visit.',
      'From sick visits and screenings to long-term management of blood pressure, diabetes, cholesterol, and thyroid conditions, care is coordinated in one place with specialist referrals when they are truly needed.'
    ],
    highlights: [
      'Chronic condition management with clear, written plans',
      'Same-physician continuity at every visit',
      'Coordinated specialist referrals and follow-up',
      'In-person and telehealth appointments'
    ],
    faq: [
      {
        q: 'Do you accept new patients?',
        a: 'Yes. New patients can book online or call the office, and most are seen within the same week.'
      },
      {
        q: 'Which insurance plans do you accept?',
        a: 'We work with most major PPO plans and Medicare. Call the office with your plan details and our team will confirm coverage before your visit.'
      },
      {
        q: 'Can I be seen the same day if I am sick?',
        a: 'We reserve time each day for acute visits. Call in the morning and we will do our best to see you the same day, in person or by video.'
      }
    ]
  },
  {
    slug: 'annual-physical',
    name: 'Annual Physical',
    short: 'A comprehensive, unhurried exam with labs, screening, and a personalized prevention plan.',
    tagline: 'Prevention, done properly.',
    icon: ClipboardCheck,
    colors: ['#5ee7d3', '#d8b46a', '#5ee7d3'],
    description: [
      'Your annual physical is the most valuable hour you will spend on your health all year. We take the time to review your history, screen for what matters at your age and risk level, and set goals you can actually act on.',
      'Visits include a full examination, age-appropriate screening labs, vaccination review, and a written summary you can keep.'
    ],
    highlights: [
      'Full head-to-toe examination',
      'Screening labs and cardiovascular risk review',
      'Vaccination and cancer screening planning',
      'Written prevention plan delivered after your visit'
    ],
    faq: [
      {
        q: 'How long is the visit?',
        a: 'Plan for 45 to 60 minutes. We never rush the annual exam.'
      },
      {
        q: 'Do I need to fast?',
        a: 'If labs are planned, fasting for 8 to 12 hours gives the most accurate results. Water is fine.'
      },
      {
        q: 'Is the annual physical covered by insurance?',
        a: 'Most plans cover one preventive visit per year. Our team will verify your benefits before you arrive.'
      }
    ]
  },
  {
    slug: 'medical-weight-loss',
    name: 'Medical Weight Loss',
    short: 'Physician-supervised programs, including GLP-1 therapies when medically appropriate.',
    tagline: 'Lose weight with a doctor, not an app.',
    icon: Scale,
    colors: ['#c084fc', '#d8b46a', '#5ee7d3'],
    featured: true,
    description: [
      'Sustainable weight loss is medical, not moral. Our program starts with a full metabolic assessment and builds a plan around your physiology, schedule, and goals.',
      'When appropriate, treatment may include semaglutide or tirzepatide therapy alongside nutrition guidance, registered dietitian referral, and regular physician check-ins to track progress and adjust safely.'
    ],
    highlights: [
      'Comprehensive metabolic and lab assessment',
      'GLP-1 therapy (semaglutide, tirzepatide) when indicated',
      'Nutrition guidance and dietitian referral',
      'Ongoing monitoring with dose adjustments by your physician'
    ],
    faq: [
      {
        q: 'Am I a candidate for GLP-1 medication?',
        a: 'Candidacy depends on your BMI, medical history, and current medications. Dr. Katiraie reviews this at your first visit and explains the options clearly.'
      },
      {
        q: 'How quickly will I see results?',
        a: 'Most patients see steady progress within the first one to two months. We focus on safe, gradual loss that lasts.'
      },
      {
        q: 'Can this be done by telehealth?',
        a: 'Follow-up visits are often done by video. The initial assessment and periodic labs are completed in the office.'
      }
    ]
  },
  {
    slug: 'iv-therapy',
    name: 'IV Therapy',
    short: 'Pharmaceutical-grade hydration, vitamins, and nutrients delivered directly to your bloodstream.',
    tagline: 'Recharge at the source.',
    icon: Droplets,
    colors: ['#38bdf8', '#5ee7d3', '#38bdf8'],
    featured: true,
    description: [
      'IV therapy delivers fluids, vitamins, and minerals directly into your bloodstream, bypassing digestion so your body can use them right away.',
      'Every drip is physician-formulated with pharmaceutical-grade ingredients and administered by trained staff in a calm, private setting.'
    ],
    highlights: [
      'Hydration, immunity, energy, and recovery formulas',
      'Physician-reviewed before every infusion',
      'Administered by trained clinical staff',
      'Sessions typically take 30 to 60 minutes'
    ],
    faq: [
      {
        q: 'Which drip is right for me?',
        a: 'Our team reviews your goals and health history and recommends a formula. Custom blends are available.'
      },
      {
        q: 'Is IV therapy safe?',
        a: 'When screened and administered by medical professionals, IV therapy is very well tolerated. We review your history before every session.'
      },
      {
        q: 'How often can I come in?',
        a: 'It depends on the formula and your goals. Many patients come monthly; your provider will recommend a schedule.'
      }
    ]
  },
  {
    slug: 'emsculpt-neo',
    name: 'Emsculpt Neo',
    short: 'FDA-cleared body contouring that builds muscle and reduces fat in 30-minute sessions.',
    tagline: 'Build muscle. Burn fat. No downtime.',
    icon: Zap,
    colors: ['#f59e0b', '#d8b46a', '#f97316'],
    featured: true,
    description: [
      'Emsculpt Neo combines high-intensity focused electromagnetic energy with radiofrequency heat to strengthen muscle and reduce fat in the same treatment.',
      'Most patients complete a series of four sessions spaced a few days apart. Results appear over the following weeks and continue to improve as the body responds.'
    ],
    highlights: [
      'Builds muscle and reduces fat simultaneously',
      'Non-invasive, 30-minute sessions',
      'No downtime, return to your day immediately',
      'Abdomen, glutes, arms, thighs, and calves'
    ],
    faq: [
      {
        q: 'Does it hurt?',
        a: 'Most patients describe intense muscle contractions with gentle warmth. It is not painful, and intensity is adjusted to your comfort.'
      },
      {
        q: 'How many sessions do I need?',
        a: 'A standard series is four sessions, scheduled two to three days apart. Maintenance sessions can be added later.'
      },
      {
        q: 'Who is a good candidate?',
        a: 'Emsculpt Neo works best for patients close to their goal weight who want more definition. A brief consultation confirms candidacy.'
      }
    ]
  },
  {
    slug: 'vitamin-b12-shots',
    name: 'Vitamin B12 Shots',
    short: 'Quick, physician-supervised injections to support energy, metabolism, and focus.',
    tagline: 'Five minutes. Real energy.',
    icon: Syringe,
    colors: ['#f472b6', '#d8b46a', '#f472b6'],
    description: [
      'Vitamin B12 supports red blood cell production, nerve function, and energy metabolism. Injections bypass absorption issues that limit oral supplements.',
      'Shots take minutes and can be scheduled as a standalone visit or added to any appointment.'
    ],
    highlights: [
      'Supports energy and metabolism',
      'Ideal when oral absorption is limited',
      'Walk-in style quick visits',
      'Can be combined with IV therapy or weight-loss visits'
    ],
    faq: [
      {
        q: 'How often should I get a B12 shot?',
        a: 'It depends on your levels and symptoms. Many patients start weekly and taper to monthly under physician guidance.'
      },
      {
        q: 'Do I need labs first?',
        a: 'Not always, but we may recommend a B12 level if you have symptoms of deficiency or a condition affecting absorption.'
      },
      {
        q: 'Are there side effects?',
        a: 'B12 injections are very well tolerated. Mild soreness at the injection site is the most common.'
      }
    ]
  },
  {
    slug: 'osteopathic-treatment',
    name: 'Osteopathic Treatment',
    short: 'Hands-on manipulation for back pain, joint issues, and mobility, without medication.',
    tagline: 'Relief you can feel, by hand.',
    icon: Hand,
    colors: ['#5ee7d3', '#a3e635', '#5ee7d3'],
    description: [
      'As a Doctor of Osteopathic Medicine, Dr. Katiraie is trained in osteopathic manipulative treatment, a hands-on approach that restores movement and relieves pain in muscles, joints, and connective tissue.',
      'It is a drug-free option for back and neck pain, headaches, joint stiffness, and recovery from injury, and it pairs naturally with your primary care.'
    ],
    highlights: [
      'Back, neck, and joint pain relief',
      'No medication or downtime',
      'Performed by a board-certified DO',
      'Integrated with your overall care plan'
    ],
    faq: [
      {
        q: 'Is this the same as chiropractic care?',
        a: 'They share some techniques, but osteopathic treatment is performed by a licensed physician who also evaluates and treats the underlying medical cause.'
      },
      {
        q: 'How many sessions will I need?',
        a: 'Many patients feel improvement after the first visit. A short series is common for chronic issues.'
      },
      {
        q: 'Is it covered by insurance?',
        a: 'Often, yes, when medically indicated. Our team will verify your benefits.'
      }
    ]
  },
  {
    slug: 'podiatry',
    name: 'Podiatry',
    short: 'Specialized foot and ankle care, from diabetic foot exams to heel pain and nail issues.',
    tagline: 'Every step, cared for.',
    icon: Footprints,
    colors: ['#d8b46a', '#f97316', '#d8b46a'],
    description: [
      'Our podiatry service addresses foot and ankle conditions in the same office as your primary care, so nothing is lost between providers.',
      'Common visits include heel and arch pain, ingrown or fungal nails, diabetic foot exams, sports injuries, and custom orthotic evaluation.'
    ],
    highlights: [
      'Diabetic foot exams and wound prevention',
      'Heel, arch, and ankle pain treatment',
      'Nail and skin conditions',
      'Coordinated with your primary care physician'
    ],
    faq: [
      {
        q: 'Do I need a referral?',
        a: 'Most PPO patients can book directly. HMO patients may need a referral; our team will guide you.'
      },
      {
        q: 'How often should diabetics have a foot exam?',
        a: 'At least once a year, and more often if you have neuropathy, circulation issues, or a history of ulcers.'
      },
      {
        q: 'Do you treat sports injuries?',
        a: 'Yes, including sprains, stress injuries, and overuse conditions of the foot and ankle.'
      }
    ]
  },
  {
    slug: 'geriatric-care',
    name: 'Geriatric Care',
    short: 'Thoughtful care for older adults: medications, memory, mobility, and independence.',
    tagline: 'Healthy, independent, and heard.',
    icon: HeartPulse,
    colors: ['#a78bfa', '#d8b46a', '#a78bfa'],
    description: [
      'Older adults deserve a physician who understands how conditions and medications interact over time. Geriatric care at Beverly Hills Health focuses on keeping seniors healthy, safe, and independent.',
      'Visits include medication review, memory and mood screening, fall prevention, and coordination with family members and caregivers.'
    ],
    highlights: [
      'Medication review and simplification',
      'Memory and cognitive screening',
      'Fall prevention and mobility planning',
      'Family and caregiver coordination'
    ],
    faq: [
      {
        q: 'Can a family member join the visit?',
        a: 'Absolutely. With the patient’s permission, we welcome family members and caregivers in person or by phone.'
      },
      {
        q: 'Do you accept Medicare?',
        a: 'Yes. Beverly Hills Health accepts Medicare.'
      },
      {
        q: 'Do you see patients who cannot travel?',
        a: 'Yes. Dr. Katiraie also provides care at skilled nursing facilities, assisted living communities, and private residences.'
      }
    ]
  },
  {
    slug: 'pre-operative-clearance',
    name: 'Pre-Operative Clearance',
    short: 'Fast, thorough surgical clearance with labs, EKG, and documentation sent to your surgeon.',
    tagline: 'Cleared and confident before surgery.',
    icon: ShieldCheck,
    colors: ['#5ee7d3', '#38bdf8', '#5ee7d3'],
    description: [
      'Surgeons need a clear picture of your health before an operation. We provide efficient pre-operative evaluations that meet surgical and anesthesia requirements.',
      'Visits include a focused history and exam, required labs and EKG, risk assessment, and a signed clearance letter delivered directly to your surgical team.'
    ],
    highlights: [
      'Labs, EKG, and risk assessment in one visit',
      'Clearance letter sent directly to your surgeon',
      'Appointments available within days',
      'Medication guidance before and after surgery'
    ],
    faq: [
      {
        q: 'How soon can I be seen?',
        a: 'Pre-operative visits are prioritized. Call the office and we will typically schedule you within a few days.'
      },
      {
        q: 'What should I bring?',
        a: 'Your surgeon’s clearance form, a current medication list, and any recent lab or cardiac results.'
      },
      {
        q: 'Do you send the paperwork?',
        a: 'Yes. We fax or securely send the completed clearance directly to your surgical team and confirm receipt.'
      }
    ]
  },
  {
    slug: 'telehealth',
    name: 'Telehealth & House Calls',
    short: 'Video visits from anywhere in California, and in-home visits when you cannot come to us.',
    tagline: 'Care that comes to you.',
    icon: Video,
    colors: ['#38bdf8', '#d8b46a', '#38bdf8'],
    description: [
      'Telehealth lets you see your own physician from home or work for follow-ups, medication questions, results review, and many acute concerns.',
      'For patients who cannot travel, Dr. Katiraie also provides house calls across the West Los Angeles area.'
    ],
    highlights: [
      'Secure video visits with your own doctor',
      'Prescription refills and results review',
      'House calls for homebound patients',
      'Same-week availability'
    ],
    faq: [
      {
        q: 'What do I need for a video visit?',
        a: 'A phone, tablet, or computer with a camera and an internet connection. We send a secure link before your visit.'
      },
      {
        q: 'Can everything be done by telehealth?',
        a: 'Many visits can. Physical exams, procedures, and some labs require an in-person visit, and we will tell you in advance.'
      },
      {
        q: 'Is telehealth covered by insurance?',
        a: 'Most plans now cover video visits. Our team will verify before scheduling.'
      }
    ]
  },
  {
    slug: 'facility-care',
    name: 'Facility & Senior Living Care',
    short: 'Physician visits and coordination for residents of skilled nursing and assisted living facilities.',
    tagline: 'Continuity, wherever you live.',
    icon: Building2,
    colors: ['#d8b46a', '#a78bfa', '#d8b46a'],
    description: [
      'Beverly Hills Health provides attending physician services at skilled nursing facilities and assisted living communities, so residents receive consistent, attentive care.',
      'We coordinate closely with facility nursing staff, families, and specialists to prevent gaps in care and reduce avoidable hospital visits.'
    ],
    highlights: [
      'Regular rounding and acute visits',
      'Medication reconciliation and oversight',
      'Direct communication with families and staff',
      'Hospital-to-facility transition planning'
    ],
    faq: [
      {
        q: 'Which facilities do you serve?',
        a: 'We serve facilities across Beverly Hills and West Los Angeles. Contact the office to confirm coverage for a specific community.'
      },
      {
        q: 'How do families stay informed?',
        a: 'With patient consent, we provide updates after visits and are available by phone for questions.'
      },
      {
        q: 'Can a facility request your services?',
        a: 'Yes. Facility administrators can call the office to discuss attending physician coverage.'
      }
    ]
  }
];

export const featuredServices = services.filter(s => s.featured);

export const pillars = [
  {
    title: 'Evidence-based',
    body: 'Every recommendation is grounded in current medical evidence, explained in plain language.'
  },
  {
    title: 'Personalized',
    body: 'Your plan reflects your history, your goals, and your life, not a template.'
  },
  {
    title: 'Accessible',
    body: 'In-person, telehealth, and house calls, with a team that answers the phone.'
  },
  {
    title: 'Honest',
    body: 'Clear answers about what you need, what you do not, and what it will cost.'
  }
];

export const steps = [
  {
    n: '01',
    title: 'Book in minutes',
    body: 'Schedule online or call the office. New patients are usually seen within the week.'
  },
  {
    n: '02',
    title: 'A real conversation',
    body: 'Your first visit is unhurried. We review your history, your concerns, and your goals together.'
  },
  {
    n: '03',
    title: 'A plan you understand',
    body: 'You leave with a clear written plan: labs, treatments, referrals, and what happens next.'
  },
  {
    n: '04',
    title: 'Follow-through',
    body: 'Results are reviewed and communicated promptly, and follow-ups are scheduled before you leave.'
  }
];

// Sample quotes for layout purposes only. Replace with real, consented patient reviews before launch.
export const sampleTestimonials = [
  {
    quote: 'The first doctor in years who actually listened and explained my labs line by line.',
    name: 'Sample review',
    context: 'Primary care patient'
  },
  {
    quote: 'Lost the weight safely with real medical supervision. Every question was answered the same day.',
    name: 'Sample review',
    context: 'Weight management patient'
  },
  {
    quote: 'Pre-op clearance done in one visit with the letter sent to my surgeon before I got home.',
    name: 'Sample review',
    context: 'Surgical clearance patient'
  }
];

export const brand = {
  motto: 'Your Health Is Our Priority',
  headline: 'Your Home for Honest Healthcare in Beverly Hills',
  mission:
    'Our mission is to provide evidence-based, comprehensive care that prioritizes your well-being. Led by Dr. Michael Katiraie, we focus on proactive wellness to deliver accessible, personalized healthcare.'
};

export const promo = {
  label: 'Exclusive offer',
  title: 'Emsculpt Neo treatment, 50% off',
  body: 'Limited-time introductory pricing on a full four-session series.',
  href: '/services/emsculpt-neo'
};

export type TeamMember = {
  name: string;
  role: string;
  credential?: string;
  blurb: string;
  initials: string;
  photo?: string;
};

export const team: TeamMember[] = [
  {
    name: 'Dr. Michael Katiraie',
    credential: 'DO',
    role: 'Medical Director',
    blurb: 'Board-certified family physician specializing in preventive medicine and comprehensive treatment.',
    initials: 'MK',
    photo: '/bhh/dr-katiraie.svg'
  },
  {
    name: 'Yasmin Asharian',
    credential: 'PA-C',
    role: 'Physician Assistant',
    blurb: 'Focused on weight management and patient wellness, with a calm, thorough approach to every visit.',
    initials: 'YA'
  },
  {
    name: 'Dr. Aziz Rassuli',
    credential: 'DPM',
    role: 'Podiatrist',
    blurb: 'Expert in advanced foot and ankle treatment, from diabetic foot care to sports injuries.',
    initials: 'AR'
  },
  {
    name: 'Max Gutierrez',
    role: 'Office Manager',
    blurb: 'Keeps the clinic running smoothly so every patient has an exceptional experience.',
    initials: 'MG'
  },
  {
    name: 'Melody',
    role: 'Front Desk',
    blurb: 'Your first point of contact for scheduling, insurance questions, and check-in.',
    initials: 'M'
  },
  {
    name: 'Heidi',
    role: 'Front Desk',
    blurb: 'Coordinates appointments, referrals, and follow-ups with warmth and precision.',
    initials: 'H'
  }
];
