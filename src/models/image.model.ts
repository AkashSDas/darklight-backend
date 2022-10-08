import { SchemaTypes } from "mongoose";

import { prop } from "@typegoose/typegoose";

/** Image Typegoose Class */
export class TImageClass {
  @prop({ type: SchemaTypes.String })
  id?: string;

  @prop({ type: SchemaTypes.String, required: true })
  URL: string;
}
