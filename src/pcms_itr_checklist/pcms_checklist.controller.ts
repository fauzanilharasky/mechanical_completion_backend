import { promises } from 'dns';
import { Controller, Get, Post, Param, Body, Put, Delete, Query, Req, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PcmsItrChecklist } from './pcms_checklist.entity';
import { PcmsItrChecklistService } from './pcms_checklist.services';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { access } from 'fs';
import { AssignItrDto } from 'DTO/dto.assignment_itr';
import { submitInspectionDto } from 'DTO/dto.submit_inspection';



@Controller('api/pcms_checklist')
@ApiBearerAuth('access-token')
export class PcmsItrChecklistController {
   
    constructor(private readonly pcmsItrChecklistService: PcmsItrChecklistService ) {}

    // -------------- SUBMIT CHECKLIST DATA ----------------

   @Post('/assignment_rfi')
    async submitInspection(
      @Body() data: submitInspectionDto,
    ): Promise<void> {
        
      return this.pcmsItrChecklistService.submitInspection(
        data
      );
    }


    // ------------------------- SUBMIT RE-OFFER TO CLIENT -----------------------------

    @Post('/submit_reoffer')
    async submitReoffer(
      @Body() data: submitInspectionDto,
    ): Promise<void> {
        
      return this.pcmsItrChecklistService.submitReOffer(
        data
      );
    }


    // ------------------------- SUBMIT Post-Pone TO CLIENT -----------------------------

    @Post('/submit_postpone')
    async submitPostPone(
      @Body() data: submitInspectionDto,
    ): Promise<void> {
        
      return this.pcmsItrChecklistService.submitPostPone(
        data
      );
    }


    // ----------------------------- SUBMIT APPROVE WITH COMMENT ---------------------------
    @Post('/submit_comment')
    async submitApproveComment(
      @Body() data: submitInspectionDto,
    ): Promise<void> {
        
      return this.pcmsItrChecklistService.submitApproveComment(
        data
      );
    }


    // assignment QC
    @Post('/assignment_qc')
    async submitPendingQc(
      @Body() data: submitInspectionDto,
    ): Promise<void> {
        
      return this.pcmsItrChecklistService.submitPendingQc(
        data
      );
    }


    // --------------- SUBMIT CHECKLIST DATA TO CLIENT ----------------
    @Post('/assignment_client')
    async submitPendingClient(
      @Body() data: submitInspectionDto,
    ): Promise<void> {
        
      return this.pcmsItrChecklistService.submitPendingClient(
        data
      );
    }

    // --------------- APPROVE CHECKLIST DATA ----------------
    @Post('/approve_client')
    async approveClient(
      @Body() data: submitInspectionDto,
    ): Promise<void> {
        
      return this.pcmsItrChecklistService.approveClient(
        data
      );
    }
    

    // --------------- POSTPONE CHECKLIST DATA ----------------
    @Post('/postpone_client')
    async postPoneClient(
      @Body() data: submitInspectionDto,
    ): Promise<void> {
        
      return this.pcmsItrChecklistService.postPoneClient(
        data
      );
    } 


    @Post('/reoffer_client')
    async reOfferClient(
      @Body() data: submitInspectionDto,
    ): Promise<void> {
        
      return this.pcmsItrChecklistService.reOfferClient(
        data
      );
    }


    // ----------------- Update Checklist -------------------
    @Put('/update_checklist')
    async updateChecklist(@Body() data: submitInspectionDto,
      ): Promise<void> {
      return this.pcmsItrChecklistService.updateChecklist(
        data
      );
    }

    // @Get('checklist/:itr_id')
    // async getChecklist(
    //   @Param('itrId') itrId: number ) {
    //     return await this.pcmsItrChecklistService.getChecklist(itrId);
    //   }

  // @Get('/detail_data')
  // async getDetailSubmission
    

}