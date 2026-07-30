export interface EvidenceReference {
  id: string;
  title: string;
  organization: string;
  url: string;
  note: string;
}

export const evidenceReferences: EvidenceReference[] = [
  {
    id: "eau-luts",
    title: "Management of Non-neurogenic Male Lower Urinary Tract Symptoms",
    organization: "European Association of Urology",
    url: "https://uroweb.org/guidelines/management-of-non-neurogenic-male-luts",
    note: "Guía oficial para evaluación y manejo de síntomas urinarios masculinos.",
  },
  {
    id: "aua-bph",
    title: "Benign Prostatic Hyperplasia Guideline",
    organization: "American Urological Association",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/benign-prostatic-hyperplasia-(bph)-guideline",
    note: "Guía clínica oficial sobre síntomas urinarios y crecimiento prostático benigno.",
  },
  {
    id: "aua-ed",
    title: "Erectile Dysfunction Guideline",
    organization: "American Urological Association",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/erectile-dysfunction-(ed)-guideline",
    note: "Guía oficial para evaluación clínica de la función eréctil.",
  },
  {
    id: "aua-cpp",
    title: "Male Chronic Pelvic Pain Guideline",
    organization: "American Urological Association",
    url: "https://www.auanet.org/guidelines-and-quality/guidelines/male-chronic-pelvic-pain",
    note: "Guía oficial para dolor pélvico crónico masculino.",
  },
  {
    id: "iciq",
    title: "International Consultation on Incontinence Questionnaire Project",
    organization: "ICIQ / Bristol Urological Institute",
    url: "https://iciq.net/",
    note: "Información oficial sobre módulos, licencias y permisos de reproducción.",
  },
  {
    id: "ipss-validation",
    title: "The American Urological Association symptom index for benign prostatic hyperplasia",
    organization: "Journal of Urology / PubMed",
    url: "https://pubmed.ncbi.nlm.nih.gov/1279218/",
    note: "Publicación original del índice sintomático que dio origen al IPSS.",
  },
];

export const LAST_CLINICAL_CONTENT_REVIEW = "30 de julio de 2026";
