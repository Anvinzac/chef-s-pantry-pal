export interface AppInstance {
  id: string;
  name: string;
  templateId: string;
  ownerId: string;
  members: InstanceMember[];
  settings: InstanceSettings;
  createdAt: string;
  updatedAt: string;
}

export interface InstanceMember {
  userId: string;
  role: 'admin' | 'chef' | 'kitchen_staff' | 'viewer';
  permissions: string[];
  joinedAt: string;
}

export interface InstanceSettings {
  parentMode: boolean;
  editMode: boolean;
  defaultTemplate: string;
  errorCaptureEnabled: boolean;
}