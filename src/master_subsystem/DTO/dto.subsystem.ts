export class CreateSubsystemDTO {
  system_id: number;
  subsystem_name: string;
  subsystem_description?: string;
  status: string; // 'active' | 'inactive'
}
