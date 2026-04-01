export class UpdateRfiDto {
  project: number;
  discipline: number;
  module: number;
  type_of_module: number;

  // relationship to pcms_itr
  // report_no: string;

  id_itr: number;
  id_template: number;
  requestor: number;
  // date_request: Date;
  submission_id: string;
  area_v2: number;
  location_v2: number;
  status_invitation: number;
}
