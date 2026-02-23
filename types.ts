export enum RepairStatus {
  RECEIVED = 'Received',
  DIAGNOSING = 'Diagnosing',
  WAITING_PARTS = 'Waiting for Parts',
  IN_PROGRESS = 'In Progress',
  READY = 'Ready for Pickup',
  COMPLETED = 'Completed'
}

export interface RepairPart {
  id: number;
  category: 'module' | 'part';
  name: string;
  partNumber: string;
  warranty?: boolean;
}

export interface DroneSpecs {
  manufacturer: string;
  model: string;
  serialNumber: string;
}

export interface RepairJob {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  drone: DroneSpecs;
  issueDescription: string;
  aiDiagnosis?: string;
  status: RepairStatus;
  receivedDate: string;
  estimatedCost: number;
  isPaid?: boolean;
  images: string[];
  technicianNotes: string[];
  technician?: string; // Added technician field
  clientSignature?: string; // Data URL
  parts?: RepairPart[]; // Added parts tracking
  timeline: { status: RepairStatus; date: string }[];
  notificationPreferences?: {
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
  };
}

export interface AiDiagnosisResponse {
  likelyIssue: string;
  recommendedActions: string[];
  estimatedDifficulty: 'Low' | 'Medium' | 'High';
}