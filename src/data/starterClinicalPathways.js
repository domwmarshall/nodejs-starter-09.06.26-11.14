export const starterClinicalPathways = [
  {
    id: "pathway-chest-pain",
    name: "Chest pain",
    category: "Urgent symptoms",
    synonyms: ["tight chest", "chest discomfort", "chest pressure", "heart pain", "angina", "rib pain"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires clinical review",
    risk: "High",
    sourceType: "Source metadata only",
    source: "NICE / NHS.uk / Local protocol metadata placeholder",
    sourceUrl: "https://www.nice.org.uk/",
    sourceOrganisation: "NICE / NHS / Local governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "Named GP clinical owner required",
    reviewStatus: "Clinical safety review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Locked from live use",
    description: "Reception-facing call structure for chest pain. Emergency escalation wording must be locally approved before use.",
    agePrompts: ["Adult", "Child", "Pregnancy flag"],
    redFlagQuestions: [
      "Severe or crushing chest pain now",
      "Shortness of breath, collapse, fainting or clamminess",
      "Pain spreading to arm, jaw, back or neck",
      "New confusion, blue lips or severe unwell appearance",
    ],
    routineQuestions: ["When did it start?", "Is the pain constant or intermittent?", "Any injury or recent strain?"],
    suggestedActions: ["Urgent clinician review", "Emergency escalation", "Routine GP appointment only if approved pathway permits"],
    suggestedClinicTypes: ["Urgent clinician review", "Emergency escalation", "Same-day GP"],
    supportingActions: ["None", "Ask caller to stay by phone", "Document exact words used", "Escalate to duty clinician"],
    bookingSlotText: "CARE NAV RED FLAG — urgent clinician review required",
    systmOneTemplate: "Chest pain care navigation call. Red-flag responses documented. Escalation decision made by approved local SOP / clinician.",
    hazardReferences: ["CN-H001", "CN-H002"],
  },
  {
    id: "pathway-shortness-breath",
    name: "Shortness of breath",
    category: "Urgent symptoms",
    synonyms: ["breathless", "difficulty breathing", "wheezy", "sob", "can't breathe"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires clinical review",
    risk: "High",
    sourceType: "Source metadata only",
    source: "NICE / NHS.uk / Local protocol metadata placeholder",
    sourceUrl: "https://www.nice.org.uk/",
    sourceOrganisation: "NICE / NHS / Local governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "Named GP clinical owner required",
    reviewStatus: "Clinical safety review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Locked from live use",
    description: "High-risk breathing presentation structure with deterministic escalation lockout.",
    agePrompts: ["Adult", "Child", "Asthma/COPD known issue", "Pregnancy flag"],
    redFlagQuestions: ["Severe breathlessness at rest", "Blue lips or collapse", "Unable to speak in full sentences", "Chest pain or new confusion"],
    routineQuestions: ["When did it start?", "Any cough, fever or wheeze?", "Known asthma/COPD or inhaler use?"],
    suggestedActions: ["Urgent clinician review", "Emergency escalation"],
    suggestedClinicTypes: ["Urgent clinician review", "Same-day GP"],
    supportingActions: ["Ask caller to stay by phone", "Document breathing severity wording"],
    bookingSlotText: "CARE NAV BREATHING CONCERN — urgent clinician review required",
    systmOneTemplate: "Shortness of breath care navigation call. Breathing severity and red flags documented.",
    hazardReferences: ["CN-H001"],
  },
  {
    id: "pathway-stroke-symptoms",
    name: "Stroke symptoms",
    category: "Urgent symptoms",
    synonyms: ["face drooping", "arm weakness", "slurred speech", "FAST", "TIA", "mini stroke"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires clinical review",
    risk: "High",
    sourceType: "Source metadata only",
    source: "NHS.uk / FAST / Local protocol metadata placeholder",
    sourceUrl: "https://www.nhs.uk/",
    sourceOrganisation: "NHS / Local governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "Named GP clinical owner required",
    reviewStatus: "Clinical safety review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Locked from live use",
    description: "Emergency symptom structure for suspected stroke/TIA. Must use approved local wording.",
    agePrompts: ["Any age"],
    redFlagQuestions: ["Face drooping", "Arm weakness", "Speech difficulty", "Sudden vision loss, severe dizziness or new weakness"],
    routineQuestions: ["Time symptoms started", "Are symptoms still present?"],
    suggestedActions: ["Emergency escalation", "Urgent clinician review"],
    suggestedClinicTypes: ["Emergency escalation"],
    supportingActions: ["Record time last known well", "Escalate immediately"],
    bookingSlotText: "CARE NAV SUSPECTED STROKE/TIA — emergency escalation",
    systmOneTemplate: "Suspected stroke/TIA call. FAST symptoms and time last known well documented.",
    hazardReferences: ["CN-H001", "CN-H004"],
  },
  {
    id: "pathway-back-pain",
    name: "Back pain",
    category: "MSK",
    synonyms: ["lower back", "sciatica", "lumbar pain", "spine pain", "backache"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires clinical review",
    risk: "High",
    sourceType: "Source metadata only",
    source: "NICE / NHS.uk / Local protocol metadata placeholder",
    sourceUrl: "https://www.nice.org.uk/",
    sourceOrganisation: "NICE / NHS / Local governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "Named GP clinical owner required",
    reviewStatus: "Clinical review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Prototype only",
    description: "Reception pathway draft for back pain, including cauda equina and systemic red-flag prompts.",
    agePrompts: ["Adult", "Child", "Older adult", "Pregnancy flag"],
    redFlagQuestions: ["Saddle numbness or loss of bladder/bowel control", "New leg weakness", "Fever, weight loss or cancer history", "Recent significant trauma"],
    routineQuestions: ["Duration", "Pain location", "Leg pain/numbness", "Work or injury trigger"],
    suggestedActions: ["Routine GP appointment", "First Contact Physiotherapy", "Urgent clinician review", "Pharmacy signposting"],
    suggestedClinicTypes: ["First Contact Physiotherapy", "Routine GP appointment", "Same-day GP"],
    supportingActions: ["None", "Text image upload link if visible injury/rash", "Safety-net wording"],
    bookingSlotText: "Care nav: back pain · book FCP or GP per approved pathway",
    systmOneTemplate: "Back pain care navigation call. Red flags checked. Duration and function documented.",
    hazardReferences: ["CN-H003"],
  },
  {
    id: "pathway-uti",
    name: "UTI symptoms",
    category: "Infection / urinary",
    synonyms: ["urine infection", "cystitis", "burning urine", "wee pain", "water infection", "urinary symptoms"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires clinical review",
    risk: "Medium",
    sourceType: "Source metadata only",
    source: "NHS.uk / Pharmacy First / Local protocol metadata placeholder",
    sourceUrl: "https://www.nhs.uk/",
    sourceOrganisation: "NHS / Local governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "Named GP clinical owner required",
    reviewStatus: "Clinical review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Prototype only",
    description: "UTI call structure with sample request, pharmacy signposting and escalation prompts.",
    agePrompts: ["Adult", "Child", "Pregnancy flag", "Male patient flag", "Catheter flag"],
    redFlagQuestions: ["Fever, flank pain or rigors", "Pregnancy", "Confusion or severe systemic illness", "Visible blood in urine"],
    routineQuestions: ["Symptoms and duration", "Frequency/urgency", "Previous UTIs", "Any sample already provided?"],
    suggestedActions: ["Urine sample", "Pharmacy signposting", "Practice Nurse", "Routine GP appointment", "Urgent clinician review"],
    suggestedClinicTypes: ["Urine sample request", "Pharmacy First", "Practice Nurse", "Same-day GP"],
    supportingActions: ["Collect urine sample pot", "Send sample instructions", "Safety-net wording"],
    bookingSlotText: "Care nav: UTI symptoms · sample/pharmacy/nurse per approved pathway",
    systmOneTemplate: "UTI symptoms care navigation call. Red flags, pregnancy/catheter/sex flags and sample plan documented.",
    hazardReferences: ["CN-H003"],
  },
  {
    id: "pathway-sore-throat",
    name: "Sore throat",
    category: "Infection / ENT",
    synonyms: ["throat pain", "tonsillitis", "swollen tonsils", "pain swallowing", "strep throat"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires clinical review",
    risk: "Medium",
    sourceType: "Source metadata only",
    source: "NHS.uk / Pharmacy First / Local protocol metadata placeholder",
    sourceUrl: "https://www.nhs.uk/",
    sourceOrganisation: "NHS / Local governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "Named GP clinical owner required",
    reviewStatus: "Clinical review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Prototype only",
    description: "Sore throat pathway draft with pharmacy and swab placeholders.",
    agePrompts: ["Adult", "Child", "Immunosuppression flag"],
    redFlagQuestions: ["Difficulty breathing", "Unable to swallow fluids or drooling", "Severe dehydration", "Neck swelling or severe systemic illness"],
    routineQuestions: ["Duration", "Fever", "Cough/cold symptoms", "Rash", "Exposure history"],
    suggestedActions: ["Pharmacy signposting", "Throat swab", "Routine GP appointment", "Urgent clinician review"],
    suggestedClinicTypes: ["Pharmacy First", "Routine GP appointment", "Throat swab request", "Same-day GP"],
    supportingActions: ["Collect throat swab", "Safety-net wording"],
    bookingSlotText: "Care nav: sore throat · pharmacy/swab/GP per approved pathway",
    systmOneTemplate: "Sore throat care navigation call. Red flags and pharmacy/swab suitability documented.",
    hazardReferences: ["CN-H003"],
  },
  {
    id: "pathway-rash-skin-lesion",
    name: "Rash / skin lesion",
    category: "Skin",
    synonyms: ["rash", "skin problem", "mole", "lesion", "spots", "eczema", "infected bite"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires clinical review",
    risk: "Medium",
    sourceType: "Source metadata only",
    source: "NHS.uk / Local protocol metadata placeholder",
    sourceUrl: "https://www.nhs.uk/",
    sourceOrganisation: "NHS / Local governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "Named GP clinical owner required",
    reviewStatus: "Clinical review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Prototype only",
    description: "Skin complaint pathway with image upload link placeholder and red-flag escalation.",
    agePrompts: ["Adult", "Child", "Immunosuppression flag"],
    redFlagQuestions: ["Non-blanching rash", "Rapid spreading redness or severe pain", "Facial swelling or breathing difficulty", "Fever or very unwell"],
    routineQuestions: ["Duration", "Location", "Itch/pain", "New products/medicines", "Photo available?"],
    suggestedActions: ["Text patient image upload link", "Pharmacy signposting", "Routine GP appointment", "Urgent clinician review"],
    suggestedClinicTypes: ["Text patient image upload link", "Routine GP appointment", "Pharmacy First", "Same-day GP"],
    supportingActions: ["Text image upload link", "Safety-net wording"],
    bookingSlotText: "Care nav: skin concern · image link/GP/pharmacy per approved pathway",
    systmOneTemplate: "Skin care navigation call. Red flags checked and image-link suitability documented.",
    hazardReferences: ["CN-H003"],
  },
  {
    id: "pathway-headache",
    name: "Headache",
    category: "Neurology",
    synonyms: ["migraine", "head pain", "pressure headache", "severe headache"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires clinical review",
    risk: "High",
    sourceType: "Source metadata only",
    source: "NICE / NHS.uk / Local protocol metadata placeholder",
    sourceUrl: "https://www.nice.org.uk/",
    sourceOrganisation: "NICE / NHS / Local governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "Named GP clinical owner required",
    reviewStatus: "Clinical safety review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Prototype only",
    description: "Headache pathway draft with neurological and sudden-onset prompts.",
    agePrompts: ["Adult", "Child", "Pregnancy/postpartum flag"],
    redFlagQuestions: ["Sudden worst-ever headache", "New weakness, confusion, seizure or speech change", "Fever with neck stiffness", "Head injury or pregnancy/postpartum concern"],
    routineQuestions: ["Duration", "Pattern", "Nausea/light sensitivity", "Previous migraine?"],
    suggestedActions: ["Urgent clinician review", "Routine GP appointment", "Pharmacy signposting"],
    suggestedClinicTypes: ["Same-day GP", "Routine GP appointment", "Pharmacy advice"],
    supportingActions: ["Safety-net wording", "Document exact onset time"],
    bookingSlotText: "Care nav: headache · GP/urgent review per approved pathway",
    systmOneTemplate: "Headache care navigation call. Red flags, onset and neurological symptoms documented.",
    hazardReferences: ["CN-H001", "CN-H003"],
  },
  {
    id: "pathway-abdominal-pain",
    name: "Abdominal pain",
    category: "Abdominal / GI",
    synonyms: ["stomach pain", "tummy ache", "belly pain", "abdo pain", "pelvic pain"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires clinical review",
    risk: "High",
    sourceType: "Source metadata only",
    source: "NICE / NHS.uk / Local protocol metadata placeholder",
    sourceUrl: "https://www.nice.org.uk/",
    sourceOrganisation: "NICE / NHS / Local governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "Named GP clinical owner required",
    reviewStatus: "Clinical safety review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Prototype only",
    description: "Abdominal pain pathway draft with urgent red flags and sample options.",
    agePrompts: ["Adult", "Child", "Pregnancy flag", "Older adult"],
    redFlagQuestions: ["Severe or worsening abdominal pain", "Collapse, black stools or vomiting blood", "Pregnancy or possible pregnancy", "Fever, rigid abdomen or severe dehydration"],
    routineQuestions: ["Location", "Duration", "Vomiting/diarrhoea", "Bowels/urine", "Pain score"],
    suggestedActions: ["Urgent clinician review", "Routine GP appointment", "Stool sample", "Urine sample"],
    suggestedClinicTypes: ["Same-day GP", "Routine GP appointment", "Nurse sample collection"],
    supportingActions: ["Collect urine sample pot", "Collect stool sample pot", "Safety-net wording"],
    bookingSlotText: "Care nav: abdominal pain · GP/sample plan per approved pathway",
    systmOneTemplate: "Abdominal pain care navigation call. Red flags, pregnancy flag and sample plan documented.",
    hazardReferences: ["CN-H001", "CN-H003"],
  },
  {
    id: "pathway-medication-query",
    name: "Medication query",
    category: "Medicines / admin",
    synonyms: ["prescription", "repeat", "meds", "side effect", "missing medication", "dose query"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires clinical review",
    risk: "Medium",
    sourceType: "Local SOP metadata only",
    source: "Local dispensary / medicines SOP placeholder",
    sourceUrl: "",
    sourceOrganisation: "Local practice governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "Practice Pharmacist / GP owner required",
    reviewStatus: "Clinical review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Prototype only",
    description: "Medication and prescription request routing for admin, pharmacist, dispenser or GP review.",
    agePrompts: ["Adult", "Child", "Pregnancy flag"],
    redFlagQuestions: ["Possible serious allergic reaction", "Severe side effect or acute deterioration", "Medication stopped and patient now unwell"],
    routineQuestions: ["Medicine name", "Issue type", "Urgency", "Last issue date if known"],
    suggestedActions: ["Admin request", "ARRS Pharmacist", "Dispenser task", "Routine GP appointment", "Urgent clinician review"],
    suggestedClinicTypes: ["Pharmacist task", "Dispenser task", "Admin request", "Routine GP appointment"],
    supportingActions: ["Ask patient to provide medicine name/photo", "Link to dispensary task"],
    bookingSlotText: "Care nav: medication query · route to pharmacy/dispensary/admin per SOP",
    systmOneTemplate: "Medication query care navigation call. Medicine, urgency and routing documented.",
    hazardReferences: ["CN-H005"],
  },
  {
    id: "pathway-fit-note-admin",
    name: "Fit note / admin request",
    category: "Admin",
    synonyms: ["sick note", "med3", "letter", "form", "report", "admin"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires operational review",
    risk: "Low",
    sourceType: "Local SOP metadata only",
    source: "Local admin SOP placeholder",
    sourceUrl: "",
    sourceOrganisation: "Local practice governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "Practice Manager / GP owner required",
    reviewStatus: "Operational review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Prototype only",
    description: "Administrative call routing for fit notes, forms and letters.",
    agePrompts: ["Adult", "Child/parent request"],
    redFlagQuestions: ["Patient is clinically worse and requesting urgent medical advice", "Mental health crisis disclosed during admin request"],
    routineQuestions: ["Request type", "Dates needed", "Employer/school wording required", "Has clinician already reviewed?"],
    suggestedActions: ["Admin request", "Routine GP appointment", "Reception task"],
    suggestedClinicTypes: ["Admin request", "Routine GP appointment", "Telephone admin slot"],
    supportingActions: ["Ask patient to submit document/photo", "Set admin task"],
    bookingSlotText: "Care nav: fit note/admin request · route to admin/GP per SOP",
    systmOneTemplate: "Admin request care navigation call. Request type, dates and document need documented.",
    hazardReferences: ["CN-H006"],
  },
  {
    id: "pathway-adhd-referral",
    name: "ADHD referral request",
    category: "Mental health / neurodevelopmental",
    synonyms: ["adhd", "attention deficit", "right to choose", "assessment", "neurodiversity"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires clinical review",
    risk: "Medium",
    sourceType: "Local SOP metadata only",
    source: "Local referral SOP placeholder",
    sourceUrl: "",
    sourceOrganisation: "Local practice governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "GP / Mental health lead required",
    reviewStatus: "Clinical review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Prototype only",
    description: "Structured admin/clinical routing for ADHD assessment requests and right-to-choose enquiries.",
    agePrompts: ["Adult", "Child/parent request", "Existing diagnosis"],
    redFlagQuestions: ["Risk of harm to self or others", "Severe crisis or safeguarding concern"],
    routineQuestions: ["Adult or child request", "Existing diagnosis?", "Right to Choose provider mentioned?", "Forms submitted?"],
    suggestedActions: ["Admin request", "Routine GP appointment", "Mental health signposting"],
    suggestedClinicTypes: ["Admin request", "Routine GP appointment", "Telephone GP"],
    supportingActions: ["Send questionnaire link", "Request school/work collateral if SOP requires"],
    bookingSlotText: "Care nav: ADHD referral request · admin/GP route per SOP",
    systmOneTemplate: "ADHD referral request. Age group, provider request and risk screen documented.",
    hazardReferences: ["CN-H007"],
  },
  {
    id: "pathway-mental-health",
    name: "Mental health concern",
    category: "Mental health",
    synonyms: ["depression", "anxiety", "panic", "stress", "low mood", "mental health", "suicidal"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires clinical review",
    risk: "High",
    sourceType: "Source metadata only",
    source: "NHS.uk / Local mental health crisis SOP metadata placeholder",
    sourceUrl: "https://www.nhs.uk/",
    sourceOrganisation: "NHS / Local governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "GP / Mental health lead required",
    reviewStatus: "Clinical safety review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Prototype only",
    description: "Mental health reception workflow with deterministic crisis lockout.",
    agePrompts: ["Adult", "Child/young person", "Safeguarding flag"],
    redFlagQuestions: ["Current risk of suicide or self-harm", "Risk to others", "Psychosis, severe agitation or immediate safeguarding concern"],
    routineQuestions: ["Main concern", "Duration", "Current support", "Medication query?"],
    suggestedActions: ["Urgent clinician review", "Routine GP appointment", "Social prescribing", "Mental health signposting"],
    suggestedClinicTypes: ["Same-day GP", "Routine GP appointment", "Social prescriber", "Mental health practitioner"],
    supportingActions: ["Crisis signposting per approved local SOP", "Safety-net wording"],
    bookingSlotText: "Care nav: mental health concern · risk screened, route per approved SOP",
    systmOneTemplate: "Mental health care navigation call. Risk screen, duration and routing documented.",
    hazardReferences: ["CN-H001", "CN-H007"],
  },
  {
    id: "pathway-loneliness-social-prescribing",
    name: "Loneliness / social prescribing",
    category: "Social prescribing",
    synonyms: ["lonely", "isolated", "social support", "befriending", "money worries", "housing support"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires operational review",
    risk: "Low",
    sourceType: "Local social prescribing directory metadata only",
    source: "PCN social prescribing directory placeholder",
    sourceUrl: "",
    sourceOrganisation: "PCN / Local practice governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "PCN Manager / Social Prescribing Lead required",
    reviewStatus: "Operational review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Prototype only",
    description: "Low-risk support routing for isolation and non-clinical support needs, with safeguarding prompts.",
    agePrompts: ["Adult", "Older adult", "Carer", "Safeguarding flag"],
    redFlagQuestions: ["Immediate risk of harm", "Safeguarding concern", "Severe neglect or crisis"],
    routineQuestions: ["What support is needed?", "Consent to referral?", "Preferred contact method?"],
    suggestedActions: ["Social prescribing", "Admin request", "Routine GP appointment if clinical concern"],
    suggestedClinicTypes: ["Social prescriber", "Reception task", "Routine GP appointment"],
    supportingActions: ["Social prescribing referral", "Community directory signposting"],
    bookingSlotText: "Care nav: social prescribing support · refer per PCN SOP",
    systmOneTemplate: "Social prescribing care navigation call. Support need, consent and risk prompts documented.",
    hazardReferences: ["CN-H007"],
  },
  {
    id: "pathway-minor-injury-thumb",
    name: "Minor injury / sore thumb",
    category: "Minor injury / MSK",
    synonyms: ["sore thumb", "finger injury", "sprain", "minor injury", "hand injury", "cut finger"],
    version: "v1 prototype",
    status: "Prototype",
    approvalStatus: "Requires clinical review",
    risk: "Medium",
    sourceType: "Local SOP metadata only",
    source: "Local minor injury SOP placeholder",
    sourceUrl: "",
    sourceOrganisation: "Local practice governance",
    sourceRetrievedDate: "2026-06-06",
    owner: "Clinical Lead required",
    reviewStatus: "Clinical review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Prototype only",
    description: "Minor injury and sore thumb routing, including image link and injury escalation prompts.",
    agePrompts: ["Adult", "Child", "Work injury"],
    redFlagQuestions: ["Severe deformity or suspected fracture", "Numb/cold/blue finger", "Deep wound or heavy bleeding", "Bite injury or infection spreading"],
    routineQuestions: ["When did it happen?", "Mechanism", "Swelling/bruising", "Can they move it?"],
    suggestedActions: ["Text patient image upload link", "Minor injury signposting", "Routine GP appointment", "Urgent clinician review"],
    suggestedClinicTypes: ["Text patient image upload link", "Same-day GP", "Routine GP appointment", "Minor injury unit signposting"],
    supportingActions: ["Text image upload link", "Safety-net wording"],
    bookingSlotText: "Care nav: minor injury/sore thumb · image link/minor injury route per SOP",
    systmOneTemplate: "Minor injury care navigation call. Mechanism, red flags, movement and image-link plan documented.",
    hazardReferences: ["CN-H003"],
  },
];



const expandedPrototypeBlueprints = [
  [
    "Acne",
    "Skin",
    [
      "spots",
      "pimples"
    ],
    "Low"
  ],
  [
    "Allergic reaction",
    "Urgent symptoms",
    [
      "allergy",
      "hives",
      "swelling"
    ],
    "High"
  ],
  [
    "Ankle injury",
    "MSK / injury",
    [
      "twisted ankle",
      "sprain"
    ],
    "Medium"
  ],
  [
    "Anxiety symptoms",
    "Mental health",
    [
      "panic",
      "worry",
      "stress"
    ],
    "Medium"
  ],
  [
    "Asthma review request",
    "Long-term condition",
    [
      "inhaler review",
      "wheeze"
    ],
    "Medium"
  ],
  [
    "Back pain follow-up",
    "MSK / injury",
    [
      "back ache",
      "spine pain"
    ],
    "Medium"
  ],
  [
    "Bite or sting",
    "Skin",
    [
      "insect bite",
      "wasp sting",
      "tick bite"
    ],
    "Medium"
  ],
  [
    "Blood pressure query",
    "Long-term condition",
    [
      "hypertension",
      "bp reading"
    ],
    "Medium"
  ],
  [
    "Blood test request",
    "Admin / results",
    [
      "bloods",
      "phlebotomy"
    ],
    "Low"
  ],
  [
    "Bowel habit change",
    "Abdominal / GI",
    [
      "constipation",
      "diarrhoea",
      "change in stools"
    ],
    "High"
  ],
  [
    "Breast lump or pain",
    "Women’s health",
    [
      "breast pain",
      "lump",
      "nipple change"
    ],
    "High"
  ],
  [
    "Burns and scalds",
    "MSK / injury",
    [
      "burn",
      "scald"
    ],
    "Medium"
  ],
  [
    "Carer stress",
    "Social prescribing",
    [
      "carer",
      "support",
      "overwhelmed"
    ],
    "Medium"
  ],
  [
    "Cervical screening query",
    "Women’s health",
    [
      "smear",
      "cervical screening"
    ],
    "Low"
  ],
  [
    "Child fever",
    "Children",
    [
      "temperature child",
      "hot child"
    ],
    "High"
  ],
  [
    "Child rash",
    "Children",
    [
      "rash child",
      "spots child"
    ],
    "High"
  ],
  [
    "Child vomiting or diarrhoea",
    "Children",
    [
      "sickness child",
      "diarrhoea child"
    ],
    "High"
  ],
  [
    "COPD review request",
    "Long-term condition",
    [
      "copd",
      "breathless review"
    ],
    "Medium"
  ],
  [
    "Cough",
    "Respiratory",
    [
      "coughing",
      "chesty cough"
    ],
    "Medium"
  ],
  [
    "Contraception request",
    "Women’s health",
    [
      "pill",
      "implant",
      "coil"
    ],
    "Medium"
  ],
  [
    "Depression symptoms",
    "Mental health",
    [
      "low mood",
      "depressed"
    ],
    "High"
  ],
  [
    "Diabetes review query",
    "Long-term condition",
    [
      "diabetes",
      "blood sugar",
      "hba1c"
    ],
    "Medium"
  ],
  [
    "Dizziness",
    "Neurology",
    [
      "light headed",
      "vertigo",
      "woozy"
    ],
    "High"
  ],
  [
    "Ear pain",
    "ENT",
    [
      "earache",
      "blocked ear"
    ],
    "Medium"
  ],
  [
    "Eye problem",
    "Eye",
    [
      "red eye",
      "eye pain",
      "vision"
    ],
    "High"
  ],
  [
    "Falls risk",
    "Older people",
    [
      "fall",
      "unsteady",
      "balance"
    ],
    "High"
  ],
  [
    "Fatigue",
    "General symptoms",
    [
      "tiredness",
      "exhausted"
    ],
    "Medium"
  ],
  [
    "Fit note request",
    "Admin / results",
    [
      "sick note",
      "med3"
    ],
    "Low"
  ],
  [
    "Flu-like illness",
    "Respiratory",
    [
      "flu",
      "viral",
      "temperature"
    ],
    "Medium"
  ],
  [
    "Foot problem",
    "MSK / injury",
    [
      "foot pain",
      "toe pain"
    ],
    "Medium"
  ],
  [
    "Gender identity referral request",
    "Admin / referral",
    [
      "gender referral",
      "GIC"
    ],
    "Low"
  ],
  [
    "Gout flare",
    "MSK / injury",
    [
      "gout",
      "hot joint"
    ],
    "Medium"
  ],
  [
    "Hair loss",
    "Skin",
    [
      "alopecia",
      "thinning hair"
    ],
    "Low"
  ],
  [
    "Hay fever",
    "ENT",
    [
      "allergic rhinitis",
      "pollen"
    ],
    "Low"
  ],
  [
    "Head injury",
    "MSK / injury",
    [
      "hit head",
      "banged head"
    ],
    "High"
  ],
  [
    "Hearing loss",
    "ENT",
    [
      "deaf",
      "reduced hearing"
    ],
    "Medium"
  ],
  [
    "Heartburn or reflux",
    "Abdominal / GI",
    [
      "indigestion",
      "acid reflux"
    ],
    "Medium"
  ],
  [
    "Heavy periods",
    "Women’s health",
    [
      "menorrhagia",
      "bleeding"
    ],
    "Medium"
  ],
  [
    "Hoarse voice",
    "ENT",
    [
      "voice change",
      "laryngitis"
    ],
    "Medium"
  ],
  [
    "Home visit request",
    "Access / appointments",
    [
      "housebound",
      "home visit"
    ],
    "High"
  ],
  [
    "Immunisation query",
    "Vaccination",
    [
      "vaccine",
      "jab",
      "immunisation"
    ],
    "Low"
  ],
  [
    "Insomnia",
    "Mental health",
    [
      "sleep problem",
      "can't sleep"
    ],
    "Medium"
  ],
  [
    "Joint pain",
    "MSK / injury",
    [
      "arthritis",
      "painful joint"
    ],
    "Medium"
  ],
  [
    "Knee pain",
    "MSK / injury",
    [
      "knee injury",
      "knee swelling"
    ],
    "Medium"
  ],
  [
    "Leg swelling",
    "General symptoms",
    [
      "swollen leg",
      "oedema"
    ],
    "High"
  ],
  [
    "Loneliness / isolation",
    "Social prescribing",
    [
      "lonely",
      "isolated"
    ],
    "Medium"
  ],
  [
    "Medication side effect",
    "Medicines",
    [
      "side effects",
      "reaction to tablets"
    ],
    "High"
  ],
  [
    "Medication supply issue",
    "Medicines",
    [
      "out of medication",
      "repeat issue"
    ],
    "Medium"
  ],
  [
    "Memory concern",
    "Older people",
    [
      "dementia",
      "forgetful"
    ],
    "Medium"
  ],
  [
    "Menopause support",
    "Women’s health",
    [
      "HRT",
      "hot flushes"
    ],
    "Low"
  ],
  [
    "Mole change",
    "Skin",
    [
      "mole",
      "skin lesion",
      "changing mole"
    ],
    "High"
  ],
  [
    "Nail problem",
    "Skin",
    [
      "nail infection",
      "nail pain"
    ],
    "Low"
  ],
  [
    "Nausea or vomiting",
    "Abdominal / GI",
    [
      "sickness",
      "vomiting"
    ],
    "Medium"
  ],
  [
    "Neck pain",
    "MSK / injury",
    [
      "stiff neck",
      "neck ache"
    ],
    "High"
  ],
  [
    "New pregnancy",
    "Women’s health",
    [
      "pregnant",
      "positive test"
    ],
    "Medium"
  ],

  [
    "Post-nasal drip / nasal discharge",
    "Upper airway / nasal symptoms",
    [
      "nasal drip",
      "post nasal drip",
      "postnasal drip",
      "dripping nose",
      "runny nose",
      "blocked nose",
      "rhinorrhoea",
      "rhinitis",
      "mucus in throat",
      "catarrh",
      "nasal congestion"
    ],
    "Low"
  ],
  [
    "Nose bleed",
    "ENT",
    [
      "epistaxis",
      "bleeding nose"
    ],
    "Medium"
  ],
  [
    "Palpitations",
    "Cardiology",
    [
      "racing heart",
      "irregular heartbeat"
    ],
    "High"
  ],
  [
    "Pelvic pain",
    "Women’s health",
    [
      "lower abdo",
      "pelvic"
    ],
    "High"
  ],
  [
    "Period problem",
    "Women’s health",
    [
      "irregular periods",
      "missed period"
    ],
    "Medium"
  ],
  [
    "Postnatal concern",
    "Women’s health",
    [
      "after birth",
      "postpartum"
    ],
    "High"
  ],
  [
    "Pregnancy bleeding",
    "Women’s health",
    [
      "bleeding pregnant",
      "pregnancy pain"
    ],
    "High"
  ],
  [
    "Prescription request",
    "Medicines",
    [
      "repeat prescription",
      "medication request"
    ],
    "Low"
  ],
  [
    "Rectal bleeding",
    "Abdominal / GI",
    [
      "blood in stool",
      "bleeding from back passage"
    ],
    "High"
  ],
  [
    "Referral chase",
    "Admin / referral",
    [
      "referral update",
      "hospital letter"
    ],
    "Low"
  ],
  [
    "Results query",
    "Admin / results",
    [
      "test results",
      "blood results"
    ],
    "Low"
  ],
  [
    "Safeguarding concern",
    "Safeguarding",
    [
      "domestic abuse",
      "safety concern"
    ],
    "High"
  ],
  [
    "Scrotal pain",
    "Men’s health",
    [
      "testicular pain",
      "testicle"
    ],
    "High"
  ],
  [
    "Shoulder pain",
    "MSK / injury",
    [
      "shoulder injury",
      "rotator cuff"
    ],
    "Medium"
  ],
  [
    "Sinus symptoms",
    "ENT",
    [
      "sinusitis",
      "facial pain"
    ],
    "Low"
  ],
  [
    "Smoking cessation",
    "Lifestyle",
    [
      "stop smoking",
      "quit smoking"
    ],
    "Low"
  ],
  [
    "Sore mouth or ulcers",
    "ENT",
    [
      "mouth ulcer",
      "oral pain"
    ],
    "Medium"
  ],
  [
    "Stomach bloating",
    "Abdominal / GI",
    [
      "bloating",
      "wind"
    ],
    "Medium"
  ],
  [
    "Stress at work",
    "Mental health",
    [
      "work stress",
      "burnout"
    ],
    "Medium"
  ],
  [
    "Suicidal thoughts",
    "Mental health",
    [
      "self harm",
      "crisis",
      "suicide"
    ],
    "High"
  ],
  [
    "Swollen gland",
    "ENT",
    [
      "neck lump",
      "lymph node"
    ],
    "Medium"
  ],
  [
    "Thrush symptoms",
    "Women’s health",
    [
      "vaginal itching",
      "discharge"
    ],
    "Medium"
  ],
  [
    "Tinnitus",
    "ENT",
    [
      "ringing ears",
      "buzzing"
    ],
    "Low"
  ],
  [
    "Travel vaccination",
    "Vaccination",
    [
      "travel jab",
      "holiday vaccines"
    ],
    "Low"
  ],
  [
    "Urine sample request",
    "Urinary",
    [
      "urine pot",
      "sample"
    ],
    "Low"
  ],
  [
    "Vaginal bleeding",
    "Women’s health",
    [
      "bleeding",
      "post menopausal bleeding"
    ],
    "High"
  ],
  [
    "Weight loss",
    "General symptoms",
    [
      "losing weight",
      "unintentional weight"
    ],
    "High"
  ],
  [
    "Weight management",
    "Lifestyle",
    [
      "obesity",
      "weight help"
    ],
    "Low"
  ],
  [
    "Wound check",
    "Skin",
    [
      "cut",
      "stitches",
      "dressing"
    ],
    "Medium"
  ],
  [
    "Wrist or hand pain",
    "MSK / injury",
    [
      "hand injury",
      "wrist pain"
    ],
    "Medium"
  ],
  [
    "Abnormal LFTs result query",
    "Admin / results",
    [
      "liver bloods",
      "lft"
    ],
    "Medium"
  ],
  [
    "Adult ADHD referral",
    "Admin / referral",
    [
      "adhd",
      "neurodiversity"
    ],
    "Low"
  ],
  [
    "Adult autism referral",
    "Admin / referral",
    [
      "autism",
      "asd"
    ],
    "Low"
  ],
  [
    "Alcohol support",
    "Lifestyle",
    [
      "drinking",
      "alcohol"
    ],
    "Medium"
  ],
  [
    "Animal bite",
    "Skin",
    [
      "dog bite",
      "cat bite"
    ],
    "Medium"
  ],
  [
    "Anticoagulation query",
    "Medicines",
    [
      "warfarin",
      "DOAC",
      "blood thinner"
    ],
    "High"
  ],
  [
    "Asthma attack concern",
    "Respiratory",
    [
      "wheeze now",
      "asthma worse"
    ],
    "High"
  ],
  [
    "Bereavement support",
    "Mental health",
    [
      "grief",
      "bereaved"
    ],
    "Medium"
  ],
  [
    "Bladder leakage",
    "Urinary",
    [
      "incontinence",
      "leaking urine"
    ],
    "Medium"
  ],
  [
    "Bruising",
    "General symptoms",
    [
      "easy bruising",
      "purple marks"
    ],
    "Medium"
  ],
  [
    "Care home call",
    "Care homes",
    [
      "nursing home",
      "residential home"
    ],
    "High"
  ],
  [
    "Catheter problem",
    "Urinary",
    [
      "catheter blocked",
      "catheter leaking"
    ],
    "High"
  ],
  [
    "Cellulitis concern",
    "Skin",
    [
      "red hot skin",
      "leg infection"
    ],
    "High"
  ],
  [
    "Child abdominal pain",
    "Children",
    [
      "tummy pain child",
      "abdo child"
    ],
    "High"
  ],
  [
    "Child cough",
    "Children",
    [
      "cough child",
      "breathing child"
    ],
    "High"
  ],
  [
    "Child ear pain",
    "Children",
    [
      "earache child",
      "ear infection"
    ],
    "Medium"
  ],
  [
    "Child mental health",
    "Children",
    [
      "CAMHS",
      "child anxiety"
    ],
    "High"
  ],
  [
    "COVID / respiratory infection",
    "Respiratory",
    [
      "covid",
      "positive test"
    ],
    "Medium"
  ],
  [
    "Dental problem",
    "ENT",
    [
      "tooth pain",
      "dental abscess"
    ],
    "Medium"
  ],
  [
    "Dementia carer query",
    "Older people",
    [
      "dementia support",
      "memory clinic"
    ],
    "Medium"
  ],
  [
    "Domestic abuse disclosure",
    "Safeguarding",
    [
      "abuse",
      "unsafe at home"
    ],
    "High"
  ],
  [
    "Drug monitoring bloods",
    "Medicines",
    [
      "monitoring",
      "methotrexate",
      "lithium"
    ],
    "Medium"
  ],
  [
    "Emergency contraception",
    "Women’s health",
    [
      "morning after",
      "emergency pill"
    ],
    "Medium"
  ],
  [
    "End of life medication query",
    "Palliative care",
    [
      "palliative",
      "anticipatory meds"
    ],
    "High"
  ],
  [
    "Erectile dysfunction",
    "Men’s health",
    [
      "ED",
      "impotence"
    ],
    "Medium"
  ],
  [
    "Facial weakness",
    "Urgent symptoms",
    [
      "face droop",
      "stroke"
    ],
    "High"
  ],
  [
    "Fainting",
    "General symptoms",
    [
      "blackout",
      "syncope"
    ],
    "High"
  ],
  [
    "Frailty review",
    "Older people",
    [
      "frail",
      "falls",
      "housebound"
    ],
    "Medium"
  ],
  [
    "Genital rash",
    "Sexual health",
    [
      "genital sore",
      "STI"
    ],
    "Medium"
  ],
  [
    "HRT review",
    "Women’s health",
    [
      "HRT repeat",
      "menopause meds"
    ],
    "Low"
  ],
  [
    "Low mood medication review",
    "Mental health",
    [
      "antidepressant",
      "SSRI"
    ],
    "Medium"
  ],
  [
    "Medication dose query",
    "Medicines",
    [
      "dose",
      "how much"
    ],
    "Medium"
  ],
  [
    "Missed pill",
    "Women’s health",
    [
      "contraceptive pill",
      "missed tablet"
    ],
    "Medium"
  ],
  [
    "New confusion",
    "Urgent symptoms",
    [
      "delirium",
      "confused"
    ],
    "High"
  ],
  [
    "Numbness or tingling",
    "Neurology",
    [
      "pins and needles",
      "numb"
    ],
    "High"
  ],
  [
    "Pain relief request",
    "Medicines",
    [
      "painkillers",
      "analgesia"
    ],
    "Medium"
  ],
  [
    "Palliative care concern",
    "Palliative care",
    [
      "end of life",
      "symptom control"
    ],
    "High"
  ],
  [
    "Pharmacy First referral",
    "Access / appointments",
    [
      "pharmacy",
      "minor illness"
    ],
    "Low"
  ],
  [
    "Prostate symptoms",
    "Men’s health",
    [
      "urinary frequency",
      "prostate"
    ],
    "Medium"
  ],
  [
    "Repeat dispensing query",
    "Dispensary",
    [
      "batch prescriptions",
      "dispensing"
    ],
    "Low"
  ],
  [
    "Safeguarding child concern",
    "Safeguarding",
    [
      "child protection",
      "neglect"
    ],
    "High"
  ],
  [
    "Seizure",
    "Neurology",
    [
      "fit",
      "convulsion"
    ],
    "High"
  ],
  [
    "Sexual health query",
    "Sexual health",
    [
      "STI",
      "sexual health"
    ],
    "Medium"
  ],
  [
    "Shingles",
    "Skin",
    [
      "shingles rash",
      "nerve pain rash"
    ],
    "Medium"
  ],
  [
    "Social prescriber referral",
    "Social prescribing",
    [
      "social support",
      "benefits"
    ],
    "Low"
  ],
  [
    "Speech change",
    "Urgent symptoms",
    [
      "slurred speech",
      "stroke symptom"
    ],
    "High"
  ],
  [
    "Tiredness after infection",
    "General symptoms",
    [
      "post viral",
      "fatigue"
    ],
    "Low"
  ],
  [
    "Toe infection",
    "Skin",
    [
      "ingrown toenail",
      "toe red"
    ],
    "Medium"
  ],
  [
    "Vertigo",
    "Neurology",
    [
      "spinning",
      "dizzy"
    ],
    "Medium"
  ],
  [
    "Vitamin deficiency query",
    "Admin / results",
    [
      "b12",
      "vitamin d"
    ],
    "Low"
  ]
];

function slugifyPathwayName(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function defaultRedFlagsForCategory(category, risk) {
  const universal = [
    "Severe symptoms or rapidly worsening condition",
    "Patient sounds or appears very unwell",
    "New confusion, collapse, severe weakness or breathing difficulty",
  ];

  const byCategory = {
    "Children": ["Child under 3 months with fever or serious parental concern", "Reduced responsiveness, poor feeding or dehydration concern"],
    "Mental health": ["Current thoughts of self-harm or suicide", "Immediate risk to self, others or safeguarding concern"],
    "Women’s health": ["Pregnancy with pain, heavy bleeding or feeling very unwell", "Severe pelvic pain or collapse"],
    "Urgent symptoms": ["Time-critical symptom such as chest pain, stroke symptoms or severe breathlessness", "Collapse, blue lips or severe distress"],
    "Skin": ["Non-blanching rash, facial swelling or breathing difficulty", "Rapidly spreading redness, severe pain or fever"],
    "Respiratory": ["Severe breathlessness, blue lips or unable to speak in sentences", "Chest pain or collapse"],
    "Upper airway / nasal symptoms": ["Breathing difficulty, facial or eye swelling, severe one-sided facial pain", "Heavy nose bleed, head injury or patient sounds very unwell"],
    "MSK / injury": ["Major trauma, deformity, new weakness or numbness", "Head injury with concerning features"],
    "Abdominal / GI": ["Severe abdominal pain, collapse, vomiting blood or black stools", "Pregnancy, severe dehydration or blood in stool"],
    "Medicines": ["Possible serious reaction, overdose or allergic reaction", "Medication critical to safety is unavailable"],
    "Safeguarding": ["Immediate risk of harm", "Unsafe to speak or disclosure of abuse"],
  };

  return [...(byCategory[category] || []), ...universal].slice(0, risk === "High" ? 5 : 4);
}

function routineQuestionsForCategory(category) {
  const common = [
    "This is a symptom request rather than admin only?",
    "Patient is requesting a clinician appointment?",
    "Any pre-appointment action may help, such as sample/photo/observations?",
  ];
  const byCategory = {
    "Admin / results": ["This is a results/document request rather than symptoms?", "GP/clinician response is required?", "Relevant result/document has arrived at the practice?"],
    "Admin / referral": ["This is a new referral request?", "Referral/sign-off information is already available?", "GP/clinician sign-off is required?"],
    "Medicines": ["Repeat prescription/supply issue is the main request?", "Side effect or dose-change question is being asked?", "Medication is needed today to avoid risk?"],
    "Dispensary": ["Dispensary supply issue is the main request?", "Medication is needed today to avoid risk?", "Pharmacist/GP review is required?"],
    "Skin": ["Photo link would be useful and appropriate?", "Rash/skin area is painful, spreading or infected-looking?", "New/changing mole or bleeding lesion?"],
    "Children": ["Child is drinking and passing urine/wet nappies normally?", "Symptoms started today or are worsening?", "Parent/carer is requesting same-day clinician contact?"],
    "Mental health": ["Patient is safe right now?", "Any thoughts of self-harm or harm to others?", "Urgent clinician support is needed today?"],
    "Women’s health": ["Pregnancy or possible pregnancy is relevant?", "Bleeding, pain or infection symptoms are present?", "Routine contraception/HRT/screening advice is the main request?"],
    "Men’s health": ["Urinary symptoms are present?", "New lump, swelling or pain is present?", "Medication/sexual function advice is the main request?"],
    "Urinary": ["Burning, frequency or urgency is present?", "Able to provide urine sample before review?", "New leakage, catheter or retention concern?"],
    "Respiratory": ["Fever or flu-like symptoms?", "Wheeze, chest tightness or shortness of breath?", "Cough has lasted longer than 3 weeks?"],
    "ENT": ["Fever or feeling significantly unwell?", "Symptoms mainly ear, throat, nose/sinus or mouth?", "Pharmacy First/minor illness route may be suitable?"],
    "Upper airway / nasal symptoms": ["Blocked/runny nose or post-nasal drip is the main issue?", "Facial pain, sinus pressure or thick discharge is present?", "Hay fever/allergy symptoms such as sneezing or itchy eyes are present?"],
    "MSK / injury": ["Started after injury, fall or lifting?", "Pain travels into arm/leg with numbness or pins and needles?", "Physiotherapy/minor injury route may be suitable?"],
    "Abdominal / GI": ["Pain is present now?", "Vomiting/diarrhoea or dehydration is present?", "Blood in stool or black stool is mentioned?"],
    "Neurology": ["Symptoms started suddenly today?", "Dizziness/vertigo affects walking or safety?", "Known migraine/vertigo pattern and no new features?"],
    "Older people": ["This is new deterioration rather than routine review?", "Care home/carer can provide observations?", "Home visit/duty clinician review may be needed?"],
    "Palliative care": ["Medication or symptom control is the main issue?", "District nurse/palliative team already involved?", "Same-day clinician action is needed?"],
    "Social prescribing": ["Social prescriber/care coordinator support is the main request?", "Patient consents to referral/contact?", "A clinician also needs to review a health concern?"],
    "Lifestyle": ["Patient wants planned lifestyle support rather than urgent medical help?", "HCA/social prescribing appointment may be suitable?", "Patient consents to local support referral?"],
    "Vaccination": ["This is routine immunisation/travel advice?", "Patient knows destination/date if travel-related?", "Nurse/HCA vaccination clinic is appropriate locally?"],
    "Safeguarding": ["Caller is safe to continue the call?", "A named patient/child/vulnerable adult is involved?", "Safeguarding lead/duty clinician should be alerted now?"],
    "Eye": ["Optician/minor eye service may be suitable locally?", "Symptoms are in one eye only?", "There is discharge/itch rather than pain/vision loss?"],
    "Access / appointments": ["Caller is asking for appointment access rather than clinical advice?", "Correct clinician/room type is clear?", "Request can be completed by reception/admin workflow?"],
    "Long-term condition": ["This is a routine review request rather than acute symptoms?", "Patient has readings/results to bring or upload?", "Nurse/HCA appointment type fits the local protocol?"],
    "Care homes": ["Care home reports new deterioration?", "Observations are available?", "Same-day duty clinician review may be needed?"],
  };
  return [...(byCategory[category] || []), ...common].slice(0, 6);
}

function suggestedClinicTypesForCategory(category, risk) {
  if (risk === "High") return ["Urgent clinician review", "Same-day GP", "Emergency escalation if approved SOP requires"];
  const byCategory = {
    "Medicines": ["Pharmacist", "Dispensary task", "GP medication review"],
    "Admin / results": ["Admin task", "GP results review", "Reception message"],
    "Admin / referral": ["Admin referral task", "GP review", "Care navigator follow-up"],
    "Skin": ["Text patient image upload link", "Pharmacy First", "Routine GP appointment"],
    "Upper airway / nasal symptoms": ["Community Pharmacy / Pharmacy First if approved criteria met", "Routine GP/ANP if persistent or red flags", "Self-care advice under approved local SOP"],
    "Vaccination": ["Practice Nurse", "HCA / vaccination clinic", "Admin advice"],
    "Lifestyle": ["HCA", "Social prescriber", "Routine GP appointment"],
    "Social prescribing": ["Social prescriber", "Care coordinator", "Routine GP appointment"],
  };
  return byCategory[category] || ["Routine GP appointment", "Same-day GP if clinically indicated", "Practice Nurse / HCA if local SOP allows"];
}

function createExpandedPrototypePathway([name, category, synonyms, risk]) {
  return {
    id: `pathway-${slugifyPathwayName(name)}`,
    name,
    category,
    synonyms,
    version: "v1 prototype shell",
    status: "Prototype",
    approvalStatus: "Requires clinical review",
    risk,
    sourceType: "Source metadata only",
    source: "NICE / NHS.uk / ICB / local protocol metadata placeholder",
    sourceUrl: "",
    sourceOrganisation: "Local governance required",
    sourceRetrievedDate: "Not retrieved",
    owner: "Named GP / clinician sign-off required",
    reviewStatus: "Clinical review required",
    lastReviewed: "Not reviewed",
    nextReview: "Not set",
    safetyStatus: "Prototype only",
    description: `${name} reception-facing pathway shell. Routing prompts only; no live use until clinically approved, versioned and source-linked.`,
    redFlagQuestions: defaultRedFlagsForCategory(category, risk),
    routineQuestions: routineQuestionsForCategory(category),
    suggestedActions: suggestedClinicTypesForCategory(category, risk),
    suggestedClinicTypes: suggestedClinicTypesForCategory(category, risk),
    supportingActions: ["None", "Text patient image upload link", "Ask patient to provide urine sample", "Ask patient to collect stool sample pot", "Ask patient to collect throat swab", "Safety-net wording only"],
    bookingSlotText: `Care nav: ${name} · book according to approved local pathway`,
    systmOneTemplate: `${name} care navigation call. Red flags and routine questions documented.`,
    hazardReferences: risk === "High" ? ["CN-H001", "CN-H003", "CN-H004"] : ["CN-H003"],
  };
}

const existingExpandedNames = new Set(starterClinicalPathways.map((pathway) => String(pathway.name).toLowerCase()));
expandedPrototypeBlueprints.forEach((blueprint) => {
  if (!existingExpandedNames.has(String(blueprint[0]).toLowerCase())) {
    starterClinicalPathways.push(createExpandedPrototypePathway(blueprint));
  }
});

export const clinicalHazardLogSeed = [
  {
    id: "CN-H001",
    title: "High-risk symptom incorrectly routed as routine",
    severity: "High",
    mitigation: "Explicit deterministic red-flag lockout, visible governance status and mandatory clinician-approved escalation wording.",
  },
  {
    id: "CN-H002",
    title: "Emergency wording used without local approval",
    severity: "High",
    mitigation: "All emergency pathways remain prototype/locked until named clinical owner and approval record exist.",
  },
  {
    id: "CN-H003",
    title: "Reception script misses an important red flag",
    severity: "High",
    mitigation: "Versioned questions, source metadata, review dates and pathway approval workflow.",
  },
  {
    id: "CN-H004",
    title: "Time-critical symptom not escalated quickly",
    severity: "High",
    mitigation: "Emergency category, high-risk visual status and routine booking blocked when red flags selected.",
  },
  {
    id: "CN-H005",
    title: "Medication query routed without pharmacy/clinical oversight",
    severity: "Medium",
    mitigation: "Medicines pathways owned by pharmacist/GP and audit logged before production use.",
  },
  {
    id: "CN-H006",
    title: "Admin workflow generates clinical advice by accident",
    severity: "Medium",
    mitigation: "Admin pathways limited to routing and note-building; clinical concerns trigger GP review.",
  },
  {
    id: "CN-H007",
    title: "Safeguarding or mental-health risk not recognised",
    severity: "High",
    mitigation: "Risk prompts appear even in low-risk social/admin flows; crisis content requires local approval.",
  },
];
