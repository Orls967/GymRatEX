import { z } from 'zod';
import { L10n } from './l10n';

export const MUSCLE_REGIONS = [
  'neck',
  'chest',
  'shoulder',
  'arm',
  'forearm',
  'core',
  'back',
  'hip',
  'thigh',
  'leg',
] as const;
export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'kettlebell',
  'bodyweight',
  'machine',
  'cable',
  'bench',
  'bar',
] as const;
export const PATTERNS = ['squat', 'hinge', 'lunge', 'push', 'pull', 'carry', 'isolation'] as const;
export const STUDIO_PATTERNS = ['squat', 'hinge', 'lunge', 'ohp'] as const;
export const WEBCAM_MODES = ['squat', 'curl', 'ohp'] as const;

const Source = z.string().min(1);

export const Muscle = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: L10n,
  latin: z.string().min(1),
  region: z.enum(MUSCLE_REGIONS),
  /** 1 = superfisial, 2 = tengah, 3 = dalam */
  layer: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  /** Sisi tubuh tempat otot paling terlihat. */
  side: z.enum(['front', 'back']),
  origin: L10n,
  insertion: L10n,
  function: L10n,
  sources: z.array(Source).min(1),
  needsVerification: z.boolean(),
});
export type Muscle = z.infer<typeof Muscle>;

export const Exercise = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: L10n,
  equipment: z.array(z.enum(EQUIPMENT)).min(1),
  pattern: z.enum(PATTERNS),
  primary: z.array(z.string()).min(1),
  synergist: z.array(z.string()),
  stabilizer: z.array(z.string()),
  summary: L10n,
  cues: z.array(L10n).min(2),
  errors: z.array(z.string()),
  studio: z.enum(STUDIO_PATTERNS).optional(),
  webcam: z.enum(WEBCAM_MODES).optional(),
  needsVerification: z.boolean(),
});
export type Exercise = z.infer<typeof Exercise>;

export const GlossaryTerm = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  term: L10n,
  /** Variasi kata yang juga di-auto-link (per bahasa). */
  aliases: z.object({ id: z.array(z.string()), en: z.array(z.string()) }),
  definition: L10n,
  related: z.array(z.string()),
});
export type GlossaryTerm = z.infer<typeof GlossaryTerm>;

export const RISK_ZONES = ['knee', 'lumbar', 'shoulder', 'elbow', 'hip'] as const;

export const FormError = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  title: L10n,
  summary: L10n,
  why: L10n,
  fix: z.array(L10n).min(1),
  zones: z.array(z.enum(RISK_ZONES)).min(1),
  /** Gerakan yang dipakai untuk peragaan dua manekin. */
  demo: z.enum(['squat', 'hinge', 'bench']),
  /** Sudut kamera paling informatif. */
  view: z.enum(['front', 'side', 'top']),
  exercises: z.array(z.string()).min(1),
  needsVerification: z.boolean(),
});
export type FormError = z.infer<typeof FormError>;

export const AboutContent = z.object({
  disclaimer: z.array(L10n).min(1),
  limits: z.array(L10n).min(1),
  sources: z.array(z.object({ label: z.string(), note: L10n })).min(1),
  licenses: z.array(z.object({ name: z.string(), license: z.string(), note: L10n })).min(1),
});
