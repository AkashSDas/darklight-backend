import { SchemaTypes } from "mongoose";

import { prop } from "@typegoose/typegoose";

/** Attachment Typegoose Class */
export class TAttachmentClass {
  @prop({ type: SchemaTypes.String })
  name: string;

  @prop({ type: SchemaTypes.String })
  description?: string;

  @prop({ type: SchemaTypes.String })
  id?: string;

  @prop({ type: SchemaTypes.String, required: true })
  URL: string;
}
