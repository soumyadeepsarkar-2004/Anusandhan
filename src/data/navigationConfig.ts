import { 
  Compass, 
  ShieldCheck, 
  Award, 
  Mail, 
  Clock, 
  Kanban, 
  User, 
  Radio 
} from 'lucide-react';
import { AppTab } from '../components/app/MobileBottomNav';

export interface TabConfig {
  id: AppTab;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
}

export const WORKSPACE_TABS: TabConfig[] = [
  { 
    id: 'discover', 
    label: 'Discover Labs & Grants', 
    shortLabel: 'Labs', 
    icon: Compass,
    description: 'Autonomous multi-domain intelligence & faculty database'
  },
  { 
    id: 'diagnostic', 
    label: 'RRS Diagnostic Studio', 
    shortLabel: 'RRS', 
    icon: ShieldCheck,
    description: 'Simulate research readiness & calculate acceptance probability'
  },
  { 
    id: 'pitch', 
    label: 'Paper Pitch Canvas', 
    shortLabel: 'Pitch', 
    icon: Award,
    description: 'Deconstruct papers into verifiable proof-of-work contributions'
  },
  { 
    id: 'outreach', 
    label: '146w Pitch Composer', 
    shortLabel: 'Composer', 
    icon: Mail,
    description: 'Generate hyper-personalized literature-grounded outreach'
  },
  { 
    id: 'followups', 
    label: '7-Day Follow-ups', 
    shortLabel: 'Follow-ups', 
    icon: Clock,
    description: 'Automated polite pacing & sequential email tracking'
  },
  { 
    id: 'crm', 
    label: 'Application CRM', 
    shortLabel: 'CRM', 
    icon: Kanban,
    description: 'Track pipeline from outreach sent to professor interview'
  },
  { 
    id: 'profile', 
    label: 'Scholar Profile Hub', 
    shortLabel: 'Profile', 
    icon: User,
    description: 'Target domains, publications, institution, and CV audit'
  },
  { 
    id: 'livefeed', 
    label: 'Live Lab Feed', 
    shortLabel: 'Live Feed', 
    icon: Radio,
    description: 'Real-time telemetry of global lab postings & verifications'
  },
];
