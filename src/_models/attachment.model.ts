import { prop } from "@typegoose/typegoose";
import { SchemaTypes } from "mongoose";

export enum FileType {
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  DOCUMENT = "document",
}

export class AttachmentClass {
  @prop({ type: SchemaTypes.String, maxlength: 60, required: true })
  name: string;

  @prop({ type: SchemaTypes.String, maxlength: 120 })
  description?: string;

  @prop({ type: SchemaTypes.String })
  id?: string;

  @prop({ type: SchemaTypes.String, required: true })
  URL: string;

  @prop({ type: SchemaTypes.String, required: true, enum: FileType })
  fileType: FileType;
}
