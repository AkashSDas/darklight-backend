import { SchemaTypes } from "mongoose";

import { prop } from "@typegoose/typegoose";

/** Video Typegoose Class */
// TODO: Add methods for getting video duration
export class TVideoClass {
  @prop({ type: SchemaTypes.String })
  id?: string;

  @prop({ type: SchemaTypes.String, required: true })
  URL: string;
}
