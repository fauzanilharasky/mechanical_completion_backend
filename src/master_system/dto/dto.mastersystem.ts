export class CreateMasterSystemDTO {
  start: number;       // offset
  length: number;      // limit
  search?: string;     // global search
  filters?: {
    projectName?: string;
    systemName?: string;
    description?: string;
  };
}