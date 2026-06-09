import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  FileText,
  PlusCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
} from "lucide-react";

import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { DataTable } from "../components/DataTable";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { formatDate } from "../utils/dateUtils";
import { getRoomScheduleForDate } from "../services/workforceService";

import {
  CARE_NAVIGATION_NOTES_STORAGE_KEY,
  CARE_NAVIGATION_PATHWAYS_STORAGE_KEY,
  addCareNavigationNote,
  addCareNavigationPathway,
  addPathwayClinicType,
  addPathwayRedFlag,
  buildBookingText,
  buildSystmOneNote,
  createCareNavigationNote,
  createCareNavigationPathway,
  filterCareNavigationPathways,
  getCareNavigationMetrics,
  getCareNavigationPathwayById,
  getDefaultCareNavigationGovernanceChecklist,
  getDefaultCareNavigationPathways,
  getDefaultSampleCareNavigationCalls,
  getGovernanceChecklistMetrics,
  getInitialClinicType,
  getPathwaySafetyStatus,
  getRedFlagOutcome,
  getSafeCareNavigationNotes,
  getSafeCareNavigationPathways,
  updateCareNavigationPathway,
} from "../services/careNavigationService";

import {
  AlertBanner,
  Button,
  FormField,
  PageHeader,
  Panel,
  fieldClassName,
} from "../components/ui";

const careNavigationGovernanceChecklist = getDefaultCareNavigationGovernanceChecklist();
const TRIAGE_OPTIONS = ["Yes", "No", "Not asked"];
const AGE_BRACKETS = ["0-4", "5-15", "16-64", "65+", "Not asked"];
const PHARMACY_CONTEXT_OPTIONS = ["Female", "Male", "Pregnant/postnatal", "Child", "Not asked"];
const DURATION_BANDS = ["Today", "1-3 days", "4-14 days", "2-8 weeks", "3+ months", "Ongoing", "Not asked"];
const KNOWN_ISSUE_OPTIONS = ["New", "Recurring", "Known condition", "Not sure"];
const SIGN_OFF_STATUS_OPTIONS = ["Draft", "Ready for review", "Approved", "Locked", "Retired"];
const PRACTITIONER_OPTIONS = [
  "Jenny Moore — GP",
  "Caitlin Clarke — GP Partner / sign-off clinician",
  "Prosper Ehiwarior — GP Registrar",
  "Alison Cannon — ANP",
  "Genevieve Rose — HCA",
  "Practice Nurse — configure",
  "Practice Pharmacist — configure",
  "Reception / Patient Coordinator",
  "Community Pharmacy / Pharmacy First",
  "First Contact Physiotherapy — configure",
  "Duty clinician — configure rota source",
];

const UNMATCHED_PATHWAY = {
  id: "unmatched-care-request",
  name: "Waiting for request",
  category: "Care navigation",
  synonyms: [],
  version: "no pathway selected",
  status: "Draft",
  approvalStatus: "Requires clinical review",
  risk: "Medium",
  source: "No pathway matched yet",
  owner: "Clinical owner not assigned",
  reviewStatus: "Enter the caller request to auto-match a pathway.",
  nextReview: "Not set",
  description: "Type what the caller is asking for. GPOP will auto-match a pathway and load a short receptionist question set.",
  suggestedClinicTypes: ["Ask for presenting request"],
  supportingActions: ["None"],
  redFlagPlaceholders: [
    "Patient sounds or appears very unwell?",
    "Severe pain, collapse, breathing difficulty or new confusion?",
    "Symptoms rapidly worsening today?",
  ],
  routineQuestions: [
    "Is the main problem clear from the caller's wording?",
    "Is this a new problem rather than a routine admin request?",
  ],
  bookingSlotText: "Care nav: enter request before booking",
};

function normalise(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function textHasAny(value = "", keywords = []) {
  const text = normalise(value);
  return keywords.some((keyword) => {
    const safeKeyword = normalise(keyword);
    if (!safeKeyword) return false;
    return text === safeKeyword || text.includes(safeKeyword);
  });
}

function pathwayHasAny(pathway, keywords = []) {
  const text = normalise([
    pathway?.name,
    pathway?.category,
    pathway?.description,
    ...(pathway?.synonyms || []),
  ].join(" "));
  return textHasAny(text, keywords);
}


const SCRIPT_LIBRARY = [
  {
    key: "chest-pain",
    label: "Chest pain",
    keywords: ["chest pain", "tight chest", "chest pressure", "heart pain", "central chest pain"],
    names: ["Chest pain"],
    categories: ["Urgent symptoms", "Cardiology"],
    redFlags: [
      "Severe, crushing or central chest pain now?",
      "Shortness of breath, collapse, clammy/sweaty or fainting?",
      "Pain spreading to arm, jaw, back or neck?",
      "Known heart disease or patient sounds very unwell?",
    ],
    prompts: [
      "Is the pain happening now?",
      "Did it start suddenly today?",
      "Is there no clear injury/strain explanation?",
    ],
    defaultAction: "Urgent clinician review / emergency pathway",
    defaultPractitioner: "Duty clinician — configure rota source",
    prep: "Do not routine-book chest pain. Follow approved urgent/emergency local SOP.",
    slotText: "CARE NAV CHEST PAIN — urgent clinician review/emergency SOP",
    tone: "danger",
  },
  {
    key: "stroke-tia",
    label: "Stroke/TIA symptoms",
    keywords: ["stroke", "face droop", "slurred speech", "arm weakness", "tia", "mini stroke", "speech change", "facial weakness"],
    names: ["Stroke symptoms", "Facial weakness", "Speech change"],
    categories: ["Urgent symptoms", "Neurology"],
    redFlags: [
      "Face drooping or new facial weakness?",
      "Arm/leg weakness, numbness or new coordination problem?",
      "Speech difficulty, confusion or sudden vision loss?",
      "Symptoms started suddenly or within the last few days?",
    ],
    prompts: [
      "Are symptoms still present?",
      "Did symptoms start suddenly?",
      "Has emergency help already been contacted?",
    ],
    defaultAction: "Emergency escalation / urgent clinician review",
    defaultPractitioner: "Duty clinician — configure rota source",
    prep: "Record time last known well and follow approved emergency/TIA local SOP.",
    slotText: "CARE NAV STROKE/TIA SYMPTOMS — emergency escalation",
    tone: "danger",
  },
  {
    key: "breathlessness",
    label: "Breathing difficulty",
    keywords: ["shortness of breath", "breathless", "difficulty breathing", "can't breathe", "cant breathe", "wheeze", "wheezing", "asthma attack", "asthma worse", "copd worse"],
    names: ["Shortness of breath", "Asthma attack concern"],
    categories: ["Respiratory"],
    redFlags: [
      "Severe breathlessness at rest or unable to speak full sentences?",
      "Blue lips, collapse, chest pain or new confusion?",
      "Known asthma/COPD and symptoms not settling?",
      "Baby, frail patient or patient sounds very unwell?",
    ],
    prompts: [
      "Is there wheeze or chest tightness?",
      "Is this worse than their normal breathing?",
      "Has reliever inhaler/nebuliser not helped, if used?",
    ],
    defaultAction: "Same-day urgent clinician review",
    defaultPractitioner: "Duty clinician — configure rota source",
    prep: "Escalate immediately if severe breathlessness or any red flag is present.",
    slotText: "Care nav: breathing concern · urgent clinician review",
    tone: "danger",
  },
  {
    key: "cough-respiratory",
    label: "Cough / respiratory symptoms",
    keywords: ["cough", "coughing", "chesty cough", "chest infection", "cold", "flu", "viral", "covid", "respiratory infection", "flu like"],
    names: ["Cough", "Flu-like illness", "COVID / respiratory infection", "Child cough"],
    categories: ["Respiratory"],
    redFlags: [
      "Breathless at rest, blue lips, collapse or chest pain?",
      "Coughing blood or severe worsening today?",
      "Baby under 1, frail/elderly, immunosuppressed or significant COPD/asthma?",
      "High fever, confusion or patient sounds very unwell?",
    ],
    prompts: [
      "Fever or flu-like symptoms?",
      "Wheeze, chest tightness or shortness of breath?",
      "Cough has lasted longer than 3 weeks?",
    ],
    defaultAction: "Pharmacy First / routine GP if criteria not met",
    defaultPractitioner: "Community Pharmacy / Pharmacy First",
    prep: "Use Pharmacy First/local minor illness route only where approved criteria are met; escalate breathlessness or red flags.",
    slotText: "Care nav: cough/respiratory symptoms · pharmacy/GP per approved pathway",
    tone: "ok",
  },
  {
    key: "upper-airway-nasal",
    label: "Nasal / sinus symptoms",
    keywords: ["nasal drip", "post nasal drip", "postnasal drip", "runny nose", "blocked nose", "dripping nose", "catarrh", "mucus in throat", "rhinitis", "rhinorrhoea", "nasal congestion", "sinus", "sinusitis", "hay fever"],
    names: ["Post-nasal drip / nasal discharge", "Sinus symptoms", "Hay fever", "Runny nose", "Blocked nose"],
    categories: ["Upper airway / nasal symptoms", "ENT"],
    redFlags: [
      "Difficulty breathing, facial/eye swelling or severe one-sided facial pain?",
      "Heavy nose bleed, recent head injury or collapse?",
      "High fever, confusion or patient sounds very unwell?",
      "Symptoms in a baby, frail patient or immunosuppressed patient?",
    ],
    prompts: [
      "Runny/blocked nose or post-nasal drip is the main issue?",
      "Facial pain, sinus pressure or thick coloured discharge is present?",
      "Hay fever/allergy symptoms such as sneezing or itchy eyes are present?",
    ],
    defaultAction: "Community Pharmacy / Pharmacy First if criteria met",
    defaultPractitioner: "Community Pharmacy / Pharmacy First",
    prep: "Use approved local Pharmacy First/minor illness criteria only; escalate red flags, facial/eye swelling or severe symptoms.",
    slotText: "Care nav: nasal/sinus symptoms · pharmacy/GP per approved pathway",
    tone: "ok",
  },
  {
    key: "sore-throat-ent",
    label: "Sore throat / ENT",
    keywords: ["sore throat", "tonsillitis", "throat pain", "pain swallowing", "swollen tonsils", "mouth ulcer", "sore mouth", "hoarse voice", "sinus", "ear pain", "hearing loss", "tinnitus", "nose bleed", "hay fever", "dental"],
    names: ["Sore throat", "Ear pain", "Hay fever", "Hearing loss", "Hoarse voice", "Nose bleed", "Sinus symptoms", "Sore mouth or ulcers", "Swollen gland", "Tinnitus", "Dental problem", "Child ear pain"],
    categories: ["ENT", "Infection / ENT"],
    redFlags: [
      "Difficulty breathing, drooling or unable to swallow fluids?",
      "Severe dehydration, neck swelling or patient sounds very unwell?",
      "Facial swelling, eye swelling or severe one-sided pain?",
      "Non-blanching rash or safeguarding concern?",
    ],
    prompts: [
      "Fever or feeling significantly unwell?",
      "Symptoms mainly ear, throat, nose/sinus or mouth?",
      "Pharmacy First/minor illness route may be suitable?",
    ],
    defaultAction: "Pharmacy First / routine GP if criteria not met",
    defaultPractitioner: "Community Pharmacy / Pharmacy First",
    prep: "Use approved Pharmacy First/local ENT criteria only; escalate red flags.",
    slotText: "Care nav: ENT/throat concern · pharmacy/GP per approved pathway",
    tone: "ok",
  },
  {
    key: "bladder-leakage",
    label: "Bladder leakage / continence",
    keywords: ["incontinence", "bladder leak", "bladder leakage", "leaking urine", "urine leakage", "wetting", "can't hold urine", "cant hold urine", "loss of bladder"],
    names: ["Bladder leakage"],
    categories: ["Urinary"],
    redFlags: [
      "Unable to pass urine or catheter blocked?",
      "New saddle numbness, leg weakness or loss of bowel control?",
      "Fever, flank pain, rigors or patient sounds very unwell?",
      "Visible blood in urine or severe pain?",
    ],
    prompts: [
      "Leakage happens with coughing, lifting or sneezing?",
      "Leakage happens with sudden urgency to pass urine?",
      "Burning, frequency or UTI symptoms are also present?",
    ],
    defaultAction: "Routine ANP / GP continence review",
    defaultPractitioner: "Alison Cannon — ANP",
    prep: "If UTI symptoms are present, consider urine sample workflow under local SOP. Otherwise book routine continence review.",
    slotText: "Care nav: bladder leakage · book ANP/GP continence review",
    tone: "ok",
  },
  {
    key: "uti-urinary",
    label: "UTI / urinary symptoms",
    keywords: ["uti", "urine infection", "water infection", "cystitis", "burning urine", "burning passing urine", "wee pain", "pain passing urine", "frequency", "urgency passing urine", "urine sample"],
    names: ["UTI symptoms", "Urinary symptoms", "Urine sample request"],
    categories: ["Infection / urinary", "Urinary"],
    redFlags: [
      "Fever, rigors, flank pain or patient sounds very unwell?",
      "Pregnant, male patient, catheter, kidney disease or immunosuppressed?",
      "Confusion, frailty concern or care-home escalation?",
      "Visible blood in urine or severe pain?",
    ],
    prompts: [
      "Burning or pain passing urine?",
      "Passing urine more often or urgently?",
      "Able to provide urine sample before review?",
    ],
    defaultAction: "Urine sample / ANP review",
    defaultPractitioner: "Alison Cannon — ANP",
    prep: "Ask for urine sample if local SOP allows; consider Pharmacy First only when pathway criteria are approved.",
    slotText: "Care nav: urinary symptoms · sample/ANP/GP per approved pathway",
    tone: "ok",
  },
  {
    key: "catheter",
    label: "Catheter problem",
    keywords: ["catheter", "catheter blocked", "catheter leaking", "catheter pain"],
    names: ["Catheter problem"],
    categories: ["Urinary"],
    redFlags: [
      "Catheter blocked or no urine draining?",
      "Severe pain, bladder distension or visible blood?",
      "Fever, rigors, flank pain or patient sounds very unwell?",
      "Catheter came out and cannot be replaced under local SOP?",
    ],
    prompts: [
      "Catheter is still draining some urine?",
      "Leakage around the catheter is the main issue?",
      "District nurse/community catheter team already involved?",
    ],
    defaultAction: "Same-day clinician / community catheter route",
    defaultPractitioner: "Duty clinician — configure rota source",
    prep: "Use local catheter escalation route; blocked catheter is not routine.",
    slotText: "Care nav: catheter problem · same-day catheter/clinician route",
    tone: "amber",
  },
  {
    key: "mens-health",
    label: "Men’s health",
    keywords: ["scrotal", "testicular", "testicle", "erectile", "prostate", "psa", "penis", "penile", "mens health", "men's health"],
    names: ["Scrotal pain", "Erectile dysfunction", "Prostate symptoms"],
    categories: ["Men’s health"],
    redFlags: [
      "Sudden/severe testicular or scrotal pain?",
      "Unable to pass urine or severe lower abdominal pain?",
      "Fever, visible blood in urine or patient sounds very unwell?",
      "Painful erection lasting more than 4 hours?",
    ],
    prompts: [
      "Urinary symptoms are present?",
      "New lump, swelling or pain is present?",
      "Medication/sexual function advice is the main request?",
    ],
    defaultAction: "GP / ANP men’s health review",
    defaultPractitioner: "Jenny Moore — GP",
    prep: "Same-day escalation for acute scrotal pain, retention, fever or severe pain. Routine GP/ANP for stable symptoms.",
    slotText: "Care nav: men’s health request · GP/ANP per approved pathway",
    tone: "amber",
  },
  {
    key: "womens-health",
    label: "Women’s health",
    keywords: ["period", "heavy periods", "pelvic pain", "pregnancy", "postnatal", "menopause", "hrt", "contraception", "missed pill", "emergency contraception", "vaginal bleeding", "thrush", "breast lump", "breast pain", "cervical screening"],
    names: ["Breast lump or pain", "Cervical screening query", "Contraception request", "Heavy periods", "Menopause support", "New pregnancy", "Pelvic pain", "Period problem", "Postnatal concern", "Pregnancy bleeding", "Thrush symptoms", "Vaginal bleeding", "Emergency contraception", "HRT review", "Missed pill"],
    categories: ["Women’s health", "Sexual health"],
    redFlags: [
      "Pregnant with pain, heavy bleeding or feeling very unwell?",
      "Severe pelvic/abdominal pain, collapse or shoulder-tip pain?",
      "Postnatal fever, heavy bleeding or mental-health crisis?",
      "Breast redness with fever or rapidly worsening pain?",
    ],
    prompts: [
      "Pregnancy or possible pregnancy is relevant?",
      "Bleeding, pain or infection symptoms are present?",
      "Routine contraception/HRT/screening advice is the main request?",
    ],
    defaultAction: "GP / ANP / Practice Nurse women’s health review",
    defaultPractitioner: "Practice Nurse — configure",
    prep: "Route according to local women’s health skills and sign-off. Pregnancy bleeding/severe pain must not be routine booked.",
    slotText: "Care nav: women’s health request · nurse/ANP/GP per approved pathway",
    tone: "amber",
  },
  {
    key: "skin-rash",
    label: "Skin / rash",
    keywords: ["rash", "skin", "mole", "lesion", "spots", "eczema", "acne", "bite", "cellulitis", "shingles", "toe infection", "wound", "nail", "hair loss", "burn", "scald"],
    names: ["Rash / skin lesion", "Rash / skin problem", "Acne", "Bite or sting", "Hair loss", "Mole change", "Nail problem", "Wound check", "Animal bite", "Cellulitis concern", "Shingles", "Toe infection", "Child rash", "Genital rash", "Burns and scalds"],
    categories: ["Skin"],
    redFlags: [
      "Non-blanching rash, purple rash or meningitis concern?",
      "Facial/lip swelling or breathing difficulty?",
      "Rapidly spreading red, hot, painful skin or fever?",
      "Baby, immunosuppressed patient or severe pain?",
    ],
    prompts: [
      "Photo link would be useful and appropriate?",
      "Rash/skin area is painful, spreading or infected-looking?",
      "New/changing mole or bleeding lesion?",
    ],
    defaultAction: "Text image link + GP/ANP review",
    defaultPractitioner: "Alison Cannon — ANP",
    prep: "Send image upload link where appropriate; do not rely on image alone if red flags are present.",
    slotText: "Care nav: skin concern · image link + ANP/GP review",
    tone: "ok",
  },
  {
    key: "msk-injury",
    label: "MSK / injury",
    keywords: ["back pain", "sciatica", "lower back", "neck pain", "shoulder pain", "knee pain", "hip pain", "joint pain", "msk", "muscle pain", "injury", "sprain", "ankle", "foot", "gout", "wrist", "hand pain", "head injury"],
    names: ["Back pain", "Back pain follow-up", "Minor injury / sore thumb", "Ankle injury", "Foot problem", "Gout flare", "Head injury", "Joint pain", "Knee pain", "Neck pain", "Shoulder pain", "Wrist or hand pain"],
    categories: ["MSK", "MSK / injury", "Minor injury / MSK"],
    redFlags: [
      "New bladder/bowel loss, saddle numbness or new limb weakness?",
      "Significant trauma, deformity or unable to weight-bear/use limb?",
      "Head injury with vomiting, drowsiness, anticoagulant use or loss of consciousness?",
      "Fever, unexplained weight loss, cancer history or rapidly worsening function?",
    ],
    prompts: [
      "Started after injury, fall or lifting?",
      "Pain travels into arm/leg with numbness or pins and needles?",
      "Physiotherapy/minor injury route may be suitable?",
    ],
    defaultAction: "FCP / routine GP depending on local availability",
    defaultPractitioner: "First Contact Physiotherapy — configure",
    prep: "If no red flags, route to FCP/minor injury service if commissioned/available; otherwise routine GP under local SOP.",
    slotText: "Care nav: MSK/injury · book FCP/GP per approved pathway",
    tone: "ok",
  },
  {
    key: "headache-neuro",
    label: "Headache / neurology",
    keywords: ["headache", "migraine", "dizziness", "vertigo", "numbness", "tingling", "seizure", "fit", "blackout"],
    names: ["Headache", "Dizziness", "Numbness or tingling", "Seizure", "Vertigo", "Fainting"],
    categories: ["Neurology"],
    redFlags: [
      "Sudden thunderclap headache or worst headache ever?",
      "New weakness, numbness, speech/vision change or confusion?",
      "Fever, stiff neck, rash, pregnancy/postnatal or head injury?",
      "Seizure, collapse or first fit?",
    ],
    prompts: [
      "Symptoms started suddenly today?",
      "Dizziness/vertigo affects walking or safety?",
      "Known migraine/vertigo pattern and no new features?",
    ],
    defaultAction: "Same-day GP/ANP if new or concerning; routine GP if stable known issue",
    defaultPractitioner: "Jenny Moore — GP",
    prep: "Neurology symptoms need local escalation rules; routine booking only if no red flags and stable pattern.",
    slotText: "Care nav: headache/neurology symptoms · GP/ANP per approved pathway",
    tone: "amber",
  },
  {
    key: "abdominal-gi",
    label: "Abdominal / bowel symptoms",
    keywords: ["abdominal", "stomach", "tummy", "bowel", "diarrhoea", "diarrhea", "vomiting", "nausea", "reflux", "heartburn", "rectal bleeding", "blood in stool", "constipation", "bloating"],
    names: ["Abdominal pain", "Bowel habit change", "Heartburn or reflux", "Nausea or vomiting", "Rectal bleeding", "Stomach bloating", "Child abdominal pain", "Child vomiting or diarrhoea"],
    categories: ["Abdominal / GI"],
    redFlags: [
      "Severe abdominal pain, collapse or rigid abdomen?",
      "Vomiting blood, black stools or heavy rectal bleeding?",
      "Pregnancy, severe dehydration or unable to keep fluids down?",
      "Unexplained weight loss or persistent change in bowel habit?",
    ],
    prompts: [
      "Pain is present now?",
      "Vomiting/diarrhoea or dehydration is present?",
      "Blood in stool or black stool is mentioned?",
    ],
    defaultAction: "GP/ANP review; urgent if red flags",
    defaultPractitioner: "Alison Cannon — ANP",
    prep: "Ask about sample pot only if local stool/urine pathway applies. Escalate abdominal red flags.",
    slotText: "Care nav: abdominal/bowel symptoms · ANP/GP per approved pathway",
    tone: "amber",
  },
  {
    key: "medicines",
    label: "Medication / prescription",
    keywords: ["medication", "medicine", "prescription", "repeat", "side effect", "dose", "tablets", "pharmacy", "dispensing", "anticoagulation", "warfarin", "doac", "blood thinner", "drug monitoring", "pain relief"],
    names: ["Medication query", "Medication side effect", "Medication supply issue", "Prescription request", "Anticoagulation query", "Drug monitoring bloods", "Medication dose query", "Pain relief request", "Repeat dispensing query"],
    categories: ["Medicines", "Medicines / admin", "Dispensary"],
    redFlags: [
      "Possible allergic reaction, swelling, breathing difficulty or collapse?",
      "Overdose, wrong medicine taken or serious side effect?",
      "Insulin, anticoagulant, opioid, controlled drug or other high-risk medicine issue?",
      "Medication needed today to avoid clinical risk?",
    ],
    prompts: [
      "Request is for a repeat prescription/supply issue?",
      "Patient is asking about side effects or dose change?",
      "Pharmacy/dispensary has already been contacted?",
    ],
    defaultAction: "Pharmacist / GP medication query",
    defaultPractitioner: "Practice Pharmacist — configure",
    prep: "Route medicine questions to pharmacist/GP. Reception should not give medication advice.",
    slotText: "Care nav: medication query · pharmacist/GP review",
    tone: "ok",
  },
  {
    key: "mental-health",
    label: "Mental health",
    keywords: ["mental health", "anxiety", "depression", "low mood", "self harm", "suicidal", "crisis", "bereavement", "insomnia", "stress", "grief"],
    names: ["Mental health concern", "Anxiety symptoms", "Depression symptoms", "Insomnia", "Stress at work", "Suicidal thoughts", "Bereavement support", "Low mood medication review", "Child mental health"],
    categories: ["Mental health", "Mental health / neurodevelopmental"],
    redFlags: [
      "Current suicidal thoughts, self-harm risk or immediate danger?",
      "Psychosis, severe confusion or safeguarding concern?",
      "Unable to keep self or others safe today?",
      "Child/young person or domestic abuse concern?",
    ],
    prompts: [
      "Patient is asking for urgent same-day support?",
      "Known mental-health problem or recent medication change?",
      "Social prescribing/IAPT/local wellbeing route may be appropriate if non-urgent?",
    ],
    defaultAction: "Same-day GP/ANP if risk; routine GP/social prescribing if non-urgent",
    defaultPractitioner: "Jenny Moore — GP",
    prep: "If any risk is disclosed, stop routine booking and escalate under local safeguarding/crisis SOP.",
    slotText: "Care nav: mental-health request · GP/social prescribing per approved pathway",
    tone: "amber",
  },
  {
    key: "safeguarding",
    label: "Safeguarding",
    keywords: ["safeguarding", "domestic abuse", "abuse", "unsafe", "child concern", "neglect", "violence", "harm"],
    names: ["Safeguarding concern", "Domestic abuse disclosure", "Safeguarding child concern"],
    categories: ["Safeguarding"],
    redFlags: [
      "Immediate risk of harm or unsafe to speak?",
      "Child or vulnerable adult at risk today?",
      "Domestic abuse disclosure or coercive control concern?",
      "Emergency services/police may be needed?",
    ],
    prompts: [
      "Caller is safe to continue the call?",
      "A named patient/child/vulnerable adult is involved?",
      "Safeguarding lead/duty clinician should be alerted now?",
    ],
    defaultAction: "Safeguarding lead / urgent clinician review",
    defaultPractitioner: "Duty clinician — configure rota source",
    prep: "Follow practice safeguarding SOP. Do not leave disclosures only as routine admin notes.",
    slotText: "CARE NAV SAFEGUARDING — alert safeguarding lead/duty clinician",
    tone: "danger",
  },
  {
    key: "children",
    label: "Child health",
    keywords: ["child", "baby", "toddler", "infant", "child fever", "child rash", "child cough", "child vomiting", "child diarrhoea", "child ear", "parent worried"],
    names: ["Child fever", "Child rash", "Child vomiting or diarrhoea", "Child abdominal pain", "Child cough", "Child ear pain", "Child mental health"],
    categories: ["Children"],
    redFlags: [
      "Baby under 3 months with fever or very unwell child?",
      "Breathing difficulty, blue lips, floppy/drowsy or non-blanching rash?",
      "Dehydration, no wet nappies or persistent vomiting?",
      "Severe pain, safeguarding concern or parent/carer very worried?",
    ],
    prompts: [
      "Child is drinking and passing urine/wet nappies normally?",
      "Symptoms started today or are worsening?",
      "Parent/carer is requesting same-day clinician contact?",
    ],
    defaultAction: "Same-day GP/ANP if child concern",
    defaultPractitioner: "Jenny Moore — GP",
    prep: "Children's pathways require local approval and clear escalation rules before live use.",
    slotText: "Care nav: child health request · GP/ANP per approved pathway",
    tone: "amber",
  },
  {
    key: "ltc-review",
    label: "Long-term condition review",
    keywords: ["asthma review", "copd review", "blood pressure", "hypertension", "diabetes review", "diabetic", "annual review"],
    names: ["Asthma review request", "Blood pressure query", "COPD review request", "Diabetes review query"],
    categories: ["Long-term condition"],
    redFlags: [
      "Current severe symptoms or rapid deterioration?",
      "Very high home reading/symptom concern mentioned?",
      "Hypo/hyperglycaemia, chest pain or breathing issue mentioned?",
      "Patient sounds very unwell or confused?",
    ],
    prompts: [
      "This is a routine review request rather than acute symptoms?",
      "Patient has readings/results to bring or upload?",
      "Nurse/HCA appointment type fits the local protocol?",
    ],
    defaultAction: "Practice Nurse / HCA long-term condition review",
    defaultPractitioner: "Practice Nurse — configure",
    prep: "Book to the clinician role with the required skills; add readings/results request if applicable.",
    slotText: "Care nav: long-term condition review · nurse/HCA/GP per protocol",
    tone: "ok",
  },
  {
    key: "admin-results",
    label: "Admin / results",
    keywords: ["fit note", "sick note", "letter", "form", "blood test", "result", "results", "lft", "vitamin", "admin", "referral", "adhd", "autism", "gender identity", "chase referral"],
    names: ["Fit note / admin request", "Fit note request", "Blood test request", "Results query", "Abnormal LFTs result query", "Vitamin deficiency query", "ADHD referral request", "Adult ADHD referral", "Adult autism referral", "Gender identity referral request", "Referral chase"],
    categories: ["Admin", "Admin / results", "Admin / referral"],
    redFlags: [
      "Caller mentions worsening symptoms or urgent clinical concern?",
      "Safeguarding, mental-health crisis or medication risk mentioned?",
      "Request relates to hospital discharge, abnormal result or same-day clinical decision?",
    ],
    prompts: [
      "This is a form, fit note, referral or results request rather than symptoms?",
      "GP/clinician sign-off is required?",
      "Relevant document/result has already arrived at the practice?",
    ],
    defaultAction: "Admin task / GP sign-off if required",
    defaultPractitioner: "Reception / Patient Coordinator",
    prep: "Create admin task with clear wording. Route to GP only where clinical sign-off is needed.",
    slotText: "Care nav: admin/results request · task/GP sign-off per workflow",
    tone: "ok",
  },
  {
    key: "social-prescribing",
    label: "Social prescribing / support",
    keywords: ["lonely", "loneliness", "isolation", "carer", "carer stress", "social prescriber", "housing", "benefits", "support"],
    names: ["Loneliness / social prescribing", "Carer stress", "Loneliness / isolation", "Social prescriber referral"],
    categories: ["Social prescribing"],
    redFlags: [
      "Immediate risk to self, neglect or safeguarding concern?",
      "Mental-health crisis or suicidal thoughts mentioned?",
      "Carer breakdown with urgent safety concern?",
      "Patient has no access to food, medication or safe housing today?",
    ],
    prompts: [
      "Social prescriber/care coordinator support is the main request?",
      "Patient consents to referral/contact?",
      "A clinician also needs to review a health concern?",
    ],
    defaultAction: "Social prescriber / care coordinator referral",
    defaultPractitioner: "Reception / Patient Coordinator",
    prep: "Use local social prescribing referral route; escalate safeguarding or crisis concerns.",
    slotText: "Care nav: social support request · social prescriber/care coordinator",
    tone: "ok",
  },
  {
    key: "lifestyle",
    label: "Lifestyle support",
    keywords: ["smoking", "stop smoking", "weight", "obesity", "alcohol", "drinking", "lifestyle"],
    names: ["Smoking cessation", "Weight management", "Alcohol support"],
    categories: ["Lifestyle"],
    redFlags: [
      "Immediate alcohol withdrawal, confusion, seizure or severe illness concern?",
      "Mental-health crisis or safeguarding concern mentioned?",
      "Chest pain, breathlessness or acute severe symptoms mentioned?",
    ],
    prompts: [
      "Patient wants planned lifestyle support rather than urgent medical help?",
      "HCA/social prescribing appointment may be suitable?",
      "Patient consents to local support referral?",
    ],
    defaultAction: "HCA / social prescriber / routine GP if needed",
    defaultPractitioner: "Genevieve Rose — HCA",
    prep: "Book the correct lifestyle support route and escalate acute alcohol/mental-health risk.",
    slotText: "Care nav: lifestyle support · HCA/social prescriber per protocol",
    tone: "ok",
  },
  {
    key: "vaccination",
    label: "Vaccination / immunisation",
    keywords: ["vaccine", "vaccination", "immunisation", "immunization", "travel vaccine", "jab"],
    names: ["Immunisation query", "Travel vaccination"],
    categories: ["Vaccination"],
    redFlags: [
      "Possible allergic reaction after vaccination?",
      "Patient acutely unwell with fever or severe symptoms?",
      "Travel is imminent and advice cannot wait?",
    ],
    prompts: [
      "This is routine immunisation/travel advice?",
      "Patient knows destination/date if travel-related?",
      "Nurse/HCA vaccination clinic is appropriate locally?",
    ],
    defaultAction: "Practice Nurse / HCA vaccination clinic",
    defaultPractitioner: "Practice Nurse — configure",
    prep: "Book to trained vaccinator and request travel details where needed.",
    slotText: "Care nav: vaccination query · nurse/HCA per protocol",
    tone: "ok",
  },
  {
    key: "older-frailty",
    label: "Older person / frailty",
    keywords: ["falls", "memory", "dementia", "frailty", "care home", "confusion", "elderly", "carer query"],
    names: ["Falls risk", "Memory concern", "Dementia carer query", "Frailty review", "Care home call", "New confusion"],
    categories: ["Older people", "Care homes"],
    redFlags: [
      "New confusion, collapse, head injury or sudden deterioration?",
      "Fall with injury, anticoagulant use or unable to mobilise?",
      "Care home reports urgent clinical concern?",
      "Safeguarding, neglect or carer breakdown concern?",
    ],
    prompts: [
      "This is a new deterioration rather than routine review?",
      "Care home/carer can provide observations?",
      "Home visit/duty clinician review may be needed?",
    ],
    defaultAction: "Duty clinician / GP frailty review",
    defaultPractitioner: "Jenny Moore — GP",
    prep: "Ask for observations where local SOP allows. New confusion/falls may need same-day review.",
    slotText: "Care nav: frailty/older person concern · clinician review per protocol",
    tone: "amber",
  },
  {
    key: "palliative",
    label: "Palliative / end of life",
    keywords: ["palliative", "end of life", "syringe driver", "anticipatory", "terminal", "dying"],
    names: ["End of life medication query", "Palliative care concern"],
    categories: ["Palliative care"],
    redFlags: [
      "Patient may be in last days/hours with uncontrolled symptoms?",
      "Medication/syringe driver problem needs same-day action?",
      "Family/carer distress or urgent visiting need?",
      "Controlled drug/anticipatory medication supply risk today?",
    ],
    prompts: [
      "District nurse/palliative team already involved?",
      "Medication or symptom control is the main issue?",
      "Same-day clinician action is needed?",
    ],
    defaultAction: "Same-day GP / palliative clinician action",
    defaultPractitioner: "Jenny Moore — GP",
    prep: "Prioritise palliative calls under local SOP; do not leave urgent end-of-life medication issues as routine admin.",
    slotText: "Care nav: palliative concern · same-day GP/palliative route",
    tone: "amber",
  },
  {
    key: "general-symptoms",
    label: "General symptoms",
    keywords: ["fatigue", "tired", "weight loss", "bruising", "leg swelling", "swollen legs", "unwell", "fever", "infection"],
    names: ["Fatigue", "Leg swelling", "Weight loss", "Bruising", "Tiredness after infection"],
    categories: ["General symptoms"],
    redFlags: [
      "Patient sounds very unwell or rapidly worsening?",
      "Chest pain, severe breathlessness, collapse or confusion?",
      "Unexplained weight loss, bleeding or severe weakness?",
      "New one-sided leg swelling/pain or clot concern?",
    ],
    prompts: [
      "Symptoms are new or worsening?",
      "Patient is asking for clinical review rather than admin advice?",
      "Blood test/HCA review may be appropriate locally?",
    ],
    defaultAction: "Routine GP/ANP or HCA pre-check per protocol",
    defaultPractitioner: "Alison Cannon — ANP",
    prep: "Use local protocol for pre-appointment observations/bloods only where approved.",
    slotText: "Care nav: general symptoms · GP/ANP/HCA per approved pathway",
    tone: "ok",
  },
  {
    key: "eye-problem",
    label: "Eye problem",
    keywords: ["eye", "vision", "red eye", "sore eye", "loss of vision", "flashing lights"],
    names: ["Eye problem"],
    categories: ["Eye"],
    redFlags: [
      "Sudden loss of vision or new double vision?",
      "Severe eye pain, trauma or chemical injury?",
      "Flashing lights/curtain over vision?",
      "Red eye with contact lens use or patient very unwell?",
    ],
    prompts: [
      "Optician/minor eye service may be suitable locally?",
      "Symptoms are in one eye only?",
      "There is discharge/itch rather than pain/vision loss?",
    ],
    defaultAction: "Minor eye service / urgent GP if no eye service",
    defaultPractitioner: "Reception / Patient Coordinator",
    prep: "Signpost to local minor eye service only if commissioned and appropriate; urgent red flags need same-day escalation.",
    slotText: "Care nav: eye problem · minor eye service/GP per protocol",
    tone: "amber",
  },
];

function scoreScriptAgainstText(script, value = "") {
  const text = normalise(value);
  if (!text) return 0;
  const tokens = text.split(" ").filter((token) => token.length >= 3);
  let score = 0;

  [...(script.keywords || []), ...(script.names || [])].forEach((keyword) => {
    const safeKeyword = normalise(keyword);
    if (!safeKeyword) return;
    if (text === safeKeyword) score += 180;
    else if (text.includes(safeKeyword)) score += safeKeyword.includes(" ") ? 140 : 84;
  });

  tokens.forEach((token) => {
    (script.keywords || []).forEach((keyword) => {
      const keywordTokens = normalise(keyword).split(" ").filter(Boolean);
      if (keywordTokens.includes(token)) score += 38;
    });
    (script.names || []).forEach((name) => {
      const nameTokens = normalise(name).split(" ").filter(Boolean);
      if (nameTokens.includes(token)) score += 42;
    });
  });

  return score;
}

function getBestScriptFromText(value = "") {
  const scored = SCRIPT_LIBRARY
    .map((script) => ({ script, score: scoreScriptAgainstText(script, value) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.score >= 70 ? scored[0].script : null;
}

function getBestScriptFromPathway(pathway) {
  if (!pathway) return null;
  const name = normalise(pathway.name);
  const category = normalise(pathway.category);
  const directName = SCRIPT_LIBRARY.find((script) => (script.names || []).some((item) => normalise(item) === name));
  if (directName) return directName;

  const categoryMatch = SCRIPT_LIBRARY.find((script) => (script.categories || []).some((item) => normalise(item) === category));
  if (categoryMatch) return categoryMatch;

  return getBestScriptFromText([pathway.name, pathway.category, pathway.description, ...(pathway.synonyms || [])].join(" "));
}

function detectCareIntent(presentingRequest = "", pathway) {
  const callerScript = getBestScriptFromText(presentingRequest);
  if (callerScript) return callerScript.key;
  const pathwayScript = getBestScriptFromPathway(pathway);
  return pathwayScript?.key || "general";
}

function getGenericCategoryScript(pathway) {
  const category = normalise(pathway?.category || "");
  if (category.includes("access") || category.includes("appointment")) {
    return {
      key: "access",
      label: "Access / appointment request",
      redFlags: [
        "Caller mentions urgent symptoms or patient is very unwell?",
        "Home visit requested because patient cannot safely attend?",
        "Safeguarding, mental-health crisis or medication risk mentioned?",
      ],
      prompts: [
        "Caller is asking for appointment access rather than clinical advice?",
        "Correct clinician/room type is clear?",
        "Request can be completed by reception/admin workflow?",
      ],
      defaultAction: "Reception booking / duty clinician if urgent",
      defaultPractitioner: "Reception / Patient Coordinator",
      prep: "Route urgent clinical concerns to duty clinician; otherwise use standard access workflow.",
      slotText: "Care nav: access request · book according to local workflow",
      tone: "ok",
    };
  }

  return {
    key: "general",
    label: pathway?.category || "General clinical request",
    redFlags: [
      "Patient sounds or appears very unwell?",
      "Severe pain, collapse, breathing difficulty or new confusion?",
      "Symptoms started suddenly or are rapidly worsening today?",
      "Safeguarding, mental-health crisis or medication safety concern mentioned?",
    ],
    prompts: [
      "This is a symptom request rather than admin only?",
      "Patient is requesting a clinician appointment?",
      "Any pre-appointment action may help, such as sample/photo/observations?",
    ],
    defaultAction: pathway?.suggestedClinicTypes?.[0] || "Routine GP appointment",
    defaultPractitioner: pathway?.defaultPractitioner || "Jenny Moore — GP",
    prep: "Use approved local pathway rules before booking. This pathway still needs clinician-specific configuration.",
    slotText: pathway?.bookingSlotText || "Care nav completed · book according to approved pathway",
    tone: pathway?.risk === "High" ? "amber" : "ok",
  };
}

function getPathwayScript(pathway, presentingRequest = "") {
  if (!pathway || pathway.id === UNMATCHED_PATHWAY.id) {
    return {
      intent: "general",
      key: "general",
      label: "General request",
      redFlags: UNMATCHED_PATHWAY.redFlagPlaceholders,
      prompts: [
        "The caller's main problem is clear enough to route?",
        "Patient is asking for a clinician appointment?",
        "Any urgent symptom, safeguarding or medication risk has been ruled out?",
      ],
      defaultAction: "Ask for presenting request",
      defaultPractitioner: "Reception / Patient Coordinator",
      prep: "Clarify the main symptom or admin request before routing.",
      slotText: "Care nav: request not clear yet",
      tone: "neutral",
    };
  }

  const callerScript = getBestScriptFromText(presentingRequest);
  const pathwayScript = getBestScriptFromPathway(pathway);
  const script = callerScript || pathwayScript || getGenericCategoryScript(pathway);

  return {
    intent: script.key,
    key: script.key,
    label: script.label,
    redFlags: (script.redFlags || []).slice(0, 4),
    prompts: (script.prompts || []).slice(0, 3),
    defaultAction: script.defaultAction,
    defaultPractitioner: script.defaultPractitioner,
    prep: script.prep,
    slotText: script.slotText,
    tone: script.tone || "ok",
  };
}

function getAssignment(pathway, script) {
  const isAdmin = ["admin-results", "social-prescribing", "access"].includes(script?.intent || script?.key);
  return {
    clinicalOwner: pathway?.clinicalOwner || pathway?.owner || "Caitlin Clarke — GP Partner / sign-off clinician",
    signOffStatus: pathway?.signOffStatus || pathway?.status || "Draft",
    signedOffBy: pathway?.signedOffBy || "Not signed off",
    defaultPractitioner: pathway?.defaultPractitioner || script.defaultPractitioner || (isAdmin ? "Reception / Patient Coordinator" : "Jenny Moore — GP"),
    backupPractitioner: pathway?.backupPractitioner || "Duty clinician — configure rota source",
    defaultAction: pathway?.defaultBookingAction || script.defaultAction,
  };
}

function getYesAnswerText(routineAnswers = {}) {
  return normalise(Object.entries(routineAnswers).filter(([, value]) => value === "Yes").map(([question]) => question).join(" "));
}

function buildRecommendation({ selectedPathway, script, assignment, selectedRedFlags, routineAnswers, ageBracket, pharmacyContext, durationBand, knownIssue, presentingRequest }) {
  const hasRedFlag = selectedRedFlags.length > 0;
  const patientIsHighRiskAge = ["0-4", "65+"].includes(ageBracket) || ["Pregnant/postnatal", "Child"].includes(pharmacyContext);
  const pharmacyContextNormalised = normalise(pharmacyContext);
  const yesText = getYesAnswerText(routineAnswers);

  if (!presentingRequest.trim()) {
    return {
      urgency: "Start call",
      action: "Ask caller what they need help with",
      practitioner: "Reception / Patient Coordinator",
      prep: "Type the caller's own words first. The pathway and booking action will auto-populate.",
      slotText: "Care nav: request not entered",
      tone: "neutral",
    };
  }

  if (hasRedFlag) {
    return {
      urgency: "Urgent",
      action: "Stop routine booking — urgent clinician review",
      practitioner: assignment.backupPractitioner || "Duty clinician — configure rota source",
      prep: "Keep caller on the line where appropriate and follow approved emergency/local escalation SOP.",
      slotText: "CARE NAV RED FLAG — urgent clinician review required",
      tone: "danger",
    };
  }

  if (["chest-pain", "stroke-tia", "breathlessness", "safeguarding", "palliative"].includes(script.intent)) {
    return {
      urgency: "Same day",
      action: script.defaultAction,
      practitioner: assignment.backupPractitioner || script.defaultPractitioner,
      prep: script.prep,
      slotText: script.slotText,
      tone: script.tone || "amber",
    };
  }

  if (patientIsHighRiskAge && selectedPathway?.risk === "High") {
    return {
      urgency: "Same day",
      action: "Same-day GP/ANP review",
      practitioner: assignment.backupPractitioner || "Jenny Moore — GP",
      prep: "High-risk age/status selected. Use same-day clinical review unless local approved pathway says otherwise.",
      slotText: `Care nav: ${selectedPathway.name} · same-day clinician review`,
      tone: "amber",
    };
  }

  if (script.intent === "cough-respiratory" && (patientIsHighRiskAge || yesText.includes("shortness") || yesText.includes("wheeze") || yesText.includes("longer than 3 weeks"))) {
    return {
      urgency: "Clinician check",
      action: "GP/ANP respiratory review",
      practitioner: assignment.backupPractitioner || "Jenny Moore — GP",
      prep: "Respiratory symptoms with risk factors or persistent cough should be clinician-reviewed under local pathway.",
      slotText: "Care nav: cough/respiratory symptoms · GP/ANP review",
      tone: "amber",
    };
  }

  if (script.intent === "uti-urinary") {
    const pharmacyFirstPossible = ageBracket === "16-64" && pharmacyContextNormalised === "female" && knownIssue !== "Known condition";

    if (patientIsHighRiskAge || pharmacyContextNormalised === "male" || pharmacyContextNormalised.includes("pregnant")) {
      return {
        urgency: "Clinician check",
        action: "GP/ANP urinary review before Pharmacy First",
        practitioner: assignment.backupPractitioner || "Jenny Moore — GP",
        prep: "Male, pregnancy/postnatal, child, older/frail or high-risk urinary symptoms should be routed to clinician review unless the approved local pathway says otherwise.",
        slotText: "Care nav: urinary symptoms · clinician review before pharmacy route",
        tone: "amber",
      };
    }

    if (pharmacyFirstPossible) {
      return {
        urgency: "Routine",
        action: "Pharmacy First / urine sample per approved SOP",
        practitioner: "Community Pharmacy / Pharmacy First",
        prep: "Female 16-64 context selected. Use Pharmacy First only when approved local criteria are met; request urine sample only if local SOP allows.",
        slotText: "Care nav: urinary symptoms · Pharmacy First/sample per approved pathway",
        tone: "ok",
      };
    }
  }


  if (script.intent === "upper-airway-nasal") {
    return {
      urgency: patientIsHighRiskAge ? "Clinician check" : "Routine",
      action: patientIsHighRiskAge ? "GP/ANP review" : "Community Pharmacy / Pharmacy First if criteria met",
      practitioner: patientIsHighRiskAge ? (assignment.backupPractitioner || "Jenny Moore — GP") : "Community Pharmacy / Pharmacy First",
      prep: script.prep,
      slotText: script.slotText,
      tone: patientIsHighRiskAge ? "amber" : "ok",
    };
  }

  if (script.intent === "catheter") {
    return {
      urgency: "Same day",
      action: script.defaultAction,
      practitioner: assignment.backupPractitioner || script.defaultPractitioner,
      prep: script.prep,
      slotText: script.slotText,
      tone: "amber",
    };
  }

  return {
    urgency: selectedPathway?.risk === "High" || script.tone === "amber" ? "Clinician check" : "Routine",
    action: assignment.defaultAction || script.defaultAction,
    practitioner: assignment.defaultPractitioner || script.defaultPractitioner,
    prep: script.prep,
    slotText: script.slotText,
    tone: selectedPathway?.risk === "High" || script.tone === "amber" ? "amber" : "ok",
  };
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normaliseCapacityText(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function assignmentText(assignment = {}) {
  return normaliseCapacityText([
    assignment.staffName,
    assignment.role,
    assignment.team,
    assignment.room,
    assignment.activity,
    assignment.status,
  ].filter(Boolean).join(" "));
}

const CAPACITY_RULES = {
  urgent: {
    label: "same-day clinical capacity",
    roles: ["gp", "registrar", "anp", "advanced nurse", "nurse practitioner", "duty clinician"],
    fallback: "No GP/ANP visible in today’s working pattern — use duty escalation / SystmOne capacity check",
  },
  gpAnp: {
    label: "GP/ANP capacity",
    roles: ["gp", "registrar", "anp", "advanced nurse", "nurse practitioner"],
    fallback: "No GP/ANP visible in today’s working pattern — check SystmOne appointment book",
  },
  nurseAnp: {
    label: "nurse/ANP capacity",
    roles: ["anp", "advanced nurse", "practice nurse", "nurse"],
    fallback: "No nurse/ANP visible today — check SystmOne appointment book",
  },
  hca: {
    label: "HCA capacity",
    roles: ["hca", "healthcare assistant", "health care assistant"],
    fallback: "No HCA visible today — check HCA rota / SystmOne",
  },
  pharmacist: {
    label: "pharmacist capacity",
    roles: ["pharmacist", "pharmacy"],
    fallback: "No practice pharmacist visible today — use GP/ANP or external pharmacy route as approved",
  },
  reception: {
    label: "reception/admin capacity",
    roles: ["reception", "patient coordinator", "admin", "care navigator"],
    fallback: "No reception/admin session visible today — create task for team queue",
  },
  physio: {
    label: "FCP/physio capacity",
    roles: ["fcp", "physio", "physiotherapist", "first contact physio"],
    fallback: "No FCP/physio visible today — do not auto-route to FCP; use GP/ANP or minor injury route per SOP",
  },
};

function getCapacityRuleForScript(script = {}, recommendation = {}) {
  const intent = script.intent || script.key;
  const action = normaliseCapacityText(recommendation.action);
  const practitioner = normaliseCapacityText(recommendation.practitioner);

  if (["chest-pain", "stroke-tia", "breathlessness", "safeguarding", "palliative", "catheter"].includes(intent) || action.includes("urgent") || action.includes("same day")) {
    return CAPACITY_RULES.urgent;
  }

  if (intent === "msk-injury") return CAPACITY_RULES.physio;
  if (["skin-rash", "uti-urinary", "bladder-leakage", "mens-health", "womens-health", "general-symptoms", "headache-neuro", "abdominal-gi", "children", "older-frailty"].includes(intent)) return CAPACITY_RULES.gpAnp;
  if (["ltc-review", "vaccination"].includes(intent)) return CAPACITY_RULES.nurseAnp;
  if (intent === "lifestyle") return action.includes("hca") ? CAPACITY_RULES.hca : CAPACITY_RULES.reception;
  if (intent === "medication") return practitioner.includes("pharmacist") ? CAPACITY_RULES.pharmacist : CAPACITY_RULES.gpAnp;
  if (["admin-results", "social-prescribing", "access"].includes(intent)) return CAPACITY_RULES.reception;

  return CAPACITY_RULES.gpAnp;
}

function findAvailableAssignment(schedule = {}, rule = CAPACITY_RULES.gpAnp) {
  const assignments = Array.isArray(schedule.assignments) ? schedule.assignments : [];
  return assignments.find((assignment) => {
    const text = assignmentText(assignment);
    return (rule.roles || []).some((roleToken) => text.includes(roleToken));
  });
}

function formatAssignmentForCareNav(assignment) {
  if (!assignment) return "";
  const parts = [assignment.staffName, assignment.role].filter(Boolean).join(" — ");
  const whereWhen = [assignment.room, assignment.time].filter(Boolean).join(" · ");
  return whereWhen ? `${parts} (${whereWhen})` : parts;
}

function applyLiveCapacityToRecommendation({ recommendation, script, schedule, selectedRedFlags }) {
  const externalRoute = normaliseCapacityText(recommendation.practitioner).includes("community pharmacy") || normaliseCapacityText(recommendation.action).includes("pharmacy first");

  if (externalRoute && selectedRedFlags.length === 0) {
    return {
      ...recommendation,
      capacityStatus: "External / Pharmacy First route",
      capacityDetail: "Not matched to internal clinician capacity. Use only where local Pharmacy First criteria and sex/age criteria are met.",
    };
  }

  const rule = getCapacityRuleForScript(script, recommendation);
  const assignment = findAvailableAssignment(schedule, rule);

  if (assignment) {
    const clinician = formatAssignmentForCareNav(assignment);
    return {
      ...recommendation,
      practitioner: clinician,
      capacityStatus: `Matched to ${rule.label} today`,
      capacityDetail: `${assignment.staffName} is visible in the working pattern today: ${assignment.time || "time not recorded"}${assignment.room ? ` in ${assignment.room}` : ""}.`,
      slotText: `${recommendation.slotText} · book ${assignment.staffName}`,
    };
  }

  if ((script.intent || script.key) === "msk-injury") {
    const gpAnp = findAvailableAssignment(schedule, CAPACITY_RULES.gpAnp);
    if (gpAnp) {
      return {
        ...recommendation,
        action: "GP/ANP MSK review — no FCP visible today",
        practitioner: formatAssignmentForCareNav(gpAnp),
        capacityStatus: "FCP unavailable in working pattern",
        capacityDetail: "No FCP/physio session is visible today, so GPOP has not routed this to First Contact Physio.",
        slotText: `Care nav: MSK/injury · GP/ANP because FCP not visible today · book ${gpAnp.staffName}`,
        tone: recommendation.tone === "danger" ? "danger" : "amber",
      };
    }
  }

  return {
    ...recommendation,
    practitioner: rule.fallback,
    capacityStatus: `No ${rule.label} found today`,
    capacityDetail: "Working-pattern data is incomplete until SystmOne capacity import is connected. Reception should check the live appointment book before booking.",
    tone: recommendation.tone === "danger" ? "danger" : "amber",
  };
}

function TriageToggle({ question, value = "Not asked", onChange, tone = "neutral" }) {
  return (
    <div className={["triage-row-card", `triage-row-card-${tone}`, value === "Yes" ? "triage-row-card-yes" : ""].join(" ")}>
      <p>{question}</p>
      <div className="triage-row-buttons" role="group" aria-label={question}>
        {TRIAGE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? "triage-row-choice triage-row-choice-active" : "triage-row-choice"}
            onClick={() => onChange(option)}
          >
            {option === "Yes" && value === option ? <CheckCircle2 size={14} /> : null}
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div className="care-chip-group">
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? "care-quick-chip care-quick-chip-active" : "care-quick-chip"}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function MatchBadge({ pathway, confidence }) {
  if (!pathway || pathway.id === UNMATCHED_PATHWAY.id) {
    return <div className="care-match-badge care-match-badge-empty"><Sparkles size={16} /><strong>Start typing</strong><span>auto-match will appear here</span></div>;
  }

  return (
    <div className="care-match-badge">
      <Sparkles size={16} />
      <strong>Auto-matched: {pathway.name}</strong>
      <span>{confidence}% confidence · {pathway.status} · clinician sign-off required</span>
    </div>
  );
}

function SafetyPill({ selectedRedFlags, selectedPathway }) {
  if (selectedRedFlags.length > 0) {
    return <div className="care-live-risk care-live-risk-danger"><AlertTriangle size={18} /><strong>Red flag selected — stop routine booking</strong></div>;
  }

  if (!selectedPathway || selectedPathway.id === UNMATCHED_PATHWAY.id) {
    return <div className="care-live-risk"><Search size={18} /><strong>Enter request to auto-match</strong></div>;
  }

  if (selectedPathway?.status !== "Approved") {
    return <div className="care-live-risk care-live-risk-amber"><ShieldCheck size={18} /><strong>Prototype pathway — sign-off required</strong></div>;
  }

  return <div className="care-live-risk care-live-risk-ok"><CheckCircle2 size={18} /><strong>Approved pathway · no red flag selected</strong></div>;
}

export function CareNavigationPage({ staffList = [], holidayRequests = [] } = {}) {
  const [pathways, setPathways] = useLocalStorageState(
    CARE_NAVIGATION_PATHWAYS_STORAGE_KEY,
    getDefaultCareNavigationPathways()
  );
  const [notes, setNotes] = useLocalStorageState(
    CARE_NAVIGATION_NOTES_STORAGE_KEY,
    getDefaultSampleCareNavigationCalls()
  );

  const safePathways = useMemo(() => getSafeCareNavigationPathways(pathways), [pathways]);
  const safeNotes = useMemo(() => getSafeCareNavigationNotes(notes), [notes]);

  const [selectedPathwayId, setSelectedPathwayId] = useState(safePathways[0]?.id);
  const [presentingRequest, setPresentingRequest] = useState("");
  const [ageBracket, setAgeBracket] = useState("16-64");
  const [pharmacyContext, setPharmacyContext] = useState("Not asked");
  const [durationBand, setDurationBand] = useState("Not asked");
  const [knownIssue, setKnownIssue] = useState("New");
  const [selectedClinicType, setSelectedClinicType] = useState(getInitialClinicType(safePathways[0]));
  const [redFlagAnswers, setRedFlagAnswers] = useState({});
  const [routineAnswers, setRoutineAnswers] = useState({});
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [capacityDate, setCapacityDate] = useState(getTodayIso());
  const [saveMessage, setSaveMessage] = useState("");

  const [newPathwayName, setNewPathwayName] = useState("Medication query");
  const [newPathwayDescription, setNewPathwayDescription] = useState("Reception workflow for medicine-related requests.");
  const [newPathwayOwner, setNewPathwayOwner] = useState("Clinical Lead");
  const [newPathwayRisk, setNewPathwayRisk] = useState("High");
  const [newPathwaySource, setNewPathwaySource] = useState("Local draft");
  const [newRedFlag, setNewRedFlag] = useState("");
  const [newClinicType, setNewClinicType] = useState("");

  const autoMatches = useMemo(() => {
    if (presentingRequest.trim().length < 2) return [];
    return filterCareNavigationPathways(safePathways, presentingRequest, "All").slice(0, 3);
  }, [safePathways, presentingRequest]);

  const autoMatchedPathway = autoMatches[0] || null;
  const selectedPathway = autoMatchedPathway || UNMATCHED_PATHWAY;
  const matchConfidence = Math.min(99, Math.max(35, Math.round(((autoMatchedPathway?.fuzzyScore || 0) / 220) * 100)));

  useEffect(() => {
    if (!autoMatchedPathway) return;
    if (String(autoMatchedPathway.id) !== String(selectedPathwayId)) {
      setSelectedPathwayId(autoMatchedPathway.id);
      setRedFlagAnswers({});
      setRoutineAnswers({});
      setAdditionalNotes("");
      setSaveMessage("");
    }
  }, [autoMatchedPathway, selectedPathwayId]);

  const script = useMemo(() => getPathwayScript(selectedPathway, presentingRequest), [selectedPathway, presentingRequest]);
  const assignment = useMemo(() => getAssignment(selectedPathway, script), [selectedPathway, script]);

  const selectedSafetyStatus = useMemo(
    () => getPathwaySafetyStatus(selectedPathway),
    [selectedPathway]
  );

  const selectedRedFlags = useMemo(
    () => Object.entries(redFlagAnswers)
      .filter(([, answer]) => answer === "Yes")
      .map(([question]) => question),
    [redFlagAnswers]
  );

  const redFlagOutcome = useMemo(
    () => getRedFlagOutcome(selectedRedFlags),
    [selectedRedFlags]
  );

  const capacitySchedule = useMemo(
    () => getRoomScheduleForDate({
      profiles: staffList,
      requests: holidayRequests,
      date: capacityDate,
    }),
    [staffList, holidayRequests, capacityDate]
  );

  const baseRecommendation = useMemo(() => buildRecommendation({
    selectedPathway,
    script,
    assignment,
    selectedRedFlags,
    routineAnswers,
    ageBracket,
    pharmacyContext,
    durationBand,
    knownIssue,
    presentingRequest,
  }), [selectedPathway, script, assignment, selectedRedFlags, routineAnswers, ageBracket, pharmacyContext, durationBand, knownIssue, presentingRequest]);

  const recommendation = useMemo(
    () => applyLiveCapacityToRecommendation({
      recommendation: baseRecommendation,
      script,
      schedule: capacitySchedule,
      selectedRedFlags,
    }),
    [baseRecommendation, script, capacitySchedule, selectedRedFlags]
  );

  useEffect(() => {
    setSelectedClinicType(recommendation.action);
  }, [recommendation.action]);

  const visibleRedFlags = script.redFlags.slice(0, 4);
  const visibleRoutineQuestions = script.prompts.slice(0, 3);

  const pathwayMetrics = useMemo(
    () => getCareNavigationMetrics(safePathways, safeNotes),
    [safePathways, safeNotes]
  );

  const governanceMetrics = useMemo(
    () => getGovernanceChecklistMetrics(careNavigationGovernanceChecklist),
    []
  );

  const bookingTextPreview = buildBookingText({
    selectedPathway,
    presentingRequest,
    selectedClinicType,
    redFlagOutcome,
  });

  const systmOneNotePreview = buildSystmOneNote({
    selectedPathway,
    presentingRequest,
    duration: durationBand,
    knownIssue,
    selectedClinicType,
    supportingAction: recommendation.prep,
    selectedRedFlags,
    redFlagAnswers,
    redFlagSummary: "",
    routineAnswers,
    additionalNotes: [
      `Age/status: ${ageBracket}`,
      `Pharmacy First context: ${pharmacyContext}`,
      `Auto-matched pathway: ${selectedPathway.name}`,
      `Recommended practitioner: ${recommendation.practitioner}`,
      `Live capacity date: ${capacityDate}`,
      recommendation.capacityDetail,
      additionalNotes,
    ].filter(Boolean).join("\n"),
  });

  function updateRedFlagAnswer(question, answer) {
    setRedFlagAnswers((currentAnswers) => ({ ...currentAnswers, [question]: answer }));
  }

  function updateRoutineAnswer(question, answer) {
    setRoutineAnswers((currentAnswers) => ({ ...currentAnswers, [question]: answer }));
  }

  function submitPathway(event) {
    event.preventDefault();
    const newPathway = createCareNavigationPathway({
      name: newPathwayName,
      description: newPathwayDescription,
      owner: newPathwayOwner,
      risk: newPathwayRisk,
      source: newPathwaySource,
    });
    setPathways((currentPathways) => addCareNavigationPathway(currentPathways, newPathway));
    setSelectedPathwayId(newPathway.id);
    setNewPathwayName("");
  }

  function addRedFlag(event) {
    event.preventDefault();
    if (!autoMatchedPathway) return;
    setPathways((currentPathways) => addPathwayRedFlag(currentPathways, autoMatchedPathway.id, newRedFlag));
    setNewRedFlag("");
  }

  function addClinicType(event) {
    event.preventDefault();
    if (!autoMatchedPathway) return;
    setPathways((currentPathways) => addPathwayClinicType(currentPathways, autoMatchedPathway.id, newClinicType));
    setNewClinicType("");
  }

  function updateSelectedPathwayAssignment(changes) {
    if (!autoMatchedPathway) return;
    setPathways((currentPathways) => updateCareNavigationPathway(currentPathways, autoMatchedPathway.id, changes));
  }

  function saveLocalNote() {
    const newNote = createCareNavigationNote({
      selectedPathway,
      presentingRequest,
      selectedClinicType,
      supportingAction: recommendation.prep,
      selectedRedFlags,
      notePreview: systmOneNotePreview,
    });

    setNotes((currentNotes) => addCareNavigationNote(currentNotes, newNote));
    setSaveMessage("Local care navigation note saved to history.");
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(systmOneNotePreview);
      setSaveMessage("SystmOne note copied to clipboard.");
    } catch {
      setSaveMessage("Copy failed in this browser — select and copy the note manually.");
    }
  }

  function resetCall() {
    setPresentingRequest("");
    setAgeBracket("16-64");
    setPharmacyContext("Not asked");
    setDurationBand("Not asked");
    setKnownIssue("New");
    setRedFlagAnswers({});
    setRoutineAnswers({});
    setAdditionalNotes("");
    setSaveMessage("");
  }

  function resetCareNavigation() {
    const confirmed = window.confirm("Reset care navigation pathways and notes to demo data?");
    if (!confirmed) return;
    const defaultPathways = getDefaultCareNavigationPathways();
    setPathways(defaultPathways);
    setNotes(getDefaultSampleCareNavigationCalls());
    setSelectedPathwayId(defaultPathways[0].id);
    resetCall();
  }

  return (
    <>
      <PageHeader eyebrow="Care Navigation" title="Reception call console">
        Type the caller's own words. GPOP matches the pathway in the background, shows a short question set, and fills the booking action/practitioner. Prototype only until clinician sign-off.
      </PageHeader>

      <Panel className="care-sixty-console">
        <div className="care-sixty-intake-card">
          <label className="care-sixty-search">
            <Search size={22} />
            <input
              type="search"
              autoFocus
              placeholder="Caller says... e.g. leaking urine, sore throat, back pain, fit note, rash"
              value={presentingRequest}
              onChange={(event) => setPresentingRequest(event.target.value)}
            />
          </label>
          <MatchBadge pathway={autoMatchedPathway} confidence={matchConfidence} />
        </div>

        <div className="care-sixty-chip-board">
          <ChipGroup label="Age/status" options={AGE_BRACKETS} value={ageBracket} onChange={setAgeBracket} />
          <ChipGroup label="Pharmacy First context" options={PHARMACY_CONTEXT_OPTIONS} value={pharmacyContext} onChange={setPharmacyContext} />
          <ChipGroup label="Duration" options={DURATION_BANDS} value={durationBand} onChange={setDurationBand} />
          <ChipGroup label="Known issue" options={KNOWN_ISSUE_OPTIONS} value={knownIssue} onChange={setKnownIssue} />
          <label className="care-chip-group care-capacity-date">
            <span>Live capacity date</span>
            <input className={fieldClassName} type="date" value={capacityDate} onChange={(event) => setCapacityDate(event.target.value)} />
          </label>
        </div>

        <div className="care-sixty-main-grid">
          <main className="care-sixty-questions">
            <div className="care-sixty-step-head">
              <div>
                <span className="eyebrow">Step 1</span>
                <h2>Ask these questions</h2>
              </div>
              <SafetyPill selectedRedFlags={selectedRedFlags} selectedPathway={autoMatchedPathway} />
            </div>

            <div className="care-sixty-question-grid">
              <section className="care-sixty-question-panel care-sixty-red">
                <div className="care-sixty-panel-head">
                  <span>Safety screen</span>
                  <Badge>{selectedRedFlags.length ? `${selectedRedFlags.length} yes` : "none yes"}</Badge>
                </div>
                {visibleRedFlags.map((redFlag) => (
                  <TriageToggle
                    key={redFlag}
                    question={redFlag}
                    tone="danger"
                    value={redFlagAnswers[redFlag] || "Not asked"}
                    onChange={(answer) => updateRedFlagAnswer(redFlag, answer)}
                  />
                ))}
              </section>

              <section className="care-sixty-question-panel">
                <div className="care-sixty-panel-head">
                  <span>Key prompts for {script.label}</span>
                  <Badge>{visibleRoutineQuestions.length} prompts</Badge>
                </div>
                {visibleRoutineQuestions.map((question) => (
                  <TriageToggle
                    key={question}
                    question={question}
                    value={routineAnswers[question] || "Not asked"}
                    onChange={(answer) => updateRoutineAnswer(question, answer)}
                  />
                ))}
              </section>
            </div>

            <label className="care-sixty-short-note">
              <span>Optional exact wording / note for clinician</span>
              <input
                className={fieldClassName}
                placeholder="e.g. patient says leakage started after coughing, no pain"
                value={additionalNotes}
                onChange={(event) => setAdditionalNotes(event.target.value)}
              />
            </label>
          </main>

          <aside className={["care-sixty-decision", `care-sixty-decision-${recommendation.tone}`].join(" ")}>
            <span className="eyebrow">Auto booking output</span>
            <h2>{recommendation.action}</h2>
            <div className="care-decision-line">
              <UserCheck size={18} />
              <div>
                <span>Book / assign to</span>
                <strong>{recommendation.practitioner}</strong>
              </div>
            </div>
            <div className="care-decision-line">
              <Clock size={18} />
              <div>
                <span>Live capacity</span>
                <strong>{recommendation.capacityStatus}</strong>
                <small>{recommendation.capacityDetail}</small>
              </div>
            </div>
            <div className="care-decision-line">
              <ShieldCheck size={18} />
              <div>
                <span>Clinical sign-off owner</span>
                <strong>{assignment.clinicalOwner}</strong>
              </div>
            </div>
            <div className="care-decision-slot">
              <span>Slot text</span>
              <p>{recommendation.slotText || bookingTextPreview}</p>
            </div>
            <div className="care-decision-prep">
              <span>Before appointment</span>
              <p>{recommendation.prep}</p>
            </div>
            <div className="care-output-actions care-sixty-actions">
              <Button type="button" variant="primary" onClick={copyText} leftIcon={ClipboardCopy}>Copy S1 note</Button>
              <Button type="button" variant="secondary" onClick={saveLocalNote}>Save</Button>
              <Button type="button" variant="secondary" onClick={resetCall} leftIcon={RotateCcw}>Reset</Button>
            </div>
            {saveMessage ? <p className="care-save-message">{saveMessage}</p> : null}
            <details className="care-note-fold">
              <summary>Preview SystmOne note</summary>
              <pre className="care-note-preview care-note-preview-compact">{systmOneNotePreview}</pre>
            </details>
          </aside>
        </div>
      </Panel>

      <details className="care-admin-fold care-admin-fold-sixty">
        <summary>Clinical governance, pathway sign-off and practitioner assignment</summary>

        <section className="metric-grid care-nav-metric-strip care-nav-reception-metrics">
          <MetricCard title="Pathways" value={pathwayMetrics.totalPathways} detail="Prototype pathway shells" icon={Stethoscope} />
          <MetricCard title="Draft / locked" value={pathwayMetrics.draftPathways.length + pathwayMetrics.lockedPathways.length} detail="Clinical review required" icon={FileText} />
          <MetricCard title="Clinician sign-off" value={`${pathwayMetrics.approvedPathways.length}/${pathwayMetrics.totalPathways}`} detail="Approved locally in demo data" icon={ShieldCheck} />
          <MetricCard title="Saved notes" value={safeNotes.length} detail="Local mock call records" icon={ClipboardCopy} />
        </section>

        <AlertBanner tone="danger" title="Governed support only — not diagnosis" icon={AlertTriangle}>
          Do not use with real patients until every pathway has a clinical owner, source metadata, approval status, version control, review date, audit log and clinical safety sign-off. Sign-off should assign a default practitioner/role and backup route.
        </AlertBanner>

        <section className="content-grid care-builder-grid">
          <Panel className="panel care-signoff-panel">
            <SectionHeader eyebrow="Current matched pathway" title="Assign sign-off and default practitioner">
              This is where clinicians sign off a pathway and define which practitioner/role reception should auto-book by default.
            </SectionHeader>

            <div className="care-signoff-current">
              <strong>{autoMatchedPathway?.name || "No pathway matched yet"}</strong>
              <span>{autoMatchedPathway ? `${autoMatchedPathway.category} · ${selectedSafetyStatus.label}` : "Type a request above to match a pathway"}</span>
            </div>

            <div className="care-signoff-grid">
              <FormField label="Clinical owner / sign-off clinician">
                <select className={fieldClassName} value={assignment.clinicalOwner} onChange={(event) => updateSelectedPathwayAssignment({ clinicalOwner: event.target.value, owner: event.target.value })} disabled={!autoMatchedPathway}>
                  {PRACTITIONER_OPTIONS.filter((item) => item.includes("GP") || item.includes("ANP") || item.includes("Partner")).map((item) => <option key={item}>{item}</option>)}
                </select>
              </FormField>
              <FormField label="Default booking practitioner / role">
                <select className={fieldClassName} value={assignment.defaultPractitioner} onChange={(event) => updateSelectedPathwayAssignment({ defaultPractitioner: event.target.value })} disabled={!autoMatchedPathway}>
                  {PRACTITIONER_OPTIONS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </FormField>
              <FormField label="Backup / urgent practitioner">
                <select className={fieldClassName} value={assignment.backupPractitioner} onChange={(event) => updateSelectedPathwayAssignment({ backupPractitioner: event.target.value })} disabled={!autoMatchedPathway}>
                  {PRACTITIONER_OPTIONS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </FormField>
              <FormField label="Sign-off status">
                <select className={fieldClassName} value={assignment.signOffStatus} onChange={(event) => updateSelectedPathwayAssignment({ signOffStatus: event.target.value, status: event.target.value === "Approved" ? "Approved" : event.target.value === "Locked" ? "Locked" : "Draft", reviewStatus: event.target.value === "Approved" ? "Clinician sign-off recorded" : "Clinical review required" })} disabled={!autoMatchedPathway}>
                  {SIGN_OFF_STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </FormField>
            </div>

            <div className="policy-actions dashboard-section-spacing">
              <Button type="button" variant="primary" leftIcon={UserCheck} disabled={!autoMatchedPathway} onClick={() => updateSelectedPathwayAssignment({ status: "Approved", signOffStatus: "Approved", signedOffBy: assignment.clinicalOwner, reviewStatus: "Clinician sign-off recorded", risk: selectedPathway.risk === "High" ? "High" : "Medium", lastReviewed: new Date().toISOString().slice(0, 10) })}>Record sign-off</Button>
              <Button type="button" variant="danger" disabled={!autoMatchedPathway} onClick={() => updateSelectedPathwayAssignment({ status: "Locked", signOffStatus: "Locked", reviewStatus: "Locked pending governance", risk: "High" })}>Lock pathway</Button>
              <Button type="button" variant="secondary" onClick={resetCareNavigation}>Reset library</Button>
            </div>
          </Panel>

          <Panel className="panel">
            <SectionHeader eyebrow="Pathway builder" title="Create pathway draft">
              Add draft pathways, then assign clinical owner and practitioner routing before approving.
            </SectionHeader>

            <form className="audit-submit-form" onSubmit={submitPathway}>
              <FormField label="Pathway name"><input className={fieldClassName} value={newPathwayName} onChange={(event) => setNewPathwayName(event.target.value)} /></FormField>
              <FormField label="Description"><textarea className={fieldClassName} value={newPathwayDescription} onChange={(event) => setNewPathwayDescription(event.target.value)} /></FormField>
              <FormField label="Owner"><input className={fieldClassName} value={newPathwayOwner} onChange={(event) => setNewPathwayOwner(event.target.value)} /></FormField>
              <FormField label="Risk"><select className={fieldClassName} value={newPathwayRisk} onChange={(event) => setNewPathwayRisk(event.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></FormField>
              <FormField label="Source"><input className={fieldClassName} value={newPathwaySource} onChange={(event) => setNewPathwaySource(event.target.value)} /></FormField>
              <Button type="submit" variant="primary" leftIcon={PlusCircle}>Create pathway</Button>
            </form>
          </Panel>
        </section>

        <section className="content-grid care-governance-grid">
          <Panel className="panel">
            <SectionHeader eyebrow="Configure matched pathway" title="Prompts and actions">
              Add pathway-specific red flags and clinic/action options for the currently auto-matched pathway.
            </SectionHeader>

            <form className="inline-form" onSubmit={addRedFlag}>
              <input value={newRedFlag} onChange={(event) => setNewRedFlag(event.target.value)} placeholder="Add red flag prompt" disabled={!autoMatchedPathway} />
              <Button type="submit" variant="danger" disabled={!autoMatchedPathway}>Add red flag</Button>
            </form>

            <form className="inline-form dashboard-section-spacing" onSubmit={addClinicType}>
              <input value={newClinicType} onChange={(event) => setNewClinicType(event.target.value)} placeholder="Add clinic/action type" disabled={!autoMatchedPathway} />
              <Button type="submit" variant="primary" disabled={!autoMatchedPathway}>Add action</Button>
            </form>
          </Panel>

          <Panel className="panel">
            <SectionHeader eyebrow="Governance" title="Approval checklist">
              Required before this module can be used in a live practice setting.
            </SectionHeader>

            <div className="governance-alert-grid">
              {careNavigationGovernanceChecklist.map((item) => (
                <div className="governance-alert" key={item.id}>
                  <div><strong>{item.item}</strong><span>{item.note}</span></div>
                  <Badge>{item.status}</Badge>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <Panel className="panel">
          <SectionHeader eyebrow="Local history" title="Recent care navigation notes">
            Example records only. Real use would require authentication, audit logs, pathway versioning and secure storage.
          </SectionHeader>

          <DataTable
            columns={[
              { key: "date", label: "Date" },
              { key: "pathway", label: "Pathway" },
              { key: "contactType", label: "Contact type" },
              { key: "presentingRequest", label: "Request" },
              { key: "selectedClinicType", label: "Clinic/action" },
              { key: "status", label: "Status" },
            ]}
            rows={safeNotes}
            renderCell={(row, key) => {
              if (key === "date") return formatDate(row.date);
              if (key === "pathway") return <strong>{row.pathway}</strong>;
              if (key === "status" || key === "selectedClinicType") return <Badge>{row[key]}</Badge>;
              return row[key];
            }}
          />
        </Panel>
      </details>
    </>
  );
}
