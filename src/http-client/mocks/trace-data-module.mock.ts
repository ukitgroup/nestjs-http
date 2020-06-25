import { Module } from "@nestjs/common";
import { TraceDataServiceMock } from "./trace-data-service.mock";

@Module({
  providers: [TraceDataServiceMock],
  exports: [TraceDataServiceMock]
})
export class TraceDataServiceModuleMock {}
